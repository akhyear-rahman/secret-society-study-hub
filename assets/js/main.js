// App bootstrap: theme, reading mode, sidebar, router table, command
// palette, keyboard shortcuts.

import { $, $$, esc, debounce, highlight } from './util.js';
import { route, start, resolve, go, setNotFound, onNavigate } from './router.js';
import { siteIndex, buildSearchIndex, searchDocsFor, allCourses } from './content.js';
import { state, setSetting, onChange, liveStreak, effectiveTheme, cardDue } from './store.js';
import { applyReading, setReading, toggleReading, toggleFocus, nudgeScale, updateProgress, isReading } from './reading.js';
import { empty } from './ui.js';
import { runSplash, enhance, viewOut, viewIn } from './motion.js';

/* ------------------------------------------------------------ theme ---- */

const THEME_ICON = {
  dark:   '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  light:  '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  system: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
};
const THEME_ORDER = ['dark', 'light', 'system'];

function applyTheme() {
  const pref = state.settings.theme;
  document.documentElement.dataset.theme = effectiveTheme();
  $('#themeIcon').innerHTML = THEME_ICON[pref] || THEME_ICON.dark;
  $('#themeToggle').title = `Theme: ${pref} — click to cycle (T)`;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = effectiveTheme() === 'dark' ? '#0a0908' : '#efe8d6';
}

$('#themeToggle').addEventListener('click', () => {
  const i = THEME_ORDER.indexOf(state.settings.theme);
  setSetting('theme', THEME_ORDER[(i + 1) % THEME_ORDER.length]);
});
// Follow the OS while the preference is "system".
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (state.settings.theme === 'system') applyTheme();
});

// Two language pills — one in the topbar for wide screens, one in the drawer
// because the topbar hides it on narrow ones. Both drive the same setting.
function onLangClick(e) {
  const btn = e.target.closest('[data-lang]');
  if (!btn) return;
  setSetting('lang', btn.dataset.lang);
  resolve();
}
$('#langToggle').addEventListener('click', onLangClick);
$('#langToggleDrawer').addEventListener('click', onLangClick);

function applyChrome() {
  applyTheme();
  document.body.dataset.lang = state.settings.lang;
  $('#streakNum').textContent = liveStreak();
  $('#xpNum').textContent = `${state.xp} XP`;
  applyReading();
}
onChange(applyChrome);

/* ---------------------------------------------------- reading mode ---- */

$('#readExit').addEventListener('click', () => { setReading(false); resolve(); });
addEventListener('scroll', updateProgress, { passive: true });

/* -------------------------------------------------------- sidebar ---- */

function setNav(open) {
  document.body.classList.toggle('nav-open', open);
  $('#scrim').hidden = !open;
  $('#navToggle').setAttribute('aria-expanded', String(open));
  $('#sidebar').setAttribute('aria-hidden', String(!open));
  if (open) $('#sidebar').querySelector('.side-link')?.focus({ preventScroll: true });
  else $('#navToggle').focus({ preventScroll: true });
}
const closeNav = () => setNav(false);
const isNavOpen = () => document.body.classList.contains('nav-open');

$('#navToggle').addEventListener('click', () => setNav(!isNavOpen()));
$('#navClose').addEventListener('click', closeNav);
$('#scrim').addEventListener('click', closeNav);

async function buildCourseNav() {
  const idx = await siteIndex();
  const site = idx.site || {};
  if (site.brand) $('#brandTitle').textContent = site.brand;
  if (site.title) document.title = site.title;
  if (site.shortSubtitle) $('#brandSub').textContent = site.shortSubtitle;

  $('#courseNav').innerHTML = (idx.courses || []).map((c) => `
    <a class="side-link" href="#/c/${esc(c.id)}" data-match="^/c/${esc(c.id)}">
      <span class="cdot" style="background:${esc(c.color || '#7c8cff')}"></span>
      <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.short || c.title)}</span>
      <span class="ccode">${esc(c.code || '')}</span>
    </a>`).join('') || '<div class="side-link tiny">No courses in content/index.json</div>';
}

/** Show the number of cards due beside Active Recall, once content loads. */
async function refreshDueBadge() {
  try {
    const courses = await allCourses();
    const due = courses.flatMap((c) => c.cards).filter((c) => cardDue(c.id)).length;
    const el = $('#dueBadge');
    el.textContent = due;
    el.hidden = !due;
  } catch { /* content not available; leave the badge hidden */ }
}

function markActive(path) {
  $$('.side-link[data-match]').forEach((a) =>
    a.classList.toggle('active', new RegExp(a.dataset.match).test(path)));
}

/* ------------------------------------------------------------ router ---- */

const view = $('#view');
const routebar = $('#routebar');
let cleanup = null;
let navToken = 0;

function barStart() { routebar.classList.add('on'); routebar.style.width = '55%'; }
function barDone() {
  routebar.style.width = '100%';
  setTimeout(() => { routebar.classList.remove('on'); routebar.style.width = '0'; }, 220);
}

