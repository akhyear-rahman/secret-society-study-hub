// Distraction-free reading mode.
//
// Sets body[data-reading="1"], which the stylesheet turns into a book page:
// sidebar gone, topbar faded until hovered, serif type, one comfortable
// column. Also drives the type-size control and the reading progress bar.

import { state, setSetting } from './store.js';
import { clamp } from './util.js';

const MIN = 0.85, MAX = 1.45, STEP = 0.075;

export const isReading = () => document.body.dataset.reading === '1';

export function applyReading() {
  const b = document.body;
  b.dataset.reading = state.settings.reading ? '1' : '0';
  b.dataset.focus = state.settings.focus ? '1' : '0';
  b.dataset.readfont = state.settings.readFont || 'serif';
  b.dataset.readspacing = state.settings.readSpacing || 'normal';
  document.documentElement.style.setProperty('--read-scale', String(state.settings.readScale || 1));
  if (state.settings.focus) wireFocus(); else clearFocus();
  updateProgress();
}

export function setReading(on) {
  setSetting('reading', !!on);
  applyReading();
  if (!on) window.scrollBy({ top: 0 });
}

export function toggleReading() { setReading(!state.settings.reading); }

export function toggleFocus() {
  setSetting('focus', !state.settings.focus);
  applyReading();
}

export function cycleReadFont() {
  setSetting('readFont', state.settings.readFont === 'sans' ? 'serif' : 'sans');
  applyReading();
}

export function cycleSpacing() {
  setSetting('readSpacing', state.settings.readSpacing === 'loose' ? 'normal' : 'loose');
  applyReading();
}

/* ------------------------------------------------------ focus mode ---- */
// Spotlight the block being read and dim the rest, which makes a long answer
// approachable one idea at a time instead of as a wall.
//
// The dimming is expressed as "dim the siblings of the marked block", never
// as "start dimmed and undim the right one". If this code never runs, or an
// observer misses, every block simply stays at full opacity. Content must
// never depend on script to become readable — that mistake has been made in
// this codebase before (see HANDOFF, bugs 3 and 4).

let focusCleanup = null;

function focusBlocks() {
  const out = [];
  for (const prose of document.querySelectorAll('.prose')) {
    for (const el of prose.children) {
      if (el.tagName === 'HR') continue;
      out.push(el);
    }
  }
  return out;
}

function clearFocus() {
  if (focusCleanup) { focusCleanup(); focusCleanup = null; }
  for (const el of document.querySelectorAll('.focus-on')) el.classList.remove('focus-on');
}

function wireFocus() {
  clearFocus();
  const blocks = focusBlocks();
  if (!blocks.length) return;

  let raf = false;
  const mark = () => {
    if (raf) return;
    raf = true;
    requestAnimationFrame(() => {
      raf = false;
      // The block whose top is nearest a line about a third down the viewport.
      const line = window.scrollY + window.innerHeight * 0.34;
      let best = null, bestD = Infinity;
      for (const el of blocks) {
        const top = el.getBoundingClientRect().top + window.scrollY;
        const d = Math.abs(top - line);
        if (d < bestD) { bestD = d; best = el; }
      }
      for (const el of blocks) el.classList.toggle('focus-on', el === best);
    });
  };

  // Clicking a block pins it, which matters for touch, where there is no
  // hover and scrolling to aim is fiddly.
  const onClick = (e) => {
    const el = e.target.closest('.prose > *');
    if (!el) return;
    for (const b of blocks) b.classList.toggle('focus-on', b === el);
  };

  addEventListener('scroll', mark, { passive: true });
  addEventListener('resize', mark, { passive: true });
  document.addEventListener('click', onClick);
  mark();

  focusCleanup = () => {
    removeEventListener('scroll', mark);
    removeEventListener('resize', mark);
    document.removeEventListener('click', onClick);
  };
}

export function nudgeScale(dir) {
  const next = clamp((state.settings.readScale || 1) + dir * STEP, MIN, MAX);
  setSetting('readScale', Number(next.toFixed(3)));
  applyReading();
}

let rafPending = false;

/**
 * Draw the reading progress bar. Visibility is set here rather than left to a
 * CSS descendant rule so the bar behaves the same however the page was
 * reached, and so it can also appear on any long page, not just in reading
 * mode.
 */
export function updateProgress() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;
    const el = document.getElementById('readProgress');
    if (!el) return;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    // Short pages have no meaningful progress to report.
    const show = h > 400 && (isReading() || window.scrollY > 80);
    el.style.opacity = show ? '1' : '0';
    el.style.width = h > 0 ? `${Math.min(100, (window.scrollY / h) * 100)}%` : '0%';
  });
}

/** The control cluster shown on any long-form page. */
export function readerControls() {
  return `<div class="row readbar readbar-keep">
    <button class="btn sm" id="readToggle" title="Reading mode (F)">
      ${isReading() ? '📖 Exit reading' : '📖 Reading mode'}
    </button>
    <div class="pill" role="group" aria-label="Text size">
      <button id="readSmaller" title="Smaller text (−)" aria-label="Smaller text">A−</button>
      <button id="readBigger" title="Larger text (+)" aria-label="Larger text">A+</button>
    </div>
    <button class="btn sm ${state.settings.focus ? 'on' : ''}" id="focusToggle"
      title="Focus one block at a time (D)" aria-pressed="${state.settings.focus ? 'true' : 'false'}">
      ${state.settings.focus ? '🔦 Focus on' : '🔦 Focus'}
    </button>
    <button class="btn sm" id="fontToggle" title="Switch typeface">
      ${state.settings.readFont === 'sans' ? 'Aa Sans' : 'Aa Serif'}
    </button>
    <button class="btn sm" id="spaceToggle" title="Line spacing">
      ${state.settings.readSpacing === 'loose' ? '↕ Loose' : '↕ Normal'}
    </button>
  </div>`;
}

/** Wire the controls rendered by readerControls() inside `root`. */
export function bindReaderControls(root, rerender) {
  root.querySelector('#readToggle')?.addEventListener('click', () => {
    toggleReading();
    rerender?.();
  });
  root.querySelector('#readSmaller')?.addEventListener('click', () => nudgeScale(-1));
  root.querySelector('#readBigger')?.addEventListener('click', () => nudgeScale(1));
  root.querySelector('#focusToggle')?.addEventListener('click', () => { toggleFocus(); rerender?.(); });
  root.querySelector('#fontToggle')?.addEventListener('click', () => { cycleReadFont(); rerender?.(); });
  root.querySelector('#spaceToggle')?.addEventListener('click', () => { cycleSpacing(); rerender?.(); });
}

/**
 * Highlight the table-of-contents entry for whichever heading is currently in
 * view. Returns a cleanup function.
 */
export function spyHeadings(root) {
  const links = Array.from(root.querySelectorAll('.toc a[href^="#"]'));
  if (!links.length) return () => {};
  const targets = links
    .map((a) => ({ a, el: document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))) }))
    .filter((x) => x.el);
  if (!targets.length) return () => {};

  const onScroll = () => {
    const y = window.scrollY + 140;
    let current = targets[0];
    for (const t of targets) if (t.el.offsetTop <= y) current = t;
    for (const t of targets) t.a.classList.toggle('here', t === current);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  return () => removeEventListener('scroll', onScroll);
}
