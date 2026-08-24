// App bootstrap: theme, sidebar, router table, command palette, shortcuts.

import { $, $$, esc, debounce, highlight } from './util.js';
import { route, start, resolve, go, parseHash, setNotFound, onNavigate } from './router.js';
import { siteIndex, buildSearchIndex, searchDocsFor } from './content.js';
import { state, setSetting, onChange, liveStreak } from './store.js';
import { empty } from './ui.js';

/* ------------------------------------------------------------ chrome ---- */

function applySettings() {
  document.documentElement.dataset.theme = state.settings.theme;
  document.body.dataset.lang = state.settings.lang;
  $('#streakNum').textContent = liveStreak();
  $('#xpNum').textContent = `${state.xp} XP`;
}

$('#themeToggle').addEventListener('click', () =>
  setSetting('theme', state.settings.theme === 'dark' ? 'light' : 'dark'));
$('#langToggle').addEventListener('click', () => {
  setSetting('lang', state.settings.lang === 'bn' ? 'en' : 'bn');
  resolve();
});
onChange(applySettings);

const closeNav = () => { document.body.classList.remove('nav-open'); $('#scrim').hidden = true; };
$('#navToggle').addEventListener('click', () => {
  const open = document.body.classList.toggle('nav-open');
  $('#scrim').hidden = !open;
  $('#navToggle').setAttribute('aria-expanded', String(open));
});
$('#scrim').addEventListener('click', closeNav);

/* -------------------------------------------------------- course nav ---- */

async function buildCourseNav() {
  const idx = await siteIndex();
  const site = idx.site || {};
  if (site.title) { $('#brandTitle').textContent = site.title; document.title = site.title; }
  if (site.subtitle) $('#brandSub').textContent = site.shortSubtitle || 'Study Hub';

  $('#courseNav').innerHTML = (idx.courses || []).map((c) => `
    <a class="side-link" href="#/c/${esc(c.id)}" data-match="^/c/${esc(c.id)}">
      <span class="cdot" style="background:${esc(c.color || '#7c8cff')}"></span>
      <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.short || c.title)}</span>
      <span class="ccode">${esc(c.code || '')}</span>
    </a>`).join('') || '<div class="side-link tiny">No courses in content/index.json</div>';
}

function markActive(path) {
  $$('.side-link[data-match]').forEach((a) => {
    a.classList.toggle('active', new RegExp(a.dataset.match).test(path));
  });
}

/* ------------------------------------------------------------ router ---- */

const view = $('#view');
let cleanup = null;

function page(loader) {
  return async (ctx) => {
    view.innerHTML = '<div class="loading">Loading…</div>';
    try {
      const mod = await loader();
      const result = await mod.default(ctx);
      const { html, mount } = typeof result === 'string' ? { html: result } : result;
      if (cleanup) { cleanup(); cleanup = null; }
      view.innerHTML = html;
      if (mount) cleanup = mount(view) || null;
      // Restore the in-page anchor after a render, or go to the top.
      const hashTarget = location.hash.split('#')[2];
      if (hashTarget) document.getElementById(hashTarget)?.scrollIntoView();
      else if (!ctx.query.keepScroll) scrollTo({ top: 0 });
      $('#main').focus({ preventScroll: true });
    } catch (err) {
      console.error(err);
      view.innerHTML = empty('Something went wrong', `<code>${esc(err.message)}</code>`);
    }
  };
}

const Home       = page(() => import('./views/home.js'));
const Course     = page(() => import('./views/course.js'));
const Theory     = page(() => import('./views/theory.js'));
const Questions  = page(() => import('./views/questions.js'));
const Recall     = page(() => import('./views/recall.js'));
const Exam       = page(() => import('./views/exam.js'));
const Notes      = page(() => import('./views/notes.js'));
const Textbooks  = page(() => import('./views/textbooks.js'));
const Progress   = page(() => import('./views/progress.js'));
const Help       = page(() => import('./views/help.js'));

