const test = require('node:test');
const assert = require('node:assert/strict');
const ek = require('../games/exploding-kittens');
const bot = require('../bots/exploding-kittens');
const card = (type,id=type) => ({type,id});
function game() {
  const s=ek.createState();ek.initGame(s,3);
  s.deck=[card('skip','bottom'),card('future','middle'),card('shuffle','top'),card('explode','bomb')];
  s.hands=[[card('defuse','my-defuse')],[card('skip','rival')],[card('attack','rival2')]];
  return s;
}
function drawBomb(s) { assert.equal(ek.handleMove({draw:true},s,0),null); }
test('defusing holds the actual kitten out of the deck and waits for a separate choice',()=>{
  const s=game();s.peekedCards=[s.deck.at(-1)];s.futureCards=[s.deck.at(-1)];s.lastSteal={};
  drawBomb(s);
  assert.equal(s.phase,'reinsert');assert.equal(s.currentPlayer,0);assert.equal(s.deck.length,3);
  assert.deepEqual(s.pendingKitten,{player:0,card:card('explode','bomb')});
  assert.deepEqual(s.discard,[card('defuse','my-defuse')]);assert.deepEqual(s.hands[0],[]);
  assert.equal(s.peekedCards,null);assert.equal(s.futureCards,null);assert.equal(s.lastSteal,null);
  assert.equal(s.lastAction.type,'defuse');assert.equal(s.alive[0],true);
});
test('top, every middle slot and bottom match draw order without changing other cards',()=>{
  for(const position of [0,1,2,3]) {
    const s=game();drawBomb(s);
    assert.equal(ek.handleMove({reinsert:true,position},s,0),null);
    assert.equal(s.pendingKitten,null);assert.equal(s.phase,'play');assert.equal(s.currentPlayer,1);
    const order=s.deck.slice().reverse();assert.equal(order[position].id,'bomb');
    assert.deepEqual(order.filter(c=>c.id!=='bomb').map(c=>c.id),['top','middle','bottom']);
    assert.deepEqual(s.lastAction,{player:0,type:'reinsert',seq:2});
  }
});
test('placement rejects missing, malformed or out-of-range depths without mutating the game',()=>{
  const s=game();drawBomb(s);const before=structuredClone(s);
  for(const position of [undefined,null,-1,4,0.5,'0',NaN,Infinity,{},[]]) {
    assert.equal(ek.handleMove({reinsert:true,position},s,0),'ek_invalid_position');
    assert.deepEqual(s,before);
  }
  for(const move of [{},{draw:true},{cardId:'anything'},{position:0},{reinsert:false,position:0}]) {
    assert.equal(ek.handleMove(move,s,0),'ek_place_kitten_first');assert.deepEqual(s,before);
  }
  assert.equal(ek.handleMove({reinsert:true,position:0},s,1),'g_not_your_turn');assert.deepEqual(s,before);
});
test('placement is secret, survives reconnects and views cannot mutate the pending card',()=>{
  const s=game();drawBomb(s);const before=structuredClone(s);
  for(const self of [0,1,2,-1]) {
    const view=ek.playerView(s,self);
    assert.deepEqual(view.pendingKitten,{player:0});assert(view.deck.every(c=>c===null));
    assert.equal(JSON.stringify(view).includes('"bomb"'),false);
  }
  assert.deepEqual(s,before);
  ek.handleMove({reinsert:true,position:2},s,0);
  for(const self of [0,1,2,-1]) {const view=ek.playerView(s,self);assert(view.deck.every(c=>c===null));assert.equal('position' in view.lastAction,false);assert.equal(view.pendingKitten,null);}
});
test('an attacked player consumes one turn only after placement is confirmed',()=>{
  const s=game();s.extraTurns[0]=2;drawBomb(s);assert.equal(s.extraTurns[0],2);
  ek.handleMove({reinsert:true,position:3},s,0);assert.equal(s.extraTurns[0],1);assert.equal(s.currentPlayer,0);
  const before=structuredClone(s);assert.equal(ek.handleMove({reinsert:true,position:0},s,0),'g_invalid_action');assert.deepEqual(s,before);
});
test('the last card still needs confirmation and has exactly one insertion position',()=>{
  const s=game();s.deck=[card('explode','only')];drawBomb(s);assert.equal(s.deck.length,0);assert.equal(s.phase,'reinsert');
  assert.equal(ek.handleMove({reinsert:true,position:1},s,0),'ek_invalid_position');
  assert.equal(ek.handleMove({reinsert:true,position:0},s,0),null);assert.deepEqual(s.deck,[card('explode','only')]);
});
test('without a defuse the player is eliminated, and cannot place the bomb even on final elimination',()=>{
  for(const final of [false,true]) {
    const s=game();s.hands[0]=[card('skip','mine')];if(final)s.alive[2]=false;drawBomb(s);
    assert.equal(s.alive[0],false);assert.equal(s.pendingKitten,null);assert(s.discard.some(c=>c.id==='bomb'));
    assert.equal(s.lastAction.type,'explode');if(final)assert.equal(s.winner,1);else assert.equal(s.currentPlayer,1);
    assert.equal(ek.handleMove({reinsert:true,position:0},s,0),final?'g_game_over':'ek_you_are_out');
  }
});
test('bots place kittens even with an empty hand, and all-bot games finish',()=>{
  const s=game();drawBomb(s);const move=bot.createBot(0).getMove(s);
  assert.equal(move.reinsert,true);assert(Number.isInteger(move.position));assert.equal(ek.handleMove(move,s,0),null);
  for(const count of [2,3,6]) {
    const state=ek.createState();ek.initGame(state,count);const bots=Array.from({length:count},(_,i)=>bot.createBot(i));
    let turns=0;while(state.winner===null&&turns++<3000){const p=state.currentPlayer;assert.equal(ek.handleMove(bots[p].getMove(state),state,p),null);}
    assert.notEqual(state.winner,null,'bots must finish with '+count+' seats');
  }
});
test('restarting clears the placement and public action',()=>{
  const s=game();drawBomb(s);ek.initGame(s,3);assert.equal(s.pendingKitten,null);assert.equal(s.phase,'play');assert.equal(s.lastAction,null);
});

test('after reconnect grace the server can skip an abandoned placement without losing the kitten',()=>{
  const s=game();drawBomb(s);assert.equal(ek.getCurrentActor(s),0);
  ek.setCurrentActor(s,1);assert.equal(s.pendingKitten,null);assert.equal(s.phase,'play');assert.equal(s.currentPlayer,1);
  assert.equal(s.deck.filter(c=>c.id==='bomb').length,1);assert.deepEqual(s.lastAction,{player:0,type:'reinsert',seq:2});
  assert.equal(ek.handleMove({draw:true},s,1),null);
});
