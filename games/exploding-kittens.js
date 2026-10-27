// games/exploding-kittens.js
// 爆炸猫 — Russian roulette card game. Avoid drawing Exploding Kittens!

exports.name = 'exploding-kittens';
exports.maxPlayers = 6;

function createDeck(playerCount) {
  playerCount = playerCount || 2;
  const deck = [];
  // Official deck: 6 explode, 4 defuse, (4 nope — omitted), 4 attack, 4 skip, 4 shuffle,
  // 4 favor, 4 steal, 5 future. Scale non-essential cards for larger groups.
  const scale = Math.max(1, Math.ceil(playerCount / 2));

  // Exploding Kittens (official: 6)
  for (let i = 0; i < 6; i++) deck.push({ type: 'explode', id: 'explode-' + i });
  // Defuses (official: 4)
  for (let i = 0; i < 4; i++) deck.push({ type: 'defuse', id: 'defuse-' + i });
  // Nope is left out: this version has no reaction window, so it would be a dead card
  // Attack (official: 4)
  for (let i = 0; i < 4 * scale; i++) deck.push({ type: 'attack', id: 'attack-' + i });
  // Skip (official: 4)
  for (let i = 0; i < 4 * scale; i++) deck.push({ type: 'skip', id: 'skip-' + i });
  // See the Future (official: 5)
  for (let i = 0; i < 5 * scale; i++) deck.push({ type: 'future', id: 'future-' + i });
  // Shuffle (official: 4)
  for (let i = 0; i < 4 * scale; i++) deck.push({ type: 'shuffle', id: 'shuffle-' + i });
  // Favor (official: 4)
  for (let i = 0; i < 4 * scale; i++) deck.push({ type: 'favor', id: 'favor-' + i });
  // Steal (official: 4)
  for (let i = 0; i < 4 * scale; i++) deck.push({ type: 'steal', id: 'steal-' + i });
  return deck;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

exports.createState = () => ({
  deck: [],           // draw pile
  discard: [],        // discard pile
  hands: [],          // per-player hand
  currentPlayer: 0,
  winner: null,
  alive: [],          // per-player: bool
  extraTurns: [],     // per-player: remaining extra turns
  futureCards: null,  // result of See the Future (visible only to current player)
  phase: 'play',      // 'play' | 'draw' | 'reinsert' | 'over'
  pendingKitten: null, // { player, card } while a survivor privately chooses a position
  peekedCards: null,  // cards seen by current player via Future
  lastSteal: null,    // { stealer, victim, cardType } — shown as notification then cleared
  lastAction: null,   // { player, type, seq, target? } — public play/explosion log
  actionSeq: 0,       // increments on each lastAction (used to fire animations once)
});

// Record a public action so all clients can show what just happened.
function setAction(state, player, type, extra) {
  state.actionSeq = (state.actionSeq || 0) + 1;
  state.lastAction = Object.assign({ player, type, seq: state.actionSeq }, extra || {});
}

function initGame(state, playerCount) {
  const deck = createDeck(playerCount);
  // Remove all explode and defuse cards
  const explodes = deck.filter(c => c.type === 'explode');
  const defuses = deck.filter(c => c.type === 'defuse');
  let remaining = deck.filter(c => c.type !== 'explode' && c.type !== 'defuse');
  shuffle(remaining);

  // Official rule: deal 4 cards to each player, then give each 1 defuse.
  state.hands = [];
  for (let i = 0; i < playerCount; i++) {
    state.hands[i] = remaining.splice(0, 4);
  }
  // Give each player 1 defuse
  for (let i = 0; i < playerCount; i++) {
    if (defuses.length > 0) state.hands[i].push(defuses.pop());
  }
  // Add (playerCount - 1) explodes back to deck
  for (let i = 0; i < playerCount - 1; i++) {
    remaining.push(explodes[i]);
  }
  // Shuffle remaining defuses into deck
  remaining.push(...defuses);
  shuffle(remaining);

  state.deck = remaining;
  state.discard = [];
  state.currentPlayer = 0;
  state.winner = null;
  state.alive = Array(playerCount).fill(true);
  state.extraTurns = Array(playerCount).fill(0);
  state.futureCards = null;
  state.peekedCards = null;
  state.phase = 'play';
  state.pendingKitten = null;
  state.lastSteal = null;
  state.lastAction = null;
  state.actionSeq = 0;
}
exports.initGame = initGame;

function nextAlive(state, fromIdx) {
  const n = state.alive.length;
  for (let i = 1; i <= n; i++) {
    const idx = (fromIdx + i) % n;
    if (state.alive[idx]) return idx;
  }
  return fromIdx;
}

function aliveCount(state) {
  return state.alive.filter(a => a).length;
}

function finishDraw(state, playerIndex) {
  state.phase = 'play';
  state.peekedCards = null;
  state.futureCards = null;
  state.lastSteal = null;
  if (state.extraTurns[playerIndex] > 0) state.extraTurns[playerIndex]--;
  else state.currentPlayer = nextAlive(state, playerIndex);
}

exports.getCurrentActor = state => state.currentPlayer;
// Called by the server only when skipping a seat after its reconnect grace.
// An abandoned choice must not leave an orphaned kitten or block the room.
exports.setCurrentActor = (state, candidate) => {
  if (state.phase === 'reinsert' && state.pendingKitten) {
    state.deck.splice(Math.floor(Math.random() * (state.deck.length + 1)), 0, state.pendingKitten.card);
    setAction(state, state.pendingKitten.player, 'reinsert');
    finishDraw(state, state.pendingKitten.player);
    state.pendingKitten = null;
  }
  state.currentPlayer = candidate;
};

exports.handleMove = (data, state, playerIndex) => {
  if (state.winner !== null) return 'g_game_over';
  if (!state.alive[playerIndex]) return 'ek_you_are_out';

  // Lazy init
  if (state.hands.length === 0) {
    const count = state._playerCount || 2;
    initGame(state, count);
    return null;
  }

  const { cardId, targetPlayer } = data || {};
  const hand = state.hands[playerIndex];

  if (playerIndex !== state.currentPlayer) return 'g_not_your_turn';

  // Position is a depth from the top: 0 = next draw, deck.length = bottom.
  // Reject every other move until the surviving player has placed the kitten.
  if (state.phase === 'reinsert') {
    if (!data || data.reinsert !== true || !state.pendingKitten || state.pendingKitten.player !== playerIndex) return 'ek_place_kitten_first';
    if (!Number.isInteger(data.position) || data.position < 0 || data.position > state.deck.length) return 'ek_invalid_position';
    state.deck.splice(state.deck.length - data.position, 0, state.pendingKitten.card);
    state.pendingKitten = null;
    // The chosen depth must never appear in the public action or subsequent views.
    setAction(state, playerIndex, 'reinsert');
    finishDraw(state, playerIndex);
    return null;
  }
  if (data && data.reinsert) return 'g_invalid_action';

  // "Draw" straight from the play phase: skip playing and end the turn in one click
  if (state.phase === 'play' && data && data.draw && !cardId) state.phase = 'draw';

  // ---- DRAW phase ----
  if (state.phase === 'draw') {
    // Must draw a card
    if (state.deck.length === 0) return 'ek_deck_empty';
    const card = state.deck.pop();
    if (card.type === 'explode') {
      // Check for defuse
      const defuseIdx = hand.findIndex(c => c.type === 'defuse');
      if (defuseIdx >= 0) {
        state.discard.push(hand.splice(defuseIdx, 1)[0]);
        state.pendingKitten = { player: playerIndex, card };
        state.phase = 'reinsert';
        state.peekedCards = null;
        state.futureCards = null;
        state.lastSteal = null;
        // Public: player used a defuse to survive
        setAction(state, playerIndex, 'defuse', { defused: true });
        return null;
      } else {
        // BOOM! Eliminated
        state.alive[playerIndex] = false;
        state.discard.push(card);
        state.discard.push(...hand);
        state.hands[playerIndex] = [];
        setAction(state, playerIndex, 'explode', { exploded: true });
        if (aliveCount(state) <= 1) {
          state.winner = state.alive.findIndex(a => a);
          state.phase = 'over';
          return null;
        }
        state.currentPlayer = nextAlive(state, playerIndex);
        state.phase = 'play';
        state.peekedCards = null;
        state.extraTurns = Array(state.alive.length).fill(0);
        return null;
      }
    } else {
      hand.push(card);
      // Normal draw: contents stay secret, but the turn-ending draw is public
      setAction(state, playerIndex, 'draw');
    }

    finishDraw(state, playerIndex);
    return null;
  }

  // ---- PLAY phase ----
  if (state.phase === 'play') {
    // Player can play cards or pass to draw

    // Play a single card
    if (cardId) {
      const idx = hand.findIndex(c => c.id === cardId);
      if (idx === -1) return 'ek_card_not_in_hand';
      const card = hand.splice(idx, 1)[0];
      state.discard.push(card);
      // Public: reveal which card was played (so others can see defuse/skip/etc.)
      setAction(state, playerIndex, card.type);

      switch (card.type) {
        case 'skip':
          // End turn without drawing
          // Skip ends only one turn: an attacked player still owes the other one.
          if (state.extraTurns[playerIndex] > 0) {
            state.extraTurns[playerIndex]--;
          } else {
            state.currentPlayer = nextAlive(state, playerIndex);
          }
          state.phase = 'play';
          return null;

        case 'attack':
          // 甩锅：指定目标玩家接 2 个回合（不指定则默认下家）
          {
            let target = nextAlive(state, playerIndex);
            if (targetPlayer !== undefined &&
                targetPlayer !== playerIndex &&
                state.alive[targetPlayer]) {
              target = targetPlayer;
            }
            state.currentPlayer = target;
            state.extraTurns[target] = (state.extraTurns[target] || 0) + 1;
            state.phase = 'play';
            if (state.lastAction) state.lastAction.target = target;
          }
          return null;

        case 'future':
          // See top 3 cards
          state.peekedCards = state.deck.slice(-Math.min(3, state.deck.length)).reverse();
          // Player can still play more cards or proceed to draw
          return null;

        case 'shuffle':
          // Shuffle the deck
          shuffle(state.deck);
          state.peekedCards = null;
          return null;

        case 'favor':
          // 偷牌 — directly steal a random card from the target player
          if (targetPlayer === undefined || targetPlayer === playerIndex) {
            hand.push(card); state.discard.pop(); return 'ek_must_target_player';
          }
          if (!state.alive[targetPlayer]) {
            hand.push(card); state.discard.pop(); return 'ek_target_out';
          }
          {
            const targetHand = state.hands[targetPlayer];
            if (targetHand && targetHand.length > 0) {
              const rIdx = Math.floor(Math.random() * targetHand.length);
              const stolen = targetHand.splice(rIdx, 1)[0];
              hand.push(stolen);
              state.lastSteal = { stealer: playerIndex, victim: targetPlayer, cardType: stolen.type };
            }
          }
          state.phase = 'draw';
          return null;

        case 'steal':
          if (targetPlayer === undefined || targetPlayer === playerIndex) {
            hand.push(card); state.discard.pop(); return 'ek_must_target_player';
          }
          if (!state.alive[targetPlayer]) {
            hand.push(card); state.discard.pop(); return 'ek_target_out';
          }
          {
            const targetHand = state.hands[targetPlayer];
            if (targetHand && targetHand.length > 0) {
              const rIdx = Math.floor(Math.random() * targetHand.length);
              const stolen = targetHand.splice(rIdx, 1)[0];
              hand.push(stolen);
              state.lastSteal = { stealer: playerIndex, victim: targetPlayer, cardType: stolen.type };
            }
          }
          state.phase = 'draw';
          return null;

        default:
          // Other cards: no special effect alone
          break;
      }
    }

    // Player passes → draw
    state.phase = 'draw';
    return null;
  }

  return 'g_unknown_action';
};

// Hide other players' cards, the deck order and See-the-Future results.
const { maskView } = require('./lib/hidden');
exports.playerView = function (state, playerIndex) {
  const view = maskView(state, playerIndex, { piles: ['deck'] });
  if (view !== state && state.pendingKitten) view.pendingKitten = { player: state.pendingKitten.player };
  if (view !== state && state.currentPlayer !== playerIndex) {
    view.peekedCards = null;
    view.futureCards = null;
  }
  return view;
};
