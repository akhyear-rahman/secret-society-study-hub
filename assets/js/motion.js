// Motion helpers applied after every view mounts.
//
// Two effects, both opt-in by markup so views stay declarative:
//   [data-count]  — a number that counts up to its final value
//   .reveal       — a block that rises in when it scrolls into view
//
// Everything here no-ops under prefers-reduced-motion.

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------ splash ---- */

/**
 * Show the welcome seal, then hand over to the app.
 * Resolves as soon as the overlay starts dismissing, so boot is not blocked.
 */
export function runSplash({ minMs = 1500 } = {}) {
  const el = document.getElementById('splash');
  if (!el) return Promise.resolve();

  // The reduced-motion path still shows the mark, just briefly and still.
  const hold = REDUCED ? 500 : minMs;
  const started = performance.now();

  return new Promise((resolve) => {
    let done = false;
    const dismiss = () => {
      if (done) return;
      done = true;
      el.classList.add('out');
      removeEventListener('keydown', onKey);
      el.removeEventListener('click', dismiss);
      setTimeout(() => { el.remove(); }, REDUCED ? 0 : 560);
      resolve();
    };
    const onKey = () => dismiss();

    // Skippable — nobody should sit through a splash twice.
    addEventListener('keydown', onKey, { once: true });
    el.addEventListener('click', dismiss);

    const wait = Math.max(0, hold - (performance.now() - started));
    setTimeout(dismiss, wait);
  });
}

/* -------------------------------------------------------- count-up ---- */

function countUp(el) {
  const target = Number(el.dataset.count);
  if (!Number.isFinite(target)) return;
  const suffix = el.dataset.suffix || '';
  if (REDUCED || target === 0) { el.textContent = target + suffix; return; }

  const dur = clampDur(target);
  const start = performance.now();
  // Zeroing happens on the first frame, not before it — so a page that never
  // animates still shows the right number.
  const tick = (now) => {
    const t = Math.min(1, (now - start) / dur);
    // ease-out cubic — fast then settling, which reads as deliberate
    const v = Math.round(target * (1 - Math.pow(1 - t, 3)));
    el.textContent = v + suffix;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
const clampDur = (n) => Math.min(1100, Math.max(380, 260 + Math.log10(Math.abs(n) + 1) * 320));

/* --------------------------------------------------- scroll reveal ---- */

let observer = null;

/**
 * Add `.in` to each element as it scrolls into view.
 *
 * Elements start at opacity 0, so a missed observer would hide content
 * permanently. Three guards against that: anything already on screen is
 * revealed synchronously, the whole set is force-revealed if the observer has
 * not reported within two seconds, and reduced-motion skips straight to the
 * end. An animation is never allowed to become a blank page.
 */
export function observeIn(targets, { rootMargin = '0px 0px -6% 0px', threshold = 0.04 } = {}) {
  const list = Array.from(targets).filter((el) => !el.classList.contains('in'));
  if (!list.length) return () => {};

  const showAll = () => list.forEach((el) => el.classList.add('in'));
  if (REDUCED || !('IntersectionObserver' in window)) { showAll(); return () => {}; }

  // Whatever is already visible should not wait for a scroll that may never come.
  const vh = window.innerHeight || 800;
  for (const el of list) {
    const r = el.getBoundingClientRect();
    if (r.top < vh && r.bottom > 0) el.classList.add('in');
  }

  const io = new IntersectionObserver((entries, obs) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      obs.unobserve(e.target);
    }
  }, { rootMargin, threshold });
  list.forEach((el) => io.observe(el));

  const failsafe = setTimeout(showAll, 2000);
  return () => { clearTimeout(failsafe); io.disconnect(); };
}

function reveal(root) {
  observer?.();
  observer = observeIn(root.querySelectorAll('.reveal'));
}

/** Run every enhancement over a freshly rendered view. */
export function enhance(root) {
  root.querySelectorAll('[data-count]').forEach(countUp);
  reveal(root);
}

/* --------------------------------------------------- view transition ---- */

/** Fade the outgoing view out. Resolves when it is safe to replace. */
export function viewOut(el) {
  if (REDUCED) return Promise.resolve();
  el.classList.add('leaving');
  return new Promise((r) => setTimeout(r, 110));
}
export function viewIn(el) { el.classList.remove('leaving'); }
