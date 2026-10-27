(function(){
  window.gameRenderers=window.gameRenderers||new Map();
  var CLANS={red:{cell:0,color:'#a63d2e',symbol:'◆'},blue:{cell:1,color:'#275f91',symbol:'●'},green:{cell:2,color:'#34714b',symbol:'▲'},yellow:{cell:3,color:'#8f650e',symbol:'✦'},purple:{cell:4,color:'#744985',symbol:'✚'},pink:{cell:5,color:'#ad426c',symbol:'■'}};
  var ui;
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function t(key){return window._t(key);}
  function tf(){return window._tf.apply(null,arguments);}
  function node(id){return ui.root.querySelector('#'+id);}
  function name(index){return window.getPlayerName?window.getPlayerName(index):t(index===ui.self?'st_you':'st_rival');}
  function hand(){return ui.state.hands[ui.self]||[];}
  function mine(){return ui.state.winner==null&&ui.state.currentPlayer===ui.self;}
  function claims(){return ui.state.claimable||[];}
  function slots(){return ui.state.stones.map(function(s,i){return s.owner==null&&s.cards[ui.self].length<3?i:-1;}).filter(function(i){return i>=0;});}
  function label(card){return tf('st_card_label',t('st_clan_'+card.color),card.value);}
  function art(cell){return '<span class="st-art" aria-hidden="true" style="--art-x:'+(cell%3)*50+'%;--art-y:'+Math.floor(cell/3)*50+'%"></span>';}
  function mini(card){var clan=CLANS[card.color];return '<span class="st-mini" style="--clan:'+clan.color+'" title="'+esc(label(card))+'"><span aria-hidden="true">'+clan.symbol+'</span><b>'+card.value+'</b></span>';}
  function formation(index,player){var rank=ui.state.formations&&ui.state.formations[index][player];return rank?t('st_formation_'+rank.tier)+' · '+tf('st_sum',rank.sum):tf('st_incomplete',ui.state.stones[index].cards[player].length);}
  function ownerLabel(stone){return stone.owner==null?'':tf('st_owned',stone.owner===ui.self?t('st_you'):name(stone.owner));}
  function init(container){
    if(ui)clearTimeout(ui.newTimer);
    ui={root:container,state:null,self:0,selected:null,stone:4,sort:'color',pending:false,ids:null,newCard:null};
    container.innerHTML='<section class="st-game" id="stGame" aria-label="Schotten Totten">'+
      '<header class="st-header"><div><p class="st-kicker">'+esc(t('st_kicker'))+'</p><h1>Schotten <em>Totten</em></h1></div><div class="st-tools"><button data-action="rules">'+esc(t('st_rules'))+'</button><button data-action="restart" aria-label="'+esc(t('restart'))+'">↻</button></div></header>'+
      '<p class="st-goal">'+esc(t('st_goal'))+'</p><div class="st-score" id="stScore"></div>'+
      '<div class="st-turn" role="status"><div><strong id="stStatus"></strong><span id="stHint"></span></div><span class="st-deck-count" id="stDeck"></span></div>'+
      '<nav class="st-overview" id="stOverview" aria-label="'+esc(t('st_overview'))+'"></nav>'+
      '<div class="st-border-heading"><span>'+esc(t('st_view_hint'))+'</span><button data-action="detail">'+esc(t('st_detail'))+' ↗</button></div>'+
      '<div class="st-border-scroll" id="stBorderScroll"><div class="st-border" id="stBorder"></div></div>'+
      '<p class="st-log" id="stLog" aria-live="polite"></p><p class="st-error" id="stError" role="alert"></p>'+
      '<section class="st-dock"><div class="st-hand-heading"><strong>'+esc(t('st_hand'))+' <span id="stHandCount"></span></strong><button data-action="sort" id="stSort"></button></div><div class="st-hand" id="stHand"></div>'+
      '<div class="st-command"><span id="stSelection"></span><button class="st-secondary" data-action="end" id="stEnd"></button><button class="st-primary" data-action="primary" id="stPrimary"></button></div></section>'+
      '<dialog class="st-dialog" id="stDetail" aria-labelledby="stDetailTitle"><div class="st-dialog-heading"><h2 id="stDetailTitle"></h2><button data-action="close" aria-label="'+esc(t('st_close'))+'">×</button></div><div id="stDetailBody"></div></dialog></section>';
    ui.section=node('stGame');ui.section.onclick=onClick;
    node('stDetail').addEventListener('click',function(e){if(e.target===this)this.close();});
    window._gameErrorHandler=function(message){if(!ui||!ui.section.isConnected||!ui.state)return;ui.pending=false;node('stError').textContent=message;refreshActions();};
  }
  function onClick(event){
    var button=event.target.closest('button');if(!button||!ui.root.contains(button)||!ui.state)return;
    if(button.dataset.handId){ui.selected=ui.selected===button.dataset.handId?null:button.dataset.handId;renderHand();renderBoard();refreshActions();return;}
    if(button.dataset.stone!==undefined){ui.stone=Number(button.dataset.stone);renderBoard();refreshActions();if(button.dataset.nav!==undefined)scrollToStone();return;}
    switch(button.dataset.action){
      case 'rules':window.showGameTutorial('schotten-totten');break;
      case 'restart':if(window.doRestart)window.doRestart();break;
      case 'sort':ui.sort=ui.sort==='color'?'value':'color';renderHand();break;
      case 'detail':renderDetail();node('stDetail').showModal();break;
      case 'close':node('stDetail').close();break;
      case 'end':if(ui.state.phase==='claim')send({endTurn:true});break;
      case 'claim-detail':if(claims().indexOf(ui.stone)>=0)send({claim:ui.stone});break;
      case 'primary':
        if(ui.state.phase==='claim'){if(claims().indexOf(ui.stone)>=0)send({claim:ui.stone});}
        else if(!hand().length||!slots().length)send({pass:true});
        else if(ui.selected&&slots().indexOf(ui.stone)>=0)send({cardId:ui.selected,stone:ui.stone});
        break;
    }
  }
  function send(move){if(!mine()||ui.pending)return;ui.pending=true;node('stError').textContent='';if(move.cardId)ui.selected=null;if(node('stDetail').open)node('stDetail').close();refreshActions();window.makeGameMove(move);}
  function scrollToStone(){var lane=node('stBorder').querySelector('[data-lane="'+ui.stone+'"]'),wrap=node('stBorderScroll');if(lane)wrap.scrollTo({left:lane.offsetLeft-node('stBorder').offsetLeft-(wrap.clientWidth-lane.offsetWidth)/2,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  function render(state,container,self){
    if(!ui||!state||!state.stones||!state.hands)return;
    var initial=ui.ids===null,reset=ui.state&&state.actionSeq<ui.state.actionSeq,previous=ui.self===self?ui.ids:null;
    ui.state=state;ui.self=self;ui.pending=false;
    if(reset){ui.selected=null;ui.stone=4;ui.newCard=null;previous=null;}
    var cards=hand().filter(Boolean);ui.ids=cards.map(function(c){return c.id;});
    if(ui.selected&&ui.ids.indexOf(ui.selected)<0)ui.selected=null;
    if(previous){var added=cards.filter(function(c){return previous.indexOf(c.id)<0;});if(added.length===1){ui.newCard=added[0].id;clearTimeout(ui.newTimer);var owner=ui;ui.newTimer=setTimeout(function(){if(ui===owner&&ui.section.isConnected){ui.newCard=null;renderHand();}},2600);}}
    if(mine()&&state.phase==='claim'&&claims().length&&claims().indexOf(ui.stone)<0)ui.stone=claims()[0];
    renderScore();renderBoard();renderHand();renderLog();refreshActions();if(node('stDetail').open)renderDetail();
    if(initial||reset)scrollToStone();
  }
  function renderScore(){
    var counts=[0,1].map(function(p){return ui.state.stones.filter(function(s){return s.owner===p;}).length;});
    node('stScore').innerHTML='<div><span>'+esc(t('st_you'))+'</span><strong>'+counts[ui.self]+'</strong></div><span class="st-score-divider">✦</span><div><strong>'+counts[1-ui.self]+'</strong><span>'+esc(name(1-ui.self))+'</span><small>'+esc(tf('st_hand_count',ui.state.hands[1-ui.self].length))+'</small></div>';
  }
  function renderBoard(){
    var valid=slots(),possible=claims();
    node('stOverview').innerHTML=ui.state.stones.map(function(s,i){return '<button data-stone="'+i+'" data-nav="true" aria-label="'+esc(tf('st_stone',i+1)+(s.owner==null?'':', '+ownerLabel(s)))+'" aria-pressed="'+(ui.stone===i)+'" class="'+(s.owner===ui.self?'is-yours':s.owner===1-ui.self?'is-theirs':'')+(possible.indexOf(i)>=0?' is-claimable':'')+'"><b>'+ (i+1)+'</b><span aria-hidden="true">'+(s.owner===ui.self?'▲':s.owner===1-ui.self?'▼':possible.indexOf(i)>=0?'✦':'·')+'</span></button>';}).join('');
    node('stBorder').innerHTML=ui.state.stones.map(function(s,i){
      function stack(p){var list=s.cards[p];return '<span class="st-stack">'+[0,1,2].map(function(n){return list[n]?mini(list[n]):'<span class="st-empty-slot" aria-hidden="true">·</span>';}).join('')+'</span>';}
      var claimable=possible.indexOf(i)>=0,selected=ui.stone===i,closed=s.owner!=null;
      return '<article class="st-lane'+(selected?' is-selected':'')+(closed?' is-closed':'')+(claimable?' is-claimable':'')+(ui.selected&&valid.indexOf(i)>=0?' is-valid':'')+'" data-lane="'+i+'"><button data-stone="'+i+'" aria-pressed="'+selected+'" aria-label="'+esc(tf('st_stone',i+1)+'. '+formation(i,ui.self)+'. '+ownerLabel(s))+'">'+
        '<span class="st-side-label">'+esc(t('st_rival'))+'</span>'+stack(1-ui.self)+'<span class="st-stone '+(s.owner===ui.self?'is-yours':s.owner===1-ui.self?'is-theirs':'')+'">'+art(6)+'<b>'+(i+1)+'</b><small>'+esc(closed?s.owner===ui.self?t('st_you'):t('st_rival'):claimable?'✓':'')+'</small></span>'+stack(ui.self)+'<span class="st-side-label">'+esc(t('st_you'))+'</span></button><span class="st-lane-rank">'+esc(formation(i,ui.self))+'</span></article>';
    }).join('');
  }
  function renderHand(){
    var colors=Object.keys(CLANS),cards=hand().filter(Boolean).slice().sort(function(a,b){return ui.sort==='color'?colors.indexOf(a.color)-colors.indexOf(b.color)||a.value-b.value:a.value-b.value||colors.indexOf(a.color)-colors.indexOf(b.color);});
    node('stHandCount').textContent=cards.length;node('stSort').textContent=t(ui.sort==='color'?'st_sort_color':'st_sort_value');
    node('stHand').innerHTML=cards.map(function(card){var clan=CLANS[card.color];return '<button class="st-card'+(ui.selected===card.id?' is-selected':'')+(ui.newCard===card.id?' is-new':'')+'" data-hand-id="'+esc(card.id)+'" aria-pressed="'+(ui.selected===card.id)+'" aria-label="'+esc(label(card))+'" style="--clan:'+clan.color+'"><span class="st-card-top"><b>'+card.value+'</b><span aria-hidden="true">'+clan.symbol+'</span></span>'+art(clan.cell)+'<span class="st-card-name">'+esc(t('st_clan_'+card.color))+'</span></button>';}).join('')||'<p class="st-empty-hand">'+esc(t('st_empty'))+'</p>';
  }
  function renderLog(){
    var a=ui.state.lastAction,text=t('st_start');
    if(a){if(a.type==='play')text=tf('st_play_log',name(a.player),label(a.card),a.stone+1);else if(a.type==='claim')text=tf('st_claim_log',name(a.player),a.stone+1);else text=tf(a.type==='pass'?'st_pass_log':'st_end_log',name(a.player));}
    node('stLog').textContent=text;
  }
  function refreshActions(){
    var isMine=mine(),ended=ui.state.winner!=null,claiming=ui.state.phase==='claim',noMoves=!hand().length||!slots().length;
    node('stStatus').textContent=ended?tf('st_winner',name(ui.state.winner)):isMine?t(claiming?'st_claim_step':'st_my_turn'):tf('st_wait',name(ui.state.currentPlayer));
    node('stHint').textContent=ended?t('st_goal'):isMine?t(claiming?'st_claim_hint':noMoves?'st_no_slots':ui.selected?'st_place_hint':'st_pick'):t('st_place_hint');
    node('stDeck').textContent=t('st_deck')+' · '+ui.state.deck.length;
    node('stPrimary').textContent=ui.pending?t('st_pending'):claiming?tf('st_claim',ui.stone+1):noMoves?t('st_pass'):ui.selected?tf('st_place',ui.stone+1):t('st_pick');
    node('stPrimary').disabled=!isMine||ui.pending||(claiming?claims().indexOf(ui.stone)<0:!noMoves&&(!ui.selected||slots().indexOf(ui.stone)<0));
    node('stEnd').hidden=!claiming||!isMine;node('stEnd').disabled=ui.pending;
    node('stEnd').textContent=t(ui.state.playedThisTurn&&ui.state.deck.length?'st_draw_end':'st_finish');
    var selected=hand().find(function(c){return c&&c.id===ui.selected;});node('stSelection').textContent=claiming?t('st_claim_only'):selected?label(selected):t('st_place_hint');
    node('stGame').classList.toggle('is-my-turn',isMine);
  }
  function renderDetail(){
    var s=ui.state.stones[ui.stone];node('stDetailTitle').textContent=tf('st_stone',ui.stone+1);
    function side(p,title){return '<section class="st-detail-side"><h3>'+esc(title)+'</h3><div class="st-detail-cards">'+s.cards[p].map(mini).join('')+'</div><strong>'+esc(formation(ui.stone,p))+'</strong></section>';}
    var ready=claims().indexOf(ui.stone)>=0;
    node('stDetailBody').innerHTML=side(1-ui.self,t('st_their_formation'))+side(ui.self,t('st_your_formation'))+
      '<p class="st-detail-proof">'+esc(s.owner!=null?ownerLabel(s):s.cards[ui.self].length<3?t('st_need_three'):ready?t('st_proof'):!mine()||ui.state.phase!=='claim'?t('st_claim_timing'):t('st_no_proof'))+'</p><p>'+esc(t('st_rank_hint'))+'</p><p>'+esc(t('st_first'))+'</p>'+
      (ready?'<button class="st-primary" data-action="claim-detail"'+(ui.pending?' disabled':'')+'>'+esc(tf('st_claim',ui.stone+1))+'</button>':'');
  }
  window.gameRenderers.set('schotten-totten',{init:init,render:render});
})();
