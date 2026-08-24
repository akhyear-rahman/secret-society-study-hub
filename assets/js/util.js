// Small DOM + formatting helpers. No dependencies.

export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Escape a string for safe insertion into HTML. */
export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Escape for use inside an HTML attribute value delimited by double quotes. */
export const attr = esc;

/** Tagged template that escapes every interpolated value. Arrays are joined. */
export function html(strings, ...vals) {
  return strings.reduce((out, s, i) => {
    if (i === 0) return s;
    const v = vals[i - 1];
    const t = Array.isArray(v) ? v.join('') : v;
    return out + (v && v.__raw ? v.value : esc(t)) + s;
  }, '');
}
/** Mark a string as pre-sanitised so `html` will not escape it. */
export const raw = (value) => ({ __raw: true, value: value == null ? '' : String(value) });

export const slug = (s) => String(s).toLowerCase().trim()
  .replace(/[^\wঀ-৿\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

export const uniq = (a) => Array.from(new Set(a));
export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
export const sum = (a) => a.reduce((x, y) => x + y, 0);

/** Group an array into a Map keyed by fn(item), preserving insertion order. */
export function groupBy(arr, fn) {
  const m = new Map();
  for (const it of arr) {
    const k = fn(it);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(it);
  }
  return m;
}

/** Deterministic pseudo-random generator so a seeded mock exam is reproducible. */
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
export function shuffle(arr, rand = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const DIFFS = ['beginner', 'intermediate', 'advanced'];
export const DIFF_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
export const EXAM_TYPES = ['incourse', 'midterm', 'final', 'tutorial', 'viva', 'assignment'];
export const EXAM_LABEL = {
  incourse: 'In-course', midterm: 'Midterm', final: 'Final',
  tutorial: 'Tutorial', viva: 'Viva', assignment: 'Assignment',
};

export const stars = (n) => '★'.repeat(clamp(n | 0, 0, 5)) + '☆'.repeat(5 - clamp(n | 0, 0, 5));

export function fmtTime(sec) {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  const pad = (x) => String(x).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export const todayKey = () => new Date().toISOString().slice(0, 10);
export function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

let toastTimer;
export function toast(msg, ms = 2200) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, ms);
}

/** Case/diacritic-loose substring match that also works for Bangla. */
export function matches(haystack, needle) {
  if (!needle) return true;
  return String(haystack).toLowerCase().includes(needle.toLowerCase());
}

/** Wrap the first occurrence of `q` in <mark>. Input must already be escaped. */
export function highlight(escaped, q) {
  if (!q) return escaped;
  const i = escaped.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return escaped;
  return escaped.slice(0, i) + '<mark>' + escaped.slice(i, i + q.length) + '</mark>' + escaped.slice(i + q.length);
}

export function debounce(fn, ms = 160) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
