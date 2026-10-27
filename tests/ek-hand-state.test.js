const test = require('node:test');
const assert = require('node:assert/strict');
const hand = require('../public/js/ui/ek-hand-state');
const card = (type, id) => ({type, id});
const state = () => ({hands:[[card('skip','skip-1')],[null,null]], actionSeq:0, lastAction:null});

test('hand display groups duplicate types, sorts their IDs naturally and leaves game state untouched', () => {
  const original = [card('defuse','d'),card('skip','skip-10'),card('attack','a'),card('skip','skip-2'),card('future','f')];
  const before = structuredClone(original);
  const sorted = hand.sortHand(original);
  assert.deepEqual(sorted.map(c=>c.id), ['a','skip-2','skip-10','f','d']);
  assert.deepEqual(original, before);
  assert.notEqual(sorted, original);
});

test('only the drawing player detects their newly received card', () => {
  const s = state(); const mine = hand.snapshot(s,0), other = hand.snapshot(s,1);
  s.hands[0].push(card('future','new-future'));
  s.actionSeq=1; s.lastAction={player:0,type:'draw',seq:1};
  assert.deepEqual(hand.findDraw(mine,s,0), {card:card('future','new-future'),outcome:'hand',seq:1});
  assert.equal(hand.findDraw(other,s,1),null);
});

test('initial joins, reconnect snapshots and duplicate state updates do not replay a draw', () => {
  const s=state(); s.actionSeq=4; s.lastAction={player:0,type:'draw',seq:4};
  assert.equal(hand.findDraw(null,s,0),null);
  assert.equal(hand.findDraw(hand.snapshot(s,0),s,0),null);
  assert.equal(hand.findDraw(hand.snapshot(s,1),s,0),null);
});

test('captured hand IDs survive in-place fixture updates and reordering', () => {
  const s=state(),previous=hand.snapshot(s,0);
  s.hands[0].unshift(card('attack','new-attack')); s.actionSeq=1; s.lastAction={player:0,type:'draw',seq:1};
  assert.equal(hand.findDraw(previous,s,0).card.id,'new-attack');
  assert.deepEqual(previous.ids,['skip-1']);
});

test('stealing a card or receiving an ambiguous hand update is not mistaken for a deck draw', () => {
  const s=state(), previous=hand.snapshot(s,0);
  s.hands[0].push(card('shuffle','new-shuffle'));s.actionSeq=1;s.lastAction={player:0,type:'steal',seq:1};
  assert.equal(hand.findDraw(previous,s,0),null);
  s.lastAction.type='draw';s.hands[0].push(card('favor','another'));
  assert.equal(hand.findDraw(previous,s,0),null);
});

test('explosions and automatic defuses reveal a kitten only to the player who drew it', () => {
  for(const outcome of ['explode','defuse']) {
    const s=state(), mine=hand.snapshot(s,0),other=hand.snapshot(s,1);
    s.actionSeq=1;s.lastAction={player:0,type:outcome,seq:1};
    const result=hand.findDraw(mine,s,0);
    assert.equal(result.card.type,'explode'); assert.equal(result.outcome,outcome);
    assert.equal(hand.findDraw(other,s,1),null);
  }
});