route('/', Home);
route('/progress', Progress);
route('/help', Help);
route('/questions', Questions);
route('/recall', Recall);
route('/exam', Exam);
route('/notes', Notes);
route('/textbooks', Textbooks);
route('/c/:cid', Course);
route('/c/:cid/theory/:tid', Theory);
route('/c/:cid/questions', Questions);
route('/c/:cid/recall', Recall);
route('/c/:cid/exam', Exam);
route('/c/:cid/notes', Notes);
route('/c/:cid/notes/:nid', Notes);
route('/c/:cid/textbooks', Textbooks);

setNotFound(({ path }) =>
  view.innerHTML = empty('Page not found', `Nothing is routed at <code>${esc(path)}</code>.
    <p style="margin-top:14px"><a class="btn" href="#/">Back to dashboard</a></p>`));

onNavigate((r) => { markActive(r.path); closeNav(); });

/* --------------------------------------------------- command palette ---- */

const palette = $('#palette');
const paletteInput = $('#paletteInput');
const paletteResults = $('#paletteResults');
let results = [], sel = 0, docs = null;

async function openPalette(initial = '') {
  palette.hidden = false;
  paletteInput.value = initial;
  paletteInput.focus();
  paletteInput.select();
  if (!docs) {
    paletteResults.innerHTML = '<div class="pres"><span class="k">⏳</span><div class="t"><b>Indexing content…</b></div></div>';
    docs = await buildSearchIndex();
  }
  runSearch();
}
const closePalette = () => { palette.hidden = true; };

function runSearch() {
  const q = paletteInput.value.trim();
  results = docs ? searchDocsFor(docs, q, 30) : [];
  sel = 0;
  if (!q) {
    paletteResults.innerHTML = `<div class="pres"><span class="k">💡</span><div class="t">
      <b>Type to search every theory, question, note and book</b>
      <small>Try a chapter name, a year like 2019, or an English term</small></div></div>`;
    return;
  }
  paletteResults.innerHTML = results.length
    ? results.map((r, i) => `<div class="pres${i === sel ? ' sel' : ''}" data-i="${i}">
        <span class="k">${r.icon}</span>
        <div class="t"><b>${highlight(esc(r.title), q)}</b><small>${esc(r.sub)}</small></div>
      </div>`).join('')
    : `<div class="pres"><span class="k">🔍</span><div class="t"><b>No matches for “${esc(q)}”</b></div></div>`;
  paletteResults.querySelectorAll('[data-i]').forEach((el) =>
    el.addEventListener('click', () => pick(Number(el.dataset.i))));
}

function pick(i) {
  const r = results[i];
  if (!r) return;
  closePalette();
  go(r.href);
}

function move(d) {
  if (!results.length) return;
  sel = (sel + d + results.length) % results.length;
  paletteResults.querySelectorAll('.pres').forEach((el, i) => el.classList.toggle('sel', i === sel));
  paletteResults.querySelectorAll('.pres')[sel]?.scrollIntoView({ block: 'nearest' });
}

paletteInput.addEventListener('input', debounce(runSearch, 120));
paletteInput.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
  else if (e.key === 'Enter') { e.preventDefault(); pick(sel); }
  else if (e.key === 'Escape') closePalette();
});
palette.addEventListener('click', (e) => { if (e.target === palette) closePalette(); });

$('#omniForm').addEventListener('submit', (e) => e.preventDefault());
$('#omni').addEventListener('focus', () => { openPalette($('#omni').value); $('#omni').blur(); });

/* -------------------------------------------------------- shortcuts ---- */

addEventListener('keydown', (e) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
  if ((e.key === '/' || (e.key === 'k' && (e.ctrlKey || e.metaKey))) && !typing) {
    e.preventDefault(); openPalette();
  } else if (e.key === 'Escape' && !palette.hidden) {
    closePalette();
  } else if (!typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
    if (e.key === 't') $('#themeToggle').click();
    else if (e.key === 'l') $('#langToggle').click();
    else if (e.key === 'g') { window.__g = true; setTimeout(() => { window.__g = false; }, 900); }
    else if (window.__g) {
      const map = { h: '#/', q: '#/questions', r: '#/recall', e: '#/exam', n: '#/notes', b: '#/textbooks', p: '#/progress' };
      if (map[e.key]) { go(map[e.key]); window.__g = false; }
    }
  }
});

/* ------------------------------------------------------------- boot ---- */

applySettings();
await buildCourseNav();
await start();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
