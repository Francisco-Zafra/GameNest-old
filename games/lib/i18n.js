// Shared helper for bilingual state narratives (server-side)
exports.pick = function (state, zh, en) {
  return state && (state._lang === 'en' || state._lang === 'es') ? (en || zh) : zh;
};
