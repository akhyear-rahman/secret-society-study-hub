// Hash router. Hash routing (not history API) is deliberate: it makes the app
// work on GitHub Pages under any sub-path, and from the file system, with no
// server rewrite rules.

const routes = [];

/** @param {string} pattern e.g. "/c/:cid/theory/:tid" */
export function route(pattern, handler) {
  const keys = [];
  const rx = new RegExp('^' + pattern.replace(/:[A-Za-z0-9_]+/g, (m) => {
    keys.push(m.slice(1));
    return '([^/?]+)';
  }) + '/?$');
  routes.push({ rx, keys, handler });
}

export function parseHash(hash = location.hash) {
  const h = hash.replace(/^#/, '') || '/';
  const [pathRaw, queryRaw = ''] = h.split('?');
  const path = pathRaw.startsWith('/') ? pathRaw : '/' + pathRaw;
  const query = Object.fromEntries(new URLSearchParams(queryRaw));
  return { path, query, raw: h };
}

let notFound = () => '<div class="empty"><h3>Page not found</h3></div>';
export const setNotFound = (fn) => { notFound = fn; };

let current = null;
export const currentRoute = () => current;

let beforeEach = null;
export const onNavigate = (fn) => { beforeEach = fn; };

export async function resolve() {
  const { path, query, raw } = parseHash();
  current = { path, query, raw };
  for (const r of routes) {
    const m = path.match(r.rx);
    if (!m) continue;
    const params = {};
    r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
    current.params = params;
    if (beforeEach) beforeEach(current);
    return r.handler({ params, query, path });
  }
  if (beforeEach) beforeEach(current);
  return notFound({ path });
}

export function go(hash, { replace = false } = {}) {
  const target = hash.startsWith('#') ? hash : '#' + hash;
  if (location.hash === target) { resolve(); return; }
  if (replace) location.replace(target); else location.hash = target;
}

/** Update the query string of the current route without adding a history entry. */
export function setQuery(patch, { replace = true } = {}) {
  const { path, query } = parseHash();
  const next = { ...query, ...patch };
  for (const k of Object.keys(next)) if (next[k] === '' || next[k] == null) delete next[k];
  const qs = new URLSearchParams(next).toString();
  go(path + (qs ? '?' + qs : ''), { replace });
}

export function start() {
  addEventListener('hashchange', () => resolve());
  return resolve();
}
