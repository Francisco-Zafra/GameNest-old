// Classic two-player Schotten Totten. Original UI/art; no tactical cards.
const { maskView } = require('./lib/hidden');
exports.name = 'schotten-totten';
exports.maxPlayers = 2;
exports.minPlayers = 2;
const COLORS = ['red','blue','green','yellow','purple','pink'];
function allCards() {
  return COLORS.flatMap(color => Array.from({length:9},(_,i)=>({id:color+'-'+(i+1),color,value:i+1})));
}
function emptyStones() { return Array.from({length:9},()=>({cards:[[],[]],completed:[null,null],owner:null})); }
exports.createState = () => ({hands:[[],[]],deck:[],stones:emptyStones(),currentPlayer:0,winner:null,
  phase:'play',actionSeq:0,lastAction:null,lastPlayed:null,playedThisTurn:false});
exports.initGame = (state, count=2) => {
  if (count !== 2) throw new Error('Schotten Totten needs exactly two players');
  const deck=allCards();
  for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
  Object.assign(state,exports.createState());
  state.hands=[deck.splice(0,6),deck.splice(0,6)];state.deck=deck;
};
// Higher tier, then higher total. In exact ties, the first completed formation wins.
function formation(cards) {
  if(cards.length!==3)return null;
  const values=cards.map(c=>c.value).sort((a,b)=>a-b);
  const flush=cards.every(c=>c.color===cards[0].color), same=values[0]===values[2];
  const run=values[1]===values[0]+1&&values[2]===values[1]+1;
  return {tier:flush&&run?5:same?4:flush?3:run?2:1,sum:values[0]+values[1]+values[2]};
}
function compare(a,b){return a.tier-b.tier||a.sum-b.sum;}
function legalSlots(state,player){return state.stones.map((s,i)=>s.owner===null&&s.cards[player].length<3?i:-1).filter(i=>i>=0);}
function publicPool(state) {
  const played=new Set(state.stones.flatMap(s=>s.cards.flat()).map(c=>c.id));
  // Deliberately includes both hands: a private card is not public proof.
  return allCards().filter(c=>!played.has(c.id));
}
function canClaim(state,player,index,pool) {
  const stone=state.stones[index];
  if(!stone||stone.owner!==null||stone.cards[player].length!==3)return false;
  const mine=formation(stone.cards[player]), other=stone.cards[1-player];
  if(other.length===3){const difference=compare(mine,formation(other));return difference>0||(difference===0&&stone.completed[player]<stone.completed[1-player]);}
  const available=pool||publicPool(state), needed=3-other.length;
  // Exhaust every possible completion from publicly unseen cards, without using
  // either player's actual hand or the shuffled deck order.
  function canBeat(start,chosen){
    if(chosen.length===needed)return compare(formation(other.concat(chosen)),mine)>0;
    for(let i=start;i<=available.length-(needed-chosen.length);i++){
      chosen.push(available[i]);const beats=canBeat(i+1,chosen);chosen.pop();if(beats)return true;
    }
    return false;
  }
  return !canBeat(0,[]);
}
function listClaims(state,player){const pool=publicPool(state);return state.stones.map((_,i)=>canClaim(state,player,i,pool)?i:-1).filter(i=>i>=0);}
function checkWin(state,player){
  const owners=state.stones.map(s=>s.owner);
  if(owners.filter(p=>p===player).length>=5||owners.some((p,i)=>i<7&&p===player&&owners[i+1]===player&&owners[i+2]===player)){
    state.winner=player;state.phase='over';
  }
}
function action(state,player,type,extra){state.lastAction=Object.assign({player,type,seq:++state.actionSeq},extra);}
function endTurn(state){
  if(state.playedThisTurn&&state.deck.length)state.hands[state.currentPlayer].push(state.deck.pop());
  state.playedThisTurn=false;state.currentPlayer=1-state.currentPlayer;state.phase='play';
}
exports.getCurrentActor=state=>state.currentPlayer;
// The server calls this after an absent player's reconnect grace expires.
exports.setCurrentActor=(state,candidate)=>{
  if(state.winner!==null)return;
  const previous=state.currentPlayer;
  if(state.phase==='claim')endTurn(state);
  state.currentPlayer=candidate;state.phase='play';state.playedThisTurn=false;
  action(state,previous,'pass');
};
exports.handleMove=(data,state,player)=>{
  if(state.winner!==null)return 'g_game_over';
  if(!Number.isInteger(player)||player<0||player>1||player!==state.currentPlayer)return 'g_not_your_turn';
  data=data||{};
  if(state.phase==='claim'){
    if(data.endTurn===true){action(state,player,'end');endTurn(state);return null;}
    if(!Number.isInteger(data.claim)||data.claim<0||data.claim>8)return 'st_choose_claim';
    if(!canClaim(state,player,data.claim))return 'st_cannot_claim';
    state.stones[data.claim].owner=player;action(state,player,'claim',{stone:data.claim});checkWin(state,player);return null;
  }
  if(state.phase!=='play')return 'g_invalid_action';
  if(data.pass===true){
    if(state.hands[player].length&&legalSlots(state,player).length)return 'st_must_play';
    state.playedThisTurn=false;state.phase='claim';action(state,player,'pass');
    if(!listClaims(state,player).length)endTurn(state);return null;
  }
  if(typeof data.cardId!=='string')return 'st_choose_card';
  const cardIndex=state.hands[player].findIndex(c=>c.id===data.cardId);
  if(cardIndex<0)return 'st_card_not_in_hand';
  if(!Number.isInteger(data.stone)||data.stone<0||data.stone>8)return 'st_choose_stone';
  const stone=state.stones[data.stone];
  if(stone.owner!==null)return 'st_stone_claimed';
  if(stone.cards[player].length>=3)return 'st_stone_full';
  const card=state.hands[player].splice(cardIndex,1)[0];stone.cards[player].push(card);
  action(state,player,'play',{stone:data.stone,card});
  if(stone.cards[player].length===3)stone.completed[player]=state.actionSeq;
  state.lastPlayed={player,stone:data.stone,cardId:card.id,seq:state.actionSeq};
  state.playedThisTurn=true;state.phase='claim';
  if(!listClaims(state,player).length)endTurn(state);
  return null;
};
exports.playerView=(state,player)=>Object.assign({},maskView(state,player,{piles:['deck']}),{
  claimable:state.winner===null&&state.phase==='claim'&&player===state.currentPlayer?listClaims(state,player):[],
  formations:state.stones.map(s=>s.cards.map(formation))
});
exports.formation=formation;
exports.compareFormations=compare;
exports.canClaim=canClaim;
exports.listClaims=listClaims;
exports.legalSlots=legalSlots;
exports.allCards=allCards;
