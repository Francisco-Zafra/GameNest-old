const test = require('node:test');
const assert = require('node:assert/strict');
const ek = require('../games/exploding-kittens');
const card = (type,id) => ({type,id});
function game() {
  const s=ek.createState();ek.initGame(s,3);
  s.deck=[card('skip','safe')];
  s.hands=[[],[card('future','victim-a'),card('shuffle','victim-b'),card('skip','victim-c')],[card('defuse','other')]];
  return s;
}
for(const type of ['favor','steal']) {
  test(type+': multiple copies and another action can be played before voluntarily drawing',()=>{
    const s=game();s.hands[0]=[card(type,'first'),card(type,'second'),card('future','look')];
    const deckBefore=structuredClone(s.deck);
    for(const cardId of ['first','second']) {
      assert.equal(ek.handleMove({cardId,targetPlayer:1},s,0),null);
      assert.equal(s.phase,'play');assert.equal(s.currentPlayer,0);assert.deepEqual(s.deck,deckBefore);
      assert.equal(s.lastSteal.stealer,0);assert.equal(s.lastSteal.victim,1);
    }
    assert.equal(s.hands[1].length,1);assert.equal(s.hands[0].length,3);
    assert.equal(ek.handleMove({cardId:'look'},s,0),null);assert.equal(s.phase,'play');assert.equal(s.currentPlayer,0);
    assert.deepEqual(s.discard.map(c=>c.id),['first','second','look']);
    assert.equal(ek.handleMove({draw:true},s,0),null);assert.equal(s.currentPlayer,1);assert(s.hands[0].some(c=>c.id==='safe'));
  });
}
test('a stolen Favor can be played immediately and does not spend an owed turn',()=>{
  const s=game();s.extraTurns[0]=2;
  s.hands[0]=[card('steal','take')];s.hands[1]=[card('favor','new-favor')];s.hands[2]=[card('future','new-future')];
  assert.equal(ek.handleMove({cardId:'take',targetPlayer:1},s,0),null);assert.equal(s.extraTurns[0],2);
  assert.equal(ek.handleMove({cardId:'new-favor',targetPlayer:2},s,0),null);assert.equal(s.extraTurns[0],2);
  assert.equal(ek.handleMove({cardId:'new-future'},s,0),null);assert.equal(s.extraTurns[0],2);
  assert.equal(s.currentPlayer,0);assert.equal(s.phase,'play');
  assert.equal(ek.handleMove({draw:true},s,0),null);assert.equal(s.extraTurns[0],1);assert.equal(s.currentPlayer,0);
});
