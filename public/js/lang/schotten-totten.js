(function(){
  // English / Spanish / Chinese. Cards use a symbol as well as a clan color.
  var rows={
    st_kicker:['CLANS OF THE BORDER','CLANES DE LA FRONTERA','边境氏族'],
    st_goal:['Win 3 adjacent stones or 5 in total','Gana 3 piedras seguidas o 5 en total','夺取相邻三块石头或任意五块'],
    st_rules:['How to play','Cómo jugar','玩法'],st_overview:['The nine stones','Las nueve piedras','九块边界石'],
    st_hand:['Your hand','Tu mano','你的手牌'],st_sort_color:['By clan','Por clan','按氏族'],st_sort_value:['By value','Por valor','按数值'],
    st_you:['You','Tú','你'],st_rival:['Opponent','Rival','对手'],st_deck:['Deck','Mazo','牌堆'],
    st_my_turn:['Your turn','Tu turno','你的回合'],st_wait:['%s’s turn','Turno de %s','轮到 %s'],
    st_pick:['Choose a card and a stone.','Elige una carta y una piedra.','选择一张牌和一块石头。'],
    st_place_hint:['The card is placed when you confirm.','La carta se coloca cuando confirmas.','确认后才会放置卡牌。'],
    st_claim_hint:['Claim stones or finish your turn.','Puedes reclamar piedras o terminar el turno.','可以夺取石头或结束回合。'],
    st_stone:['Stone %s','Piedra %s','石头 %s'],st_place:['Play at stone %s','Jugar en piedra %s','放在石头 %s'],
    st_claim:['Claim stone %s','Reclamar piedra %s','夺取石头 %s'],st_finish:['Finish turn','Terminar turno','结束回合'],
    st_draw_end:['Draw and finish','Robar y terminar','抽牌并结束'],st_pass:['Pass','Pasar','跳过'],
    st_pending:['Sending…','Enviando…','发送中…'],st_detail:['Inspect this stone','Ver esta piedra','查看此石头'],st_close:['Close','Cerrar','关闭'],
    st_empty:['No cards','Sin cartas','无卡牌'],st_your_formation:['Your formation','Tu formación','你的组合'],
    st_their_formation:['Opponent’s formation','Formación rival','对手的组合'],st_sum:['Total %s','Suma %s','总和 %s'],
    st_incomplete:['%s of 3 cards','%s de 3 cartas','%s / 3 张'],
    st_formation_1:['Sum','Suma','总和'],st_formation_2:['Run','Escalera','顺子'],st_formation_3:['Color','Color','同色'],
    st_formation_4:['Three of a kind','Trío','三条'],st_formation_5:['Color-run','Escalera de color','同色顺子'],
    st_claim_ready:['You can claim this','La puedes reclamar','可以夺取'],
    st_claim_timing:['Claims are checked after you place a card, before drawing.','Las reclamaciones se comprueban después de colocar tu carta, antes de robar.','放置卡牌后、抽牌前检查能否夺取石头。'],
    st_proof:['No formation of unplayed cards can beat yours.','Ninguna combinación de cartas no jugadas puede superarte.','所有尚未打出的卡牌都无法超越你的组合。'],
    st_no_proof:['Your opponent can still beat this, or completed first.','El rival aún puede superarte, o completó su formación antes.','对手仍可能超越，或比你更早完成。'],
    st_need_three:['Complete your three cards to contest this stone.','Completa tus tres cartas para disputar esta piedra.','先完成三张牌的组合。'],
    st_owned:['Claimed by %s','Piedra de %s','属于 %s'],st_first:['Exact ties favor whoever completed first.','En empate gana quien completó primero.','完全相同时，先完成者获胜。'],
    st_count:['%s stones','%s piedras','%s 块石头'],st_hand_count:['%s cards','%s cartas','%s 张牌'],
    st_new:['New','Nueva','新牌'],st_selected:['Selected','Elegida','已选'],
    st_no_slots:['No card can be placed. Pass to check claims.','No puedes colocar cartas. Pasa para comprobar reclamaciones.','没有位置可放牌，请跳过并检查可夺取石头。'],
    st_win:['Border conquered!','¡Frontera conquistada!','边界已征服！'],st_winner:['%s wins','Gana %s','%s 获胜'],
    st_play_log:['%s placed %s at stone %s.','%s ha colocado %s en la piedra %s.','%s 将 %s 放在石头 %s。'],
    st_claim_log:['%s claimed stone %s.','%s ha reclamado la piedra %s.','%s 夺取了石头 %s。'],
    st_end_log:['%s ended their turn.','%s ha terminado su turno.','%s 结束了回合。'],
    st_pass_log:['%s passed.','%s ha pasado.','%s 跳过。'],st_start:['The border is still open.','La frontera está por decidir.','边界尚未决定。'],
    st_clear:['Clear selection','Quitar selección','取消选择'],
    st_clan_red:['Fox','Zorro','狐狸'],st_clan_blue:['Otter','Nutria','水獭'],st_clan_green:['Stag','Ciervo','鹿'],
    st_clan_yellow:['Badger','Tejón','獾'],st_clan_purple:['Owl','Búho','猫头鹰'],st_clan_pink:['Hare','Liebre','野兔'],
    st_card_label:['%s · %s','%s · %s','%s · %s'],
    st_rank_hint:['Strongest first: color-run, three of a kind, color, run, sum.','De mayor a menor: escalera de color, trío, color, escalera y suma.','从强到弱：同色顺子、三条、同色、顺子、总和。'],
    st_claim_step:['Claim before drawing','Reclama antes de robar','抽牌前夺取石头'],
    st_view_hint:['Swipe the border; tap a stone to select it.','Desliza la frontera; toca una piedra para elegirla.','滑动边界并点选石头。'],
    st_claim_only:['Claiming is optional. Claimed stones are closed.','Reclamar es opcional. La piedra queda cerrada al reclamarla.','可以不夺取。夺取后该位置关闭。']
  };
  var lessons=[
    [{h:'Your turn',p:'Choose a card and a stone, then confirm. Claim stones you have won, then finish to refill your hand. Win with three adjacent stones or five total.'},{h:'Formations and proof',p:'Rank: color-run, three of a kind, color, run, sum. Compare totals next; exact ties favor the first completed formation. Early claims use public cards only: your hand is not proof.'}],
    [{h:'Tu turno',p:'Elige una carta, una piedra y confirma. Reclama las piedras que hayas ganado y termina para reponer tu mano. Ganas con tres piedras contiguas o cinco en total.'},{h:'Formaciones y pruebas',p:'Orden: escalera de color, trío, color, escalera y suma. Después se compara la suma; un empate favorece al primero que completó. Una reclamación anticipada solo usa las cartas públicas: tu mano no sirve de prueba.'}],
    [{h:'你的回合',p:'选择一张牌和一块石头后确认，随后可以夺取已获胜的石头，再抽牌结束。夺取相邻三块或任意五块即获胜。'},{h:'组合与证明',p:'从强到弱：同色顺子、三条、同色、顺子、总和。再比较总数，完全相同则先完成者获胜。提前夺取只根据公开打出的卡牌，不能使用自己的手牌作为证明。'}]
  ];
  ['en','es','zh'].forEach(function(lang,index){var pack=window.__LANG[lang];Object.keys(rows).forEach(function(key){pack[key]=rows[key][index];});pack.tutorials=pack.tutorials||{};pack.tutorials['schotten-totten']={title:'Schotten Totten',sections:lessons[index]};});
})();
