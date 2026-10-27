// View-only hand ordering and private draw detection. Never changes server state.
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
    if (!previous || previous.self !== self || !action || action.player !== self || action.seq <= previous.seq) return null;
    if (action.type === 'defuse' || action.type === 'explode') {
      return { card: { type: 'explode', id: 'draw-explode-' + action.seq }, outcome: action.type, seq: action.seq };
    }
    if (action.type !== 'draw') return null;
    var added = (state.hands[self] || []).filter(function(card) { return card && previous.ids.indexOf(card.id) === -1; });
    return added.length === 1 ? { card: added[0], outcome: 'hand', seq: action.seq } : null;
  }
  var api = { sortHand: sortHand, snapshot: snapshot, findDraw: findDraw };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.EKHandState = api;
})(typeof window !== 'undefined' ? window : null);
