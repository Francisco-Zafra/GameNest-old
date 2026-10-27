const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');

function browser(saved, locale = 'es-ES') {
  const storage = new Map(saved ? [['lang', saved]] : []);
  const context = {
    window: { location: { reload() { context.reloaded = true; } } },
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    navigator: { language: locale },
    document: { documentElement: {}, querySelectorAll: () => [] }
  };
  vm.createContext(context);
  for (const file of ['public/js/lang/zh.js', 'public/js/lang/en.js', 'public/js/lang/es.js', 'public/js/lang/catalog-zh.js', 'public/js/lang/catalog-en.js', 'public/js/lang/catalog-es.js', 'public/js/game-catalog.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  }
  context.storage = storage;
  return context;
}

test('a Spanish browser starts in Spanish and untranslated game text falls back to English', () => {
  const c = browser();
  assert.equal(c.window.__ACTIVE_LANG, 'es');
  assert.equal(c.document.documentElement.lang, 'es');
  assert.equal(c.window._t('create_room'), 'Crear sala');
  assert.equal(c.window._t('ww_role_wolf'), c.window.__LANG.en.ww_role_wolf);
  assert.equal(c.window._t('unknown_translation'), 'unknown_translation');
});

test('saved English and Chinese choices override the browser locale', () => {
  for (const lang of ['en', 'zh']) {
    const c = browser(lang);
    assert.equal(c.window.__ACTIVE_LANG, lang);
    assert.equal(c.window._t('ready'), c.window.__LANG[lang].ready);
    assert.equal(c.window.gameCatalog.byId('chess').name, c.window.__LANG[lang].catalog.chess.name);
  }
});

test('language switching persists the choice and ignores unsupported languages', () => {
  const c = browser('en');
  c.window._switchLang('es');
  assert.equal(c.storage.get('lang'), 'es');
  assert.equal(c.window.__ACTIVE_LANG, 'es');
  assert.equal(c.reloaded, true);
  c.reloaded = false;
  c.window._switchLang('unknown');
  assert.equal(c.storage.get('lang'), 'es');
  assert.equal(c.reloaded, false);
});

test('Spanish catalog covers every current game without changing player limits or durations', () => {
  const c = browser('es');
  const en = c.window.__LANG.en.catalog;
  const es = c.window.__LANG.es.catalog;
  assert.deepEqual(Object.keys(es).sort(), Object.keys(en).sort());
  for (const id of Object.keys(en)) {
    const entry = c.window.gameCatalog.byId(id);
    assert.equal(entry.name, es[id].name);
    assert.equal(entry.duration, en[id].duration);
    assert.equal(entry.players.replace(/jugadores/i, 'players'), en[id].players.toLowerCase());
    assert.ok(entry.tags.length);
  }
  assert.equal(c.window.gameCatalog.byId('chess').name, 'Ajedrez');
  assert.ok(c.window.gameCatalog.categories().includes('Fiesta'));
});

test('Spanish translations preserve all interpolation placeholders', () => {
  const c = browser('es');
  const placeholders = value => (value.match(/%s/g) || []).length;
  for (const [key, value] of Object.entries(c.window.__LANG.es)) {
    if (typeof value === 'string' && typeof c.window.__LANG.en[key] === 'string') {
      assert.equal(placeholders(value), placeholders(c.window.__LANG.en[key]), key);
    }
  }
  assert.equal(c.window._tf('uno_player', 3), 'Jugador 3');
  const en = require('../lang/server-en');
  const es = require('../lang/server-es');
  for (const key of Object.keys(en)) assert.equal(placeholders(es[key]), placeholders(en[key]), key);
  assert.equal(es.room_full, 'La sala está llena');
  assert.equal(es.uno_have_playable_card, 'Tienes una carta que puedes jugar');
});

test('untranslated game narratives use English for Spanish rooms while Chinese stays unchanged', () => {
  const {pick} = require('../games/lib/i18n');
  assert.equal(pick({_lang:'es'}, '中文', 'English'), 'English');
  assert.equal(pick({_lang:'en'}, '中文', 'English'), 'English');
  assert.equal(pick({_lang:'zh'}, '中文', 'English'), '中文');
  assert.equal(pick({}, '中文', 'English'), '中文');
});