function page(loader) {
  return async (ctx) => {
    const token = ++navToken;
    barStart();
    // Only show the spinner if loading actually takes a moment — otherwise
    // it flashes on every cached navigation.
    const spinner = setTimeout(() => {
      if (token === navToken) view.innerHTML = '<div class="loading">Loading…</div>';
    }, 140);
    try {
      const [mod] = await Promise.all([loader(), viewOut(view)]);
      const result = await mod.default(ctx);
      if (token !== navToken) return;            // a later navigation won
      clearTimeout(spinner);
      const { html, mount } = typeof result === 'string' ? { html: result } : result;
      if (cleanup) { cleanup(); cleanup = null; }
      view.innerHTML = html;
      viewIn(view);
      if (mount) cleanup = mount(view) || null;
      enhance(view);
      applyReading();          // re-arm focus mode against the new .prose nodes
      const anchor = location.hash.split('#')[2];
      if (anchor) document.getElementById(anchor)?.scrollIntoView();
      else if (!ctx.query.keepScroll) scrollTo({ top: 0 });
      $('#main').focus({ preventScroll: true });
      updateProgress();
      refreshDueBadge();
    } catch (err) {
      clearTimeout(spinner);
      if (token !== navToken) return;
      console.error(err);
      view.innerHTML = empty('Something went wrong', `<code>${esc(err.message)}</code>`);
    } finally {
      if (token === navToken) barDone();
    }
  };
}

const Home      = page(() => import('./views/home.js'));
const Plan      = page(() => import('./views/plan.js'));
const QuestPath = page(() => import('./views/path.js'));
const Course    = page(() => import('./views/course.js'));
const Theory    = page(() => import('./views/theory.js'));
const Questions = page(() => import('./views/questions.js'));
const Recall    = page(() => import('./views/recall.js'));
const Exam      = page(() => import('./views/exam.js'));
const Notes     = page(() => import('./views/notes.js'));
const Textbooks = page(() => import('./views/textbooks.js'));
const Progress  = page(() => import('./views/progress.js'));
const Help      = page(() => import('./views/help.js'));
const About     = page(() => import('./views/about.js'));

route('/', Home);
route('/plan', Plan);
route('/path', QuestPath);
route('/c/:cid/path', QuestPath);
route('/progress', Progress);
route('/help', Help);
route('/about', About);
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

setNotFound(({ path }) => {
  view.innerHTML = empty('Page not found', `Nothing is routed at <code>${esc(path)}</code>.
    <p style="margin-top:14px"><a class="btn" href="#/">Back to dashboard</a></p>`);
});

// Reading mode only makes sense on long-form pages; leaving one exits it.
const LONGFORM = /^\/c\/[^/]+\/(theory|notes)\/|^\/help/;
onNavigate((r) => {
  markActive(r.path);
  closeNav();
  if (isReading() && !LONGFORM.test(r.path)) setReading(false);
});

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
    paletteResults.innerHTML = `<div class="pres"><span class="k">⏳</span>
      <div class="t"><b>Indexing content…</b></div></div>`;
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
      <b>Search every theory, question, note and book</b>
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
  const els = paletteResults.querySelectorAll('.pres');
  els.forEach((el, i) => el.classList.toggle('sel', i === sel));
  els[sel]?.scrollIntoView({ block: 'nearest' });
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
// The topbar search field is hidden on narrow screens, and "/" needs a
// keyboard — so touch users get a button instead.
$('#searchBtn').addEventListener('click', () => openPalette());

/* ---------------------------------------------------------- shortcuts ---- */

let gPending = false;
addEventListener('keydown', (e) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;

  if ((e.key === '/' || (e.key === 'k' && (e.ctrlKey || e.metaKey))) && !typing) {
    e.preventDefault(); openPalette(); return;
  }
  if (e.key === 'Escape') {
    if (!palette.hidden) { closePalette(); return; }
    if (isNavOpen()) { closeNav(); return; }
    if (isReading()) { setReading(false); resolve(); return; }
  }
  if (typing || e.ctrlKey || e.metaKey || e.altKey) return;

  if (gPending) {
    const map = { h: '#/', p: '#/plan', m: '#/path', q: '#/questions', r: '#/recall',
                  e: '#/exam', n: '#/notes', b: '#/textbooks', s: '#/progress' };
    gPending = false;
    if (map[e.key]) { e.preventDefault(); go(map[e.key]); }
    return;
  }
  if (e.key === 'g') { gPending = true; setTimeout(() => { gPending = false; }, 900); }
  else if (e.key === 't') $('#themeToggle').click();
  else if (e.key === 'l') setSetting('lang', state.settings.lang === 'bn' ? 'en' : 'bn') || resolve();
  else if (e.key === 'f') { toggleReading(); resolve(); }
  else if (e.key === 'd') { toggleFocus(); resolve(); }
  else if (e.key === '+' || e.key === '=') nudgeScale(1);
  else if (e.key === '-') nudgeScale(-1);
});

/* --------------------------------------------------------------- boot ---- */

applyChrome();
// The seal shows while the content index and first view load behind it.
const splash = runSplash();
await buildCourseNav();
await start();
await splash;
refreshDueBadge();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
