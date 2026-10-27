// Illustrated tabletop view. All decisions still use the existing game protocol.
(function() {
  window.gameRenderers = window.gameRenderers || new Map();
  var TYPES = {
    defuse: { cell: 0, color: '#19786e', mark: '✂', passive: true },
    attack: { cell: 1, color: '#bd5022', mark: '↗', target: true },
    skip: { cell: 2, color: '#28618d', mark: '»' },
    future: { cell: 3, color: '#74508b', mark: '◉' },
    shuffle: { cell: 4, color: '#39765c', mark: '⇄' },
    favor: { cell: 5, color: '#aa4565', mark: '♡', target: true },
    steal: { cell: 6, color: '#8a6428', mark: '↙', target: true },
    explode: { cell: 7, color: '#b93223', mark: '✹', passive: true },
    back: { cell: 8, color: '#b93223', mark: '✹' }
  };
  var ui;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function(ch) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch];
    });
  }
  function t(key) { return window._t(key); }
  function tf(key) { return window._tf.apply(null, arguments); }
  function node(id) { return ui.root.querySelector('#' + id); }
  function playerName(index) {
    return window.getPlayerName ? window.getPlayerName(index) : t('ek_player_fallback') + ' ' + (index + 1);
  }
  function cardName(type) { return t('ek_card_' + type); }
  function myHand() { return ui.state && ui.state.hands[ui.self] || []; }
  function myTurn() {
    return ui.state && ui.state.winner == null && ui.state.alive[ui.self] && ui.state.currentPlayer === ui.self;
  }
  function canPlay() { return myTurn() && ui.state.phase === 'play' && !ui.pending && !ui.reveal; }
  function currentCard() { return myHand().find(function(card) { return card && card.id === ui.selected; }); }
  function art(type) {
    var meta = TYPES[type] || TYPES.back;
    return '<span class="ek-art" aria-hidden="true" style="--art-x:' + (meta.cell % 3) * 50 + '%;--art-y:' + Math.floor(meta.cell / 3) * 50 + '%"></span>';
  }
  function face(type) {
    var meta = TYPES[type] || TYPES.back;
    return '<span class="ek-card-face" style="--card-color:' + meta.color + '">' +
      '<span class="ek-card-top"><span aria-hidden="true">' + meta.mark + '</span>' + esc(cardName(type)) + '</span>' +
      art(type) + '<span class="ek-card-copy">' + esc(t('ek_short_' + type)) + '</span></span>';
  }
  function targets(card) {
    return ui.state.alive.map(function(alive, index) { return index; }).filter(function(index) {
      return index !== ui.self && ui.state.alive[index];
    });
  }
  function validTarget(card, index) {
    return targets(card).indexOf(index) !== -1 &&
      (card.type === 'attack' || (ui.state.hands[index] && ui.state.hands[index].length > 0));
  }

  function init(container) {
    if (ui) { cancelDrawReveal(); clearTimeout(ui.highlightTimer); }
    ui = { root: container, state: null, self: 0, selected: null, target: null, pending: false,
      handSignature: '', lastSeq: -1, events: [], snapshot: null, reveal: null, justDrawn: null };
    container.innerHTML = '<section class="ek-table" id="ekTable" aria-label="Exploding Kittens">' +
      '<header class="ek-table-header"><div><p class="ek-eyebrow">' + esc(t('ek_table_kicker')) + '</p><h1>Exploding <span>Kittens</span><i aria-hidden="true">✹</i></h1></div>' +
      '<div class="ek-table-tools"><button type="button" class="ek-text-button" id="ekRules">' + esc(t('view_rules')) + ' <span aria-hidden="true">↗</span></button><button type="button" class="ek-reset-button" id="ekRestart" aria-label="' + esc(t('restart')) + '" title="' + esc(t('restart')) + '">↻</button></div></header>' +
      '<div class="ek-roster" id="ekOpps" aria-label="' + esc(t('ek_rivals')) + '"></div>' +
      '<div class="ek-turn-strip" id="ekTurnStrip" role="status"><span class="ek-turn-dot" aria-hidden="true"></span><div><strong id="ekStatus"></strong><p id="ekTurnHint"></p></div><span id="ekTurns" class="ek-turns"></span></div>' +
      '<div class="ek-mat"><div class="ek-mat-caption"><span>' + esc(t('ek_table_center')) + '</span><span id="ekSurvivors"></span></div>' +
        '<div class="ek-piles"><div class="ek-pile-group"><button type="button" class="ek-deck" id="ekDrawPile" aria-label="' + esc(t('ek_draw_action')) + '">' +
          '<span class="ek-deck-inner">' + art('back') + '<span class="ek-back-name">BOOM<br>CLUB</span></span><span class="ek-count-tag" id="ekDrawCount">0</span></button><span class="ek-pile-label">' + esc(t('ek_draw_pile')) + '</span></div>' +
          '<span class="ek-pile-arrow" aria-hidden="true">→</span><div class="ek-pile-group"><button type="button" class="ek-discard" id="ekDiscard" aria-label="' + esc(t('ek_view_discard')) + '"></button><span class="ek-pile-label">' + esc(t('ek_discard')) + ' <span id="ekDiscardCount"></span></span></div></div>' +
        '<div class="ek-table-event" id="ekActionLog" aria-live="polite"></div></div>' +
      '<section class="ek-future" id="ekFuture" hidden aria-label="' + esc(t('ek_card_future')) + '"></section>' +
      '<section class="ek-hand-section"><div class="ek-hand-heading"><h2>' + esc(t('ek_hand_label')) + ' <span id="ekHandCount"></span></h2><span class="ek-protection" id="ekProtection"></span></div>' +
        '<p class="ek-hand-hint">' + esc(t('ek_hand_hint')) + '</p><div class="ek-hand-wrap" id="ekHandWrap"><div class="ek-hand" id="ekHand"></div></div>' +
        '<div class="ek-private-note" id="ekStealMsg" aria-live="polite"></div></section>' +
      '<footer class="ek-commandbar"><div><strong id="ekCommandTitle"></strong><span id="ekCommandHint"></span></div><button type="button" class="ek-primary" id="ekDrawBtn"></button></footer>' +
      '<details class="ek-history"><summary>' + esc(t('ek_history')) + '</summary><ol id="ekHistory"></ol></details>' +
      '<dialog class="ek-dialog" id="ekDetail" aria-labelledby="ekDetailTitle"><button type="button" class="ek-close" id="ekClose" aria-label="' + esc(t('ek_close')) + '">×</button>' +
        '<div class="ek-detail-layout"><div class="ek-detail-art" id="ekDetailArt"></div><div class="ek-detail-copy"><p class="ek-eyebrow" id="ekDetailKind"></p><h2 id="ekDetailTitle"></h2><p id="ekDetailDescription"></p>' +
        '<div id="ekTargets"></div><p class="ek-detail-note" id="ekDetailNote" role="status"></p><button type="button" class="ek-primary" id="ekPlayBtn"></button></div></div></dialog>' +
      '<dialog class="ek-draw-reveal" id="ekDrawReveal" tabindex="-1" aria-labelledby="ekRevealName" aria-describedby="ekRevealNote">' +
        '<p class="ek-reveal-label" id="ekRevealLabel"></p><div class="ek-reveal-motion" id="ekRevealMotion"><div class="ek-reveal-flipper" id="ekRevealFlipper">' +
          '<div class="ek-reveal-back"><div class="ek-reveal-back-inner">' + art('back') + '<strong>BOOM CLUB</strong></div></div><div class="ek-reveal-front" id="ekRevealFace"></div></div></div>' +
        '<div class="ek-reveal-caption"><h2 id="ekRevealName"></h2><p id="ekRevealNote"></p><button type="button" class="ek-primary" id="ekRevealContinue"></button></div></dialog></section>';
    node('ekRules').addEventListener('click', function() { window.showGameTutorial('exploding-kittens'); });
    node('ekRestart').addEventListener('click', function() { if (window.doRestart) window.doRestart(); });
    node('ekClose').addEventListener('click', closeDetail);
    node('ekDetail').addEventListener('click', function(event) { if (event.target === this) closeDetail(); });
    node('ekDetail').addEventListener('close', function() { ui.selected = null; ui.inspectOnly = false; highlightHand(); });
    node('ekPlayBtn').addEventListener('click', playSelected);
    node('ekDrawBtn').addEventListener('click', draw);
    node('ekDrawPile').addEventListener('click', draw);
    node('ekRevealContinue').addEventListener('click', finishDrawReveal);
    node('ekDrawReveal').addEventListener('cancel', function(event) { event.preventDefault(); finishDrawReveal(); });
    node('ekDrawReveal').addEventListener('click', function(event) { if (event.target === this) finishDrawReveal(); });
    node('ekDiscard').addEventListener('click', function() {
      var pile = ui.state.discard || [];
      if (!pile.length) return;
      ui.inspectOnly = true; ui.inspected = pile[pile.length - 1]; ui.selected = null;
      openDetail();
    });
    window._gameErrorHandler = function(message) {
      if (!ui || !ui.root.isConnected || !ui.state) return;
      ui.pending = false; refreshActions(); refreshDetail();
      node('ekStealMsg').textContent = message;
    };
  }

  function render(state, container, playerIndex) {
    if (!state || !state.hands || !state.hands.length || !ui) return;
    if (ui.snapshot && ui.snapshot.seq > 0 && state.actionSeq === 0) {
      cancelDrawReveal();
      if (node('ekDetail').open) closeDetail();
      ui.selected = null; ui.target = null; ui.events = []; ui.lastSeq = -1; ui.justDrawn = null;
    }
    var newDraw = !ui.reveal && window.EKHandState.findDraw(ui.snapshot, state, playerIndex);
    ui.state = state; ui.self = playerIndex; ui.pending = false;
    ui.snapshot = window.EKHandState.snapshot(state, playerIndex);
    if (ui.reveal && ui.reveal.outcome === 'hand' && !myHand().some(function(card) { return card && card.id === ui.reveal.card.id; })) cancelDrawReveal();
    if (newDraw) ui.reveal = Object.assign({ owner: ui, animations: [], finishing: false, cancelled: false }, newDraw);
    renderOpponents(); renderPiles(); renderHand(); renderFuture(); renderStatus(); renderEvent(); refreshActions();
    if (node('ekDetail').open) refreshDetail();
    if (newDraw) startDrawReveal(ui.reveal);
  }

  function renderOpponents() {
    node('ekOpps').innerHTML = ui.state.hands.map(function(hand, index) {
      if (index === ui.self) return '';
      var alive = ui.state.alive[index], active = ui.state.currentPlayer === index && ui.state.winner == null;
      var player = (window.gamePlayers || []).find(function(p) { return p.index === index; });
      return '<div class="ek-opponent' + (active ? ' is-active' : '') + (!alive ? ' is-out' : '') + '">' +
        '<span class="ek-avatar" aria-hidden="true">' + esc(player && player.avatar || '🐈') + '</span><div class="ek-opponent-info"><strong>' + esc(playerName(index)) + '</strong>' +
        '<span>' + esc(alive ? tf('ek_opponent_cards', hand.length) : t('ek_eliminated')) + '</span></div>' +
        (active ? '<span class="ek-active-pin" aria-label="' + esc(t('ek_current_player')) + '"></span>' : '') + '</div>';
    }).join('');
  }

  function renderPiles() {
    var discard = ui.state.discard || [], top = discard[discard.length - 1];
    node('ekDrawCount').textContent = ui.state.deck.length;
    node('ekDiscardCount').textContent = discard.length ? '· ' + discard.length : '';
    node('ekDiscard').innerHTML = top ? face(top.type) : '<span class="ek-empty-pile">✹<small>' + esc(t('ek_discard_empty')) + '</small></span>';
    node('ekDiscard').disabled = !top;
    node('ekSurvivors').textContent = tf('ek_survivors', ui.state.alive.filter(Boolean).length);
  }

  function renderHand() {
    var cards = window.EKHandState.sortHand(myHand());
    node('ekHandCount').textContent = cards.length;
    var protectedPlayer = cards.some(function(card) { return card && card.type === 'defuse'; });
    node('ekProtection').textContent = t(protectedPlayer ? 'ek_protected' : 'ek_unprotected');
    node('ekProtection').classList.toggle('is-unprotected', !protectedPlayer);
    var signature = cards.map(function(card) { return card && card.id; }).join('|');
    if (signature !== ui.handSignature || !node('ekHand').children.length) {
      var wrap = node('ekHandWrap'), scroll = wrap.scrollLeft;
      node('ekHand').innerHTML = cards.length ? cards.map(function(card) {
        if (!card) return '';
        return '<button type="button" class="ek-hand-card' + (TYPES[card.type] && TYPES[card.type].passive ? ' is-passive' : '') + '" data-card-id="' + esc(card.id) + '" aria-haspopup="dialog" aria-label="' + esc(cardName(card.type) + '. ' + t('ek_desc_' + card.type)) + '">' + face(card.type) + '</button>';
      }).join('') : '<p class="ek-empty-hand">' + esc(t('ek_no_cards')) + '</p>';
      wrap.scrollLeft = scroll;
      node('ekHand').querySelectorAll('[data-card-id]').forEach(function(button) {
        button.addEventListener('click', function() {
          ui.selected = button.dataset.cardId; ui.inspectOnly = false; ui.target = null; openDetail();
        });
      });
      ui.handSignature = signature;
    }
    node('ekHand').classList.toggle('is-waiting', !myTurn());
    highlightHand();
    node('ekHand').querySelectorAll('[data-card-id]').forEach(function(button) {
      var incoming = ui.reveal && ui.reveal.outcome === 'hand' && button.dataset.cardId === ui.reveal.card.id;
      button.classList.toggle('is-incoming', !!incoming);
      button.classList.toggle('is-just-drawn', button.dataset.cardId === ui.justDrawn);
      if (incoming) button.setAttribute('aria-hidden', 'true');
      else button.removeAttribute('aria-hidden');
    });
  }
  function highlightHand() {
    node('ekHand').querySelectorAll('[data-card-id]').forEach(function(button) {
      button.classList.toggle('is-selected', button.dataset.cardId === ui.selected);
    });
  }

  function renderFuture() {
    var cards = ui.state.peekedCards;
    var visible = ui.state.currentPlayer === ui.self && ui.state.phase === 'play' && cards && cards.length;
    node('ekFuture').hidden = !visible;
    if (!visible) { node('ekFuture').innerHTML = ''; return; }
    node('ekFuture').innerHTML = '<div class="ek-future-heading"><div><strong>' + esc(t('ek_card_future')) + '</strong><span>' + esc(t('ek_future_private')) + '</span></div><span aria-hidden="true">◉</span></div>' +
      '<div class="ek-future-cards">' + cards.map(function(card, i) {
        return '<div class="ek-future-slot"><span class="ek-future-position">' + (i + 1) + (i === 0 ? ' · ' + esc(t('ek_future_first')) : '') + '</span>' + face(card.type) + '</div>';
      }).join('') + '</div>';
  }

  function renderStatus() {
    var alive = ui.state.alive[ui.self], mine = myTurn();
    var title = ui.state.winner != null ? (ui.state.winner === ui.self ? t('ek_you_win') : tf('ek_winner_named', playerName(ui.state.winner))) :
      !alive ? t('ek_you_eliminated') : mine ? t('your_turn') : tf('ek_waiting_named', playerName(ui.state.currentPlayer));
    node('ekStatus').textContent = title;
    node('ekTurnHint').textContent = ui.state.winner != null ? t('ek_round_over') : !alive ? t('ek_spectating') :
      mine ? t(ui.state.phase === 'draw' ? 'ek_draw_required' : 'ek_turn_hint') : t('ek_inspect_hint');
    node('ekTurnStrip').classList.toggle('is-mine', mine);
    var owed = (ui.state.extraTurns[ui.self] || 0) + 1;
    node('ekTurns').textContent = mine && owed > 1 ? tf('ek_turns_owed', owed) : '';
    var theft = ui.state.lastSteal;
    node('ekStealMsg').textContent = !theft ? '' : theft.stealer === ui.self ? tf('ek_msg_stolen_you', cardName(theft.cardType)) :
      theft.victim === ui.self ? tf('ek_msg_stolen_victim', cardName(theft.cardType)) : '';
  }

  function renderEvent() {
    var action = ui.state.lastAction;
    if (!action) { node('ekActionLog').textContent = t('ek_first_draw'); node('ekHistory').innerHTML = ''; return; }
    var who = playerName(action.player);
    var key = 'ek_event_' + action.type;
    var text = action.type === 'attack' ? tf(key, who, playerName(action.target == null ? ui.state.currentPlayer : action.target)) : tf(key, who);
    if (text === key) text = who + ' · ' + cardName(action.type);
    node('ekActionLog').textContent = text;
    if (action.seq !== ui.lastSeq) {
      ui.lastSeq = action.seq; ui.events.unshift(text); ui.events = ui.events.slice(0, 6);
      if (action.type === 'explode' || action.type === 'defuse') {
        ui.root.querySelector('.ek-table').classList.remove('ek-boom', 'ek-saved');
        void ui.root.offsetWidth;
        ui.root.querySelector('.ek-table').classList.add(action.type === 'explode' ? 'ek-boom' : 'ek-saved');
      }
    }
    node('ekHistory').innerHTML = ui.events.map(function(event) { return '<li>' + esc(event) + '</li>'; }).join('');
  }

  function refreshActions() {
    var mine = myTurn(), ended = ui.state.winner != null;
    node('ekDrawBtn').disabled = !mine || ui.pending || !!ui.reveal || !ui.state.deck.length;
    node('ekDrawPile').disabled = node('ekDrawBtn').disabled;
    node('ekDrawBtn').textContent = ui.pending ? t('ek_play_pending') : ended ? t('ek_round_over') : !mine ? t('ek_wait_short') : t('ek_draw_action');
    node('ekCommandTitle').textContent = ended ? t('ek_round_over') : mine ? t(ui.state.phase === 'draw' ? 'ek_draw_required' : 'ek_play_or_draw') : t('ek_inspect_title');
    node('ekCommandHint').textContent = mine ? t('ek_end_note') : t('ek_inspect_hint');
  }

  function openDetail() {
    refreshDetail(); highlightHand();
    if (!node('ekDetail').open) node('ekDetail').showModal();
  }
  function closeDetail() { node('ekDetail').close(); }
  function refreshDetail() {
    var card = ui.inspectOnly ? ui.inspected : currentCard();
    if (!card) { if (node('ekDetail').open) closeDetail(); return; }
    var meta = TYPES[card.type] || TYPES.back;
    node('ekDetailArt').innerHTML = face(card.type);
    node('ekDetailKind').textContent = t(ui.inspectOnly ? 'ek_discard' : meta.passive ? 'ek_auto_protection' : 'ek_action_card');
    node('ekDetailTitle').textContent = cardName(card.type);
    node('ekDetailDescription').textContent = t('ek_desc_' + card.type);
    var candidates = meta.target && !ui.inspectOnly ? targets(card) : [];
    var valid = candidates.filter(function(index) { return validTarget(card, index); });
    if (valid.indexOf(ui.target) === -1) ui.target = valid.length === 1 ? valid[0] : null;
    node('ekTargets').innerHTML = candidates.length ? '<strong class="ek-target-heading">' + esc(t('ek_choose_rival')) + '</strong><div class="ek-target-grid">' + candidates.map(function(index) {
      var empty = !validTarget(card, index);
      return '<button type="button" class="ek-target' + (ui.target === index ? ' is-chosen' : '') + '" data-target="' + index + '" aria-pressed="' + (ui.target === index) + '"' + (empty || !canPlay() ? ' disabled' : '') + '><strong>' + esc(playerName(index)) + '</strong><span>' + esc(empty ? t('ek_target_empty') : tf('ek_opponent_cards', ui.state.hands[index].length)) + '</span></button>';
    }).join('') + '</div>' : '';
    node('ekTargets').querySelectorAll('[data-target]').forEach(function(button) {
      button.addEventListener('click', function() { ui.target = Number(button.dataset.target); refreshDetail(); });
    });
    var playable = !ui.inspectOnly && !meta.passive && canPlay() && (!meta.target || ui.target !== null);
    node('ekPlayBtn').hidden = ui.inspectOnly;
    node('ekPlayBtn').disabled = !playable;
    node('ekPlayBtn').textContent = ui.pending ? t('ek_play_pending') : meta.passive ? t('ek_automatic') : t('ek_play_card');
    node('ekDetailNote').textContent = ui.inspectOnly ? '' : meta.passive ? t('ek_defuse_info') : !myTurn() ? t('ek_toast_not_turn') :
      ui.state.phase !== 'play' ? t('ek_draw_required') : meta.target && !valid.length ? t('ek_no_target') : meta.target && ui.target === null ? t('ek_select_target') : t('ek_confirm_hint');
  }
  function send(move) {
    if (!myTurn() || ui.pending || ui.reveal) return;
    ui.pending = true; refreshActions();
    if (node('ekDetail').open) closeDetail();
    window.makeGameMove(move);
  }
  function playSelected() {
    var card = currentCard();
    if (!card || !canPlay() || !TYPES[card.type] || TYPES[card.type].passive) return;
    var move = { cardId: card.id };
    if (TYPES[card.type].target) {
      if (!validTarget(card, ui.target)) return;
      move.targetPlayer = ui.target;
    }
    send(move);
  }
  function draw() { if (myTurn() && ui.state.deck.length) send({ draw: true }); }

  function activeReveal(reveal) {
    return ui === reveal.owner && ui.reveal === reveal && !reveal.cancelled && ui.root.isConnected;
  }
  function cancelDrawReveal() {
    var reveal = ui && ui.reveal;
    if (!reveal) return;
    reveal.cancelled = true;
    clearTimeout(reveal.timer);
    reveal.animations.forEach(function(animation) { animation.cancel(); });
    if (reveal.dialog && reveal.dialog.open) reveal.dialog.close();
    ui.reveal = null;
  }
  async function animateReveal(reveal, element, frames, options) {
    var animation = element.animate(frames, options);
    reveal.animations.push(animation);
    await animation.finished.catch(function() {});
    return activeReveal(reveal);
  }
  function travelTransform(from, to) {
    return 'translate(' + (from.left + from.width / 2 - to.left - to.width / 2) + 'px,' +
      (from.top + from.height / 2 - to.top - to.height / 2) + 'px) scale(' + from.width / to.width + ',' + from.height / to.height + ')';
  }
  async function startDrawReveal(reveal) {
    reveal.dialog = node('ekDrawReveal');
    reveal.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var motion = node('ekRevealMotion'), flipper = node('ekRevealFlipper');
    node('ekRevealFace').innerHTML = face(reveal.card.type);
    node('ekRevealLabel').textContent = t('ek_draw_reveal_label');
    node('ekRevealName').textContent = cardName(reveal.card.type);
    node('ekRevealNote').textContent = t('ek_draw_reveal_' + reveal.outcome);
    node('ekRevealContinue').textContent = t(reveal.outcome === 'hand' ? 'ek_to_hand' : 'ek_reveal_continue');
    reveal.dialog.classList.remove('is-revealed', 'is-landing');
    reveal.dialog.dataset.outcome = reveal.outcome;
    reveal.dialog.dataset.phase = 'lift';
    motion.style.transform = ''; motion.style.opacity = ''; flipper.style.transform = '';
    if (node('ekDetail').open) closeDetail();
    reveal.dialog.showModal(); reveal.dialog.focus();
    if (!reveal.reduced) {
      var source = node('ekDrawPile').getBoundingClientRect(), center = motion.getBoundingClientRect();
      if (!await animateReveal(reveal, motion, [{transform:travelTransform(source, center) + ' rotate(-5deg)'}, {transform:'none'}], {duration:320,easing:'cubic-bezier(.2,.7,.2,1)',fill:'forwards'}) || reveal.finishing) return;
      reveal.dialog.dataset.phase = 'flip';
      if (!await animateReveal(reveal, flipper, [{transform:'rotateY(0deg)'},{transform:'rotateY(180deg)'}], {duration:430,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'}) || reveal.finishing) return;
    } else flipper.style.transform = 'rotateY(180deg)';
    if (!activeReveal(reveal) || reveal.finishing) return;
    reveal.dialog.classList.add('is-revealed'); reveal.dialog.dataset.phase = 'face';
    reveal.timer = setTimeout(function() { if (activeReveal(reveal)) finishDrawReveal(); }, 1600);
  }
  async function finishDrawReveal() {
    var reveal = ui && ui.reveal;
    if (!reveal || reveal.finishing || !activeReveal(reveal)) return;
    reveal.finishing = true; clearTimeout(reveal.timer);
    reveal.animations.forEach(function(animation) { animation.cancel(); });
    var motion = node('ekRevealMotion'), flipper = node('ekRevealFlipper');
    motion.style.transform = 'none'; flipper.style.transform = 'rotateY(180deg)';
    reveal.dialog.classList.add('is-landing'); reveal.dialog.dataset.phase = 'land';
    var destination = null;
    if (reveal.outcome === 'hand') {
      destination = Array.from(node('ekHand').querySelectorAll('[data-card-id]')).find(function(button) { return button.dataset.cardId === reveal.card.id; });
      if (destination) {
        destination.scrollIntoView({block:'nearest',inline:'center',behavior:'instant'});
        var bottom = destination.getBoundingClientRect().bottom;
        if (bottom > window.innerHeight - 110) window.scrollBy({top:bottom - window.innerHeight + 110,behavior:'instant'});
      }
    } else if (reveal.outcome === 'defuse') destination = node('ekDrawPile');
    if (!reveal.reduced && destination) {
      var source = motion.getBoundingClientRect(), target = destination.getBoundingClientRect();
      if (reveal.outcome === 'defuse') flipper.style.transform = 'rotateY(0deg)';
      if (!await animateReveal(reveal, motion, [{transform:'none',opacity:1},{transform:travelTransform(target,source),opacity:1}], {duration:360,easing:'cubic-bezier(.5,0,.8,.5)',fill:'forwards'})) return;
    } else if (!reveal.reduced) {
      if (!await animateReveal(reveal, motion, [{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.85)'}], {duration:240,fill:'forwards'})) return;
    }
    if (!activeReveal(reveal)) return;
    var cardId = reveal.outcome === 'hand' ? reveal.card.id : null;
    cancelDrawReveal(); ui.justDrawn = cardId; renderHand(); refreshActions();
    if (cardId) {
      var landed = Array.from(node('ekHand').querySelectorAll('[data-card-id]')).find(function(button) { return button.dataset.cardId === cardId; });
      if (landed) landed.focus({preventScroll:true});
      var owner = ui;
      clearTimeout(ui.highlightTimer);
      ui.highlightTimer = setTimeout(function() { if (ui === owner && owner.root.isConnected) { ui.justDrawn = null; renderHand(); } }, 2200);
    }
  }

  window.gameRenderers.set('exploding-kittens', { init: init, render: render });
})();
