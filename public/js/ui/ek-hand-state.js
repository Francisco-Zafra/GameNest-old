// View-only hand ordering, private card draws and public bomb detection.
(function(root) {
  var order = ['attack', 'skip', 'future', 'shuffle', 'favor', 'steal', 'defuse', 'explode'];
  function sortHand(hand) {
    return (hand || []).filter(function(card) { return card && card.type; }).slice().sort(function(a, b) {
      var left = order.indexOf(a.type), right = order.indexOf(b.type);
      var difference = (left < 0 ? order.length : left) - (right < 0 ? order.length : right);
      return difference || String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
    });
  }
  function snapshot(state, self) {
    return { self: self, seq: state.actionSeq || 0,
      ids: (state.hands[self] || []).filter(Boolean).map(function(card) { return card.id; }) };
  }
  function findDraw(previous, state, self) {
    var action = state.lastAction;
    // Reconnecting during placement must restore the mandatory choice.
    if (!previous && state.phase === 'reinsert' && state.pendingKitten) {
      return { card: {type:'explode',id:'pending-kitten'}, outcome:'defuse', seq:state.actionSeq || 0, player:state.pendingKitten.player };
    }
    if (!previous || previous.self !== self || !action || action.seq <= previous.seq) return null;
    if (action.type === 'defuse' || action.type === 'explode') {
      return { card: { type: 'explode', id: 'draw-explode-' + action.seq }, outcome: action.type, seq: action.seq, player:action.player };
    }
    if (action.type !== 'draw' || action.player !== self) return null;
    var added = (state.hands[self] || []).filter(function(card) { return card && previous.ids.indexOf(card.id) === -1; });
    return added.length === 1 ? { card: added[0], outcome: 'hand', seq: action.seq } : null;
  }
  var api = { sortHand: sortHand, snapshot: snapshot, findDraw: findDraw };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.EKHandState = api;
})(typeof window !== 'undefined' ? window : null);
