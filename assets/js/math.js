// LaTeX rendering, lazily and locally.
//
// KaTeX is vendored under vendor/katex — no CDN, so the app still renders
// mathematics with the network off, which is the whole point of this project.
// It is ~600 KB including fonts, so it is loaded only once a page actually
// contains a formula, and never on the dashboard or the plan.
//
// markdown.js does NOT call KaTeX. It emits
//
//   <span class="math" data-tex="…">…raw TeX…</span>
//
// and this module upgrades those nodes in place afterwards. Two reasons:
// md() stays synchronous, and if the script ever fails to load the reader is
// left looking at readable TeX source rather than a blank space.

let loading = null;

/** Load KaTeX once. Resolves to the katex global, or null if unavailable. */
export function loadKatex() {
  if (window.katex) return Promise.resolve(window.katex);
  if (loading) return loading;

  loading = new Promise((resolve) => {
    const base = new URL('../../vendor/katex/', import.meta.url);

    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = new URL('katex.min.css', base).href;
    document.head.appendChild(css);

    const js = document.createElement('script');
    js.src = new URL('katex.min.js', base).href;
    js.onload = () => resolve(window.katex || null);
    js.onerror = () => { console.warn('[math] KaTeX failed to load; showing raw TeX'); resolve(null); };
    document.head.appendChild(js);
  });
  return loading;
}

/**
 * Replace every `.math` placeholder inside `root` with rendered output.
 * Safe to call repeatedly — nodes already rendered are skipped.
 */
export async function hydrateMath(target = document) {
  // `target` may be a root to search, or an explicit list of nodes. The list
  // form matters: wireMath renders only what is on screen, and passing a root
  // here would sweep up the collapsed cards it is deliberately deferring.
  const nodes = Array.isArray(target)
    ? target.filter((n) => !n.hasAttribute('data-rendered'))
    : Array.from(target.querySelectorAll('.math:not([data-rendered])'));
  if (!nodes.length) return;

  const katex = await loadKatex();
  if (!katex) {
    // Leave the TeX visible, but mark it so we do not retry on every render.
    for (const n of nodes) n.setAttribute('data-rendered', 'failed');
    return;
  }

  for (const n of nodes) {
    const tex = n.getAttribute('data-tex') || '';
    const display = n.getAttribute('data-display') === '1';
    try {
      katex.render(tex, n, {
        displayMode: display,
        throwOnError: false,
        strict: false,
        trust: false,               // no \href, no \includegraphics
        macros: {
          // Shorthands used across the answer bank.
          '\\R': '\\mathbb{R}',
          '\\then': '\\;\\Longrightarrow\\;',
          '\\st': '\\quad\\text{s.t.}\\quad',
        },
      });
      n.setAttribute('data-rendered', '1');
    } catch (err) {
      // KaTeX with throwOnError:false rarely throws, but never let one bad
      // formula blank an entire answer.
      n.setAttribute('data-rendered', 'failed');
      n.textContent = tex;
    }
  }
}

/**
 * Hydrate the math a reader can actually see, and defer the rest.
 *
 * A question bank page holds every answer in the DOM at once inside collapsed
 * <details>, which can be thousands of formulas — rendering them all on
 * navigation would stall the page for seconds. So: render what is open now,
 * and render the inside of a card the first time it is opened. Unrendered
 * math still reads as its TeX source, so a card that somehow never fires
 * degrades to something legible rather than to a blank.
 */
export function wireMath(root = document) {
  const all = Array.from(root.querySelectorAll('.math:not([data-rendered])'));
  if (!all.length) return;

  const closed = (n) => {
    for (let el = n.parentElement; el; el = el.parentElement) {
      // A <summary> is on screen whether or not its <details> is open, so
      // maths in a card's header must render now. Without this the question
      // bank shows every collapsed question's title as raw TeX.
      if (el.tagName === 'SUMMARY') return null;
      if (el.tagName === 'DETAILS' && !el.open) return el;
    }
    return null;
  };

  const deferred = new Map();          // details -> true
  const visible = [];
  for (const n of all) {
    const host = closed(n);
    if (host) deferred.set(host, true); else visible.push(n);
  }

  // Render the visible nodes only — not the root, or the deferral below is
  // pointless the moment a single formula happens to be on screen.
  if (visible.length) hydrateMath(visible);

  for (const host of deferred.keys()) {
    if (host.dataset.mathWired) continue;
    host.dataset.mathWired = '1';
    host.addEventListener('toggle', function once() {
      if (!host.open) return;
      host.removeEventListener('toggle', once);
      hydrateMath(host);
    });
  }
}

/** True if a markdown source contains anything worth loading KaTeX for. */
export const hasMath = (src) => /\$\$|(?:^|[^\\$])\$[^$\n]+\$/.test(String(src || ''));
