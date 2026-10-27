const {botName}=require('./lib/bot-name');
const rules=require('../games/schotten-totten');
exports.name='schotten-totten';
exports.createBot=player=>({name:botName(player,'zh'),getMove(state){
  if(state.phase==='claim'){
    const claims=rules.listClaims(state,player);
    return claims.length?{claim:claims[0]}:{endTurn:true};
  }
  const slots=rules.legalSlots(state,player),hand=state.hands[player]||[];
  if(!slots.length||!hand.length)return {pass:true};
  let best=null,bestScore=-Infinity;
  for(const card of hand)for(const index of slots){
    const stone=state.stones[index],cards=stone.cards[player].concat(card),opponent=stone.cards[1-player];
    let score=cards.length*5+card.value/10;
    if(cards.length===3){
      const rank=rules.formation(cards);score+=rank.tier*10+rank.sum/3;
      if(opponent.length===3){const result=rules.compareFormations(rank,rules.formation(opponent));score+=result>0?75:-80;}
    }else if(cards.length===2){
      if(cards[0].color===cards[1].color)score+=10;
      if(cards[0].value===cards[1].value)score+=12;
      if(Math.abs(cards[0].value-cards[1].value)<=2&&cards[0].value!==cards[1].value)score+=7;
      if(hand.some(c=>c.id!==card.id&&cards.every(x=>x.color===c.color)))score+=4;
    }
    for(const offset of [-2,-1,1,2]){const neighbor=state.stones[index+offset];if(neighbor&&neighbor.owner!==null)score+=neighbor.owner===player?3:2;}
    if(score>bestScore){bestScore=score;best={cardId:card.id,stone:index};}
  }
  return best;
}});
