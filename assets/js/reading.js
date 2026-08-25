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
  document.body.dataset.reading = state.settings.reading ? '1' : '0';
  document.documentElement.style.setProperty('--read-scale', String(state.settings.readScale || 1));
  updateProgress();
}

export function setReading(on) {
  setSetting('reading', !!on);
  applyReading();
  if (!on) window.scrollBy({ top: 0 });
}

export function toggleReading() { setReading(!state.settings.reading); }

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
