import { getCourse, allCourses } from '../content.js';
import { esc, shuffle, DIFFS, DIFF_LABEL, clamp } from '../util.js';
import { md } from '../markdown.js';
import { hydrateMath } from '../math.js';
import { pageHead, empty, selectEl, diffTag } from '../ui.js';
import { state, reviewCard, cardDue, cardMastery, award } from '../store.js';
import { setQuery } from '../router.js';

const GRADES = [
  { g: 0, cls: 'g0', label: 'Again', hint: 'blank' },
  { g: 1, cls: 'g1', label: 'Hard', hint: 'shaky' },
  { g: 2, cls: 'g2', label: 'Good', hint: 'got it' },
  { g: 3, cls: 'g3', label: 'Easy', hint: 'instant' },
];

export default async function recall({ params, query }) {
  const scoped = params.cid ? await getCourse(params.cid) : null;
  const courses = scoped ? [scoped] : await allCourses();

  let cards = courses.flatMap((c) => c.cards);
  const courseFilter = scoped ? scoped.id : (query.course || '');
  if (courseFilter) cards = cards.filter((c) => c.courseId === courseFilter);
  if (query.ch) cards = cards.filter((c) => c.chapterId === query.ch);
  if (query.theory) cards = cards.filter((c) => c.theoryId === query.theory);
  if (query.diff) cards = cards.filter((c) => c.difficulty === query.diff);

  const mode = query.mode || 'due';
  let deck = cards;
  if (mode === 'due') deck = cards.filter((c) => cardDue(c.id));
  if (mode === 'weak') deck = cards.slice().sort((a, b) => cardMastery(a.id) - cardMastery(b.id)).slice(0, 40);
  if (mode === 'new') deck = cards.filter((c) => !state.srs[c.id]);
  deck = shuffle(deck).slice(0, Number(query.limit || 30));

  const scopedChapters = courseFilter
    ? (courses.find((c) => c.id === courseFilter)?.chapters || []) : [];

  const head = pageHead({
    crumbs: scoped
      ? [{ label: 'Courses', href: '#/' }, { label: scoped.code, href: `#/c/${scoped.id}` }, { label: 'Active recall' }]
      : [{ label: 'Active recall' }],
    title: 'Active Recall',
    sub: 'Retrieval practice with spaced repetition — the single highest-yield way to make a theory stick.',
  });

  const filters = `<div class="filters">
    ${scoped ? '' : selectEl('Course', 'course',
      [{ value: '', label: 'All courses' }].concat(courses.map((c) => ({ value: c.id, label: c.code || c.title }))), courseFilter)}
    ${scopedChapters.length ? selectEl('Chapter', 'ch',
      [{ value: '', label: 'All chapters' }].concat(scopedChapters.map((ch) => ({ value: ch.id, label: ch.title }))), query.ch || '') : ''}
    ${selectEl('Level', 'diff',
      [{ value: '', label: 'Any level' }].concat(DIFFS.map((d) => ({ value: d, label: DIFF_LABEL[d] }))), query.diff || '')}
    ${selectEl('Mode', 'mode', [
      { value: 'due', label: 'Due today' },
      { value: 'new', label: 'Unseen only' },
      { value: 'weak', label: 'Weakest first' },
      { value: 'all', label: 'Everything' },
    ], mode)}
    ${selectEl('Session size', 'limit', ['10', '20', '30', '50', '100'], String(query.limit || 30))}
    <span class="count">${deck.length} card${deck.length === 1 ? '' : 's'} queued · ${cards.length} in scope</span>
  </div>`;

  if (!deck.length) {
    const msg = mode === 'due' && cards.length
      ? empty('Nothing due right now 🎉',
          'Every card in this scope is scheduled for a later day. Switch the mode to <b>Weakest first</b> or <b>Everything</b> to drill anyway.')
      : empty('No cards in this scope',
          'Recall cards come from two places: a theory\'s <code>recall</code> array, and every question that has a model answer.');
    return { html: head + filters + msg, mount: (root) => bindFilters(root, scoped) };
  }

  const html = head + filters + `
    <div class="deck">
      <div class="deck-progress">
        <span id="deckPos">1 / ${deck.length}</span>
        <div class="bar"><span id="deckBar" style="width:0%"></span></div>
        <span id="deckScore">0 correct</span>
      </div>
      <div class="flash" id="flash"></div>
      <div id="controls"></div>
      <p class="muted center" style="font-size:12px;margin-top:14px">
        <kbd>space</kbd> reveal · <kbd>1</kbd>–<kbd>4</kbd> grade · <kbd>s</kbd> skip
      </p>
    </div>`;

  return {
    html,
    mount(root) {
      bindFilters(root, scoped);
      let i = 0, correct = 0, revealed = false;
      const flash = root.querySelector('#flash');
      const controls = root.querySelector('#controls');
      const pos = root.querySelector('#deckPos');
      const bar = root.querySelector('#deckBar');
      const score = root.querySelector('#deckScore');

      function render() {
        if (i >= deck.length) return finish();
        const c = deck[i];
        pos.textContent = `${i + 1} / ${deck.length}`;
        bar.style.width = `${(i / deck.length) * 100}%`;
        score.textContent = `${correct} recalled`;
        const mast = Math.round(cardMastery(c.id) * 100);
        flash.innerHTML = `
          <div class="row" style="justify-content:center;margin-bottom:14px">
            ${diffTag(c.difficulty)}
            <span class="tag">${esc(c.source || '')}</span>
            <span class="tag">${mast}% mastered</span>
          </div>
          <div class="q prose">${md(c.q)}</div>
          ${revealed ? `<div class="a prose">${md(c.a)}</div>` : ''}`;
        controls.innerHTML = revealed
          ? `<div class="grade">${GRADES.map((g) =>
              `<button class="${g.cls}" data-g="${g.g}">${g.label}<br><small class="muted">${g.hint}</small></button>`).join('')}</div>`
          : `<button class="btn primary wide" id="reveal" style="margin-top:16px">Show answer</button>
             <button class="btn ghost wide" id="skip" style="margin-top:8px">Skip</button>`;
        // The card is rewritten on every reveal and every advance, long after
        // the route rendered — so enhance() has already run and will not run
        // again. Hydrate here or a maths card shows its raw TeX source.
        hydrateMath(flash);
        wire();
      }

      function wire() {
        controls.querySelector('#reveal')?.addEventListener('click', () => { revealed = true; render(); });
        controls.querySelector('#skip')?.addEventListener('click', () => { i++; revealed = false; render(); });
        controls.querySelectorAll('[data-g]').forEach((b) => b.addEventListener('click', () => {
          const g = Number(b.dataset.g);
          reviewCard(deck[i].id, g);
          if (g >= 2) correct++;
          i++; revealed = false; render();
        }));
      }

      function finish() {
        bar.style.width = '100%';
        const pct = Math.round((correct / deck.length) * 100);
        flash.innerHTML = `<div style="text-align:center">
          <div style="font-size:44px">${pct >= 80 ? '🏆' : pct >= 50 ? '💪' : '📚'}</div>
          <h2 style="margin:8px 0">Session complete</h2>
          <p class="sub">You recalled <b>${correct}</b> of <b>${deck.length}</b> cards (${pct}%).</p>
          <p class="muted" style="font-size:13px">Cards you graded <b>Again</b> or <b>Hard</b> come back sooner.</p>
        </div>`;
        controls.innerHTML = `<div class="row" style="justify-content:center;margin-top:16px">
          <button class="btn primary" id="again">Another session</button>
          <a class="btn" href="#/progress">See progress</a>
        </div>`;
        controls.querySelector('#again').addEventListener('click', () => location.reload());
        if (pct === 100 && deck.length >= 10) award('topic-master');
      }

      const onKey = (e) => {
        if (e.target.matches('input,textarea,select')) return;
        if (e.code === 'Space') { e.preventDefault(); if (!revealed) { revealed = true; render(); } }
        else if (e.key === 's') { i++; revealed = false; render(); }
        else if (revealed && ['1', '2', '3', '4'].includes(e.key)) {
          controls.querySelector(`[data-g="${Number(e.key) - 1}"]`)?.click();
        }
      };
      addEventListener('keydown', onKey);
      render();
      return () => removeEventListener('keydown', onKey);
    },
  };
}

function bindFilters(root, scoped) {
  ['course', 'ch', 'diff', 'mode', 'limit'].forEach((name) => {
    const el = root.querySelector(`#f-${name}`);
    el?.addEventListener('change', () => {
      const patch = { [name]: el.value };
      if (name === 'course') patch.ch = '';
      setQuery(patch);
    });
  });
}
