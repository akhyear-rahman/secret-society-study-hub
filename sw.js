// Offline support.
//
//   App shell   stale-while-revalidate — paints instantly from cache, then
//               refreshes the cache in the background, so an edit to a JS or
//               CSS file appears on the next load without bumping a version.
//   Content     network-first — a JSON edit shows up on the very next reload
//               when online, and still works from cache when offline.

const CACHE = 'sem7hub-v5';

const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'assets/css/app.css',
  'assets/icons/icon.svg',
  'assets/js/main.js',
  'assets/js/router.js',
  'assets/js/store.js',
  'assets/js/content.js',
  'assets/js/markdown.js',
  'assets/js/math.js',
  'assets/js/util.js',
  'assets/js/priority.js',
  'assets/js/reading.js',
  'assets/js/motion.js',
  'assets/js/ui.js',
  'assets/js/views/home.js',
  'assets/js/views/plan.js',
  'assets/js/views/path.js',
  'assets/js/views/course.js',
  'assets/js/views/theory.js',
  'assets/js/views/questions.js',
  'assets/js/views/recall.js',
  'assets/js/views/exam.js',
  'assets/js/views/notes.js',
  'assets/js/views/textbooks.js',
  'assets/js/views/progress.js',
  'assets/js/views/help.js',
  'assets/js/views/about.js',
];

/* KaTeX, vendored so formulas render with the network off. Listed after the
   shell because it is only needed on pages that actually contain maths. */
const MATH = [
  'vendor/katex/katex.min.css',
  'vendor/katex/katex.min.js',
  'vendor/katex/fonts/KaTeX_AMS-Regular.woff2',
  'vendor/katex/fonts/KaTeX_Caligraphic-Bold.woff2',
  'vendor/katex/fonts/KaTeX_Caligraphic-Regular.woff2',
  'vendor/katex/fonts/KaTeX_Fraktur-Bold.woff2',
  'vendor/katex/fonts/KaTeX_Fraktur-Regular.woff2',
  'vendor/katex/fonts/KaTeX_Main-Bold.woff2',
  'vendor/katex/fonts/KaTeX_Main-BoldItalic.woff2',
  'vendor/katex/fonts/KaTeX_Main-Italic.woff2',
  'vendor/katex/fonts/KaTeX_Main-Regular.woff2',
  'vendor/katex/fonts/KaTeX_Math-BoldItalic.woff2',
  'vendor/katex/fonts/KaTeX_Math-Italic.woff2',
  'vendor/katex/fonts/KaTeX_SansSerif-Bold.woff2',
  'vendor/katex/fonts/KaTeX_SansSerif-Italic.woff2',
  'vendor/katex/fonts/KaTeX_SansSerif-Regular.woff2',
  'vendor/katex/fonts/KaTeX_Script-Regular.woff2',
  'vendor/katex/fonts/KaTeX_Size1-Regular.woff2',
  'vendor/katex/fonts/KaTeX_Size2-Regular.woff2',
  'vendor/katex/fonts/KaTeX_Size3-Regular.woff2',
  'vendor/katex/fonts/KaTeX_Size4-Regular.woff2',
  'vendor/katex/fonts/KaTeX_Typewriter-Regular.woff2',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled([...SHELL, ...MATH].map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// While developing against a local server, stay out of the way entirely —
// otherwise an edited JS or CSS file is served from cache on the reload right
// after you save it, which looks exactly like a bug in your own code.
const DEV = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

self.addEventListener('fetch', (e) => {
  if (DEV) return;
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  const isContent = url.pathname.includes('/content/') || url.pathname.endsWith('.md');

  if (isContent) {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request))
    );
  } else {
    e.respondWith(
      caches.match(request).then((hit) => {
        const fresh = fetch(request)
          .then((res) => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(request, copy));
            }
            return res;
          })
          .catch(() => hit);
        // Serve the cached copy at once when there is one; the network copy
        // lands in the cache for the next load.
        return hit || fresh;
      })
    );
  }
});
