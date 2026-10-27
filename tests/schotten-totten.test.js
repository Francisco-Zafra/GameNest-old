const test=require('node:test');
const assert=require('node:assert/strict');
const game=require('../games/schotten-totten');
const bot=require('../bots/schotten-totten');
const card=(color,value)=>({color,value,id:color+'-'+value});
const trio=(color,values)=>values.map(n=>card(color,n));
function state(){const s=game.createState();game.initGame(s,2);return s;}
function setFormation(s,index,player,cards,seq){s.stones[index].cards[player]=cards;s.stones[index].completed[player]=seq;}
test('classic setup deals six private cards each and 42 remaining cards, all 54 unique',()=>{
  const s=state();assert.deepEqual(s.hands.map(h=>h.length),[6,6]);assert.equal(s.deck.length,42);
  const all=s.hands.flat().concat(s.deck);assert.equal(new Set(all.map(c=>c.id)).size,54);
  for(const color of ['red','blue','green','yellow','purple','pink'])assert.equal(all.filter(c=>c.color===color).length,9);
  assert.equal(s.stones.length,9);assert(s.stones.every(x=>x.cards.every(h=>h.length===0)&&x.owner===null));
  assert.throws(()=>game.initGame(s,3),/two players/);
});
test('all five formations rank correctly; sums break category ties and order never matters',()=>{
  const groups=[trio('red',[7,8,9]),['red','blue','green'].map(c=>card(c,9)),trio('red',[2,5,9]),[card('red',7),card('blue',8),card('pink',9)],[card('red',3),card('blue',7),card('pink',9)]];
  groups.forEach((cards,i)=>{assert.equal(game.formation(cards).tier,5-i);assert.deepEqual(game.formation(cards.slice().reverse()),game.formation(cards));});
  for(let i=0;i<4;i++)assert(game.compareFormations(game.formation(groups[i]),game.formation(groups[i+1]))>0);
  assert(game.compareFormations(game.formation(trio('red',[7,8,9])),game.formation(trio('blue',[6,7,8])))>0);
  assert.equal(game.formation([card('red',1)]),null);
});
test('a normal placement draws exactly one card and passes the turn; opponent cannot play twice',()=>{
  const s=state(),c=s.hands[0][0],top=s.deck.at(-1);
  assert.equal(game.handleMove({cardId:c.id,stone:4},s,0),null);
  assert.equal(s.currentPlayer,1);assert.equal(s.phase,'play');assert.equal(s.hands[0].length,6);assert.equal(s.deck.length,41);
  assert.equal(s.stones[4].cards[0][0].id,c.id);assert(s.hands[0].some(c=>c.id===top.id));
  const before=structuredClone(s);assert.equal(game.handleMove({cardId:s.hands[0][0].id,stone:3},s,0),'g_not_your_turn');assert.deepEqual(s,before);
});
test('invalid cards, stones, full or claimed positions reject without touching the state',()=>{
  const s=state(),id=s.hands[0][0].id;setFormation(s,1,0,trio('red',[1,2,3]),1);s.stones[2].owner=1;
  for(const [move,error] of [[{cardId:'missing',stone:0},'st_card_not_in_hand'],[{cardId:id,stone:-1},'st_choose_stone'],[{cardId:id,stone:9},'st_choose_stone'],[{cardId:id,stone:'0'},'st_choose_stone'],[{cardId:id,stone:1},'st_stone_full'],[{cardId:id,stone:2},'st_stone_claimed'],[{pass:true},'st_must_play'],[{claim:0},'st_choose_card']]){
    const before=structuredClone(s);assert.equal(game.handleMove(move,s,0),error);assert.deepEqual(s,before);
  }
});
test('exact formation ties belong to the player who completed first, on either side',()=>{
  const s=state();setFormation(s,0,0,trio('red',[7,8,9]),10);setFormation(s,0,1,trio('blue',[7,8,9]),11);
  assert.equal(game.canClaim(s,0,0),true);assert.equal(game.canClaim(s,1,0),false);
  s.stones[0].completed=[12,11];assert.equal(game.canClaim(s,0,0),false);assert.equal(game.canClaim(s,1,0),true);
});
test('early claims use played public cards only: even a winning blocker in your own hand is not proof',()=>{
  const s=state();s.hands=[[card('blue',9)],[]];
  setFormation(s,0,0,trio('red',[6,7,8]),1);s.stones[0].cards[1]=trio('blue',[7,8]);
  assert.equal(game.canClaim(s,0,0),false,'unplayed blue 9 could beat red 6-7-8');
  s.hands[0]=[];s.stones[1].cards[0]=[card('blue',9)];
  assert.equal(game.canClaim(s,0,0),true,'public blue 9 blocks every superior completion; a tie finishes later');
});
test('an unbeatable formation can be claimed against zero, one or two opposing cards',()=>{
  const s=state();setFormation(s,0,0,trio('red',[7,8,9]),1);
  for(const opponent of [[],[card('blue',1)],trio('blue',[1,2])]){s.stones[0].cards[1]=opponent;assert.equal(game.canClaim(s,0,0),true);}
  s.stones[0].cards[0]=trio('red',[1,2,3]);s.stones[0].cards[1]=[];assert.equal(game.canClaim(s,0,0),false);
});
test('claim window comes after placement and before drawing; claims are optional and multiple are allowed',()=>{
  const s=state();s.actionSeq=5;s.hands[0]=[card('red',9)];setFormation(s,0,0,trio('red',[7,8]),null);setFormation(s,3,0,trio('green',[7,8,9]),2);
  const deck=s.deck.length;assert.equal(game.handleMove({cardId:'red-9',stone:0},s,0),null);
  assert.equal(s.phase,'claim');assert.equal(s.currentPlayer,0);assert.equal(s.hands[0].length,0);assert.equal(s.deck.length,deck);
  assert.deepEqual(game.playerView(s,0).claimable,[0,3]);assert.deepEqual(game.playerView(s,1).claimable,[]);
  const before=structuredClone(s);assert.equal(game.handleMove({claim:2},s,0),'st_cannot_claim');assert.deepEqual(s,before);
  assert.equal(game.handleMove({claim:0},s,0),null);assert.equal(game.handleMove({claim:3},s,0),null);assert.equal(s.currentPlayer,0);
  assert.equal(game.handleMove({endTurn:true},s,0),null);assert.equal(s.currentPlayer,1);assert.equal(s.deck.length,deck-1);assert.equal(s.hands[0].length,1);
  const skip=state();skip.hands[0]=[card('red',9)];setFormation(skip,0,0,trio('red',[7,8]),null);
  game.handleMove({cardId:'red-9',stone:0},skip,0);game.handleMove({endTurn:true},skip,0);assert.equal(skip.stones[0].owner,null);
});
test('three adjacent or five total stones win immediately without drawing the replacement',()=>{
  for(const owned of [[0,1],[0,2,4,6]]){
    const s=state(),index=owned.length===2?2:8;owned.forEach(i=>s.stones[i].owner=0);setFormation(s,index,0,trio('red',[7,8,9]),1);s.phase='claim';s.playedThisTurn=true;
    const size=s.deck.length;assert.equal(game.handleMove({claim:index},s,0),null);assert.equal(s.winner,0);assert.equal(s.phase,'over');assert.equal(s.deck.length,size);
    assert.equal(game.handleMove({endTurn:true},s,0),'g_game_over');
  }
});
test('empty deck keeps play going; an empty hand can pass and claim without drawing',()=>{
  const s=state();s.deck=[];const before=s.hands[0].length;game.handleMove({cardId:s.hands[0][0].id,stone:0},s,0);assert.equal(s.hands[0].length,before-1);assert.equal(s.currentPlayer,1);
  s.currentPlayer=0;s.hands[0]=[];setFormation(s,2,0,trio('red',[7,8,9]),2);
  assert.equal(game.handleMove({pass:true},s,0),null);assert.equal(s.phase,'claim');assert.equal(s.playedThisTurn,false);
  assert.equal(game.handleMove({claim:2},s,0),null);assert.equal(game.handleMove({endTurn:true},s,0),null);assert.equal(s.currentPlayer,1);assert.equal(s.hands[0].length,0);
});
test('private views preserve counts and expose public formations without modifying the authoritative state',()=>{
  const s=state();game.handleMove({cardId:s.hands[0][0].id,stone:0},s,0);const before=structuredClone(s);
  for(const p of [0,1,-1]){const v=game.playerView(s,p);assert(v.deck.every(c=>c===null));for(let i=0;i<2;i++)if(i!==p)assert(v.hands[i].every(c=>c===null));assert.equal(v.stones[0].cards[0].length,1);assert.equal(v.formations.length,9);}
  assert.deepEqual(s,before);
});
test('an abandoned claim window refills only the absent player once before skipping their turn',()=>{
  const s=state();s.hands[0]=[card('red',9)];setFormation(s,0,0,trio('red',[7,8]),null);
  game.handleMove({cardId:'red-9',stone:0},s,0);assert.equal(s.phase,'claim');const deck=s.deck.length,rival=s.hands[1].length;
  game.setCurrentActor(s,1);assert.equal(game.getCurrentActor(s),1);assert.equal(s.phase,'play');assert.equal(s.playedThisTurn,false);
  assert.equal(s.hands[0].length,1);assert.equal(s.hands[1].length,rival);assert.equal(s.deck.length,deck-1);assert.equal(s.stones[0].owner,null);
  game.setCurrentActor(s,1);assert.equal(s.deck.length,deck-1);
});
test('bots use only public information and their own hand; complete games finish legally',()=>{
  const original=state(),agent=bot.createBot(0),before=structuredClone(original),move=agent.getMove(original);
  const hidden=structuredClone(original);hidden.hands[1]=hidden.hands[1].map(()=>null);hidden.deck=hidden.deck.map(()=>null);
  assert.deepEqual(agent.getMove(hidden),move);assert.deepEqual(original,before);
  for(let round=0;round<5;round++){
    const s=state(),agents=[bot.createBot(0),bot.createBot(1)];let turns=0;
    while(s.winner===null&&turns++<250){const p=s.currentPlayer;assert.equal(game.handleMove(agents[p].getMove(s),s,p),null);}
    assert.notEqual(s.winner,null,'full game must finish');
  }
});
