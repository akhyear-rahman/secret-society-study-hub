import { getCourse, allCourses, filterQuestions, QUESTION_SORTS } from '../content.js';
import { esc, uniq, DIFFS, DIFF_LABEL, EXAM_TYPES, EXAM_LABEL, groupBy } from '../util.js';
import { pageHead, empty, questionCard, selectEl, bindAnswerLangToggles } from '../ui.js';
import { setQuery } from '../router.js';
import { state, setSetting } from '../store.js';

const GROUPINGS = [
  { value: 'topic',   label: 'Topic-wise' },
  { value: 'chapter', label: 'Chapter-wise' },
  { value: 'exam',    label: 'Exam-type-wise' },
  { value: 'batch',   label: 'Batch-wise' },
  { value: 'year',    label: 'Year-wise' },
  { value: 'difficulty', label: 'Difficulty-wise' },
  { value: 'flat',    label: 'Flat list' },
];

export default async function questions({ params, query }) {
  const scopedCourse = params.cid ? await getCourse(params.cid) : null;
  const courses = scopedCourse ? [scopedCourse] : await allCourses();
  const courseById = new Map(courses.map((c) => [c.id, c]));

  const pool = courses.flatMap((c) => c.questions);
  const f = {
    courseId: scopedCourse ? scopedCourse.id : (query.course || ''),
    chapterId: query.ch || '',
    examType: query.type || '',
    year: query.year || '',
    batch: query.batch || '',
    difficulty: query.diff || '',
    topic: query.topic || '',
    minMarks: query.marks || '',
    answeredOnly: query.answered === '1',
    text: query.s || '',
  };
  const grouping = query.g || 'topic';
  const sort = query.sort || 'year-desc';

  let list = filterQuestions(pool, f);
  list = list.slice().sort(QUESTION_SORTS[sort] || QUESTION_SORTS['year-desc']);

  /* --- option lists reflect the current course scope, not the whole pool --- */
  const scope = f.courseId ? pool.filter((q) => q.courseId === f.courseId) : pool;
  const chapters = f.courseId
    ? (courseById.get(f.courseId)?.chapters || []).map((ch) => ({ value: ch.id, label: `${ch.no ? ch.no + '. ' : ''}${ch.title}` }))
    : [];
  const years   = uniq(scope.map((q) => q.year).filter(Boolean)).sort((a, b) => b - a);
  const batches = uniq(scope.map((q) => q.batch).filter(Boolean)).sort();
  const topics  = uniq(scope.flatMap((q) => q.topics || [])).sort();

  const anyOpt = (label) => [{ value: '', label }];

  const filters = `<div class="filters">
    ${scopedCourse ? '' : selectEl('Course', 'course',
        anyOpt('All courses').concat(courses.map((c) => ({ value: c.id, label: c.code || c.title }))), f.courseId)}
    ${chapters.length ? selectEl('Chapter', 'ch', anyOpt('All chapters').concat(chapters), f.chapterId) : ''}
    ${selectEl('Exam', 'type', anyOpt('Any type').concat(EXAM_TYPES.map((t) => ({ value: t, label: EXAM_LABEL[t] }))), f.examType)}
    ${years.length ? selectEl('Year', 'year', anyOpt('Any year').concat(years.map(String)), f.year) : ''}
    ${batches.length ? selectEl('Batch', 'batch', anyOpt('Any batch').concat(batches), f.batch) : ''}
    ${selectEl('Level', 'diff', anyOpt('Any level').concat(DIFFS.map((d) => ({ value: d, label: DIFF_LABEL[d] }))), f.difficulty)}
    ${topics.length ? selectEl('Topic', 'topic', anyOpt('All topics').concat(topics), f.topic) : ''}
    ${selectEl('Marks ≥', 'marks', anyOpt('Any').concat(['5', '10', '15', '20']), f.minMarks)}
    ${selectEl('Group by', 'g', GROUPINGS, grouping)}
    ${selectEl('Sort', 'sort', [
      { value: 'year-desc', label: 'Newest first' },
      { value: 'year-asc', label: 'Oldest first' },
      { value: 'marks-desc', label: 'Highest marks' },
      { value: 'difficulty', label: 'Easiest first' },
      { value: 'frequency', label: 'Most repeated' },
    ], sort)}
    <span class="sel" style="flex:1;min-width:180px">
      <label for="qsearch">Find</label>
      <input id="qsearch" type="search" placeholder="Search question or answer…" value="${esc(f.text)}" style="flex:1;max-width:none">
    </span>
  </div>
  <div class="chipbar" style="margin-bottom:16px">
    <button class="chip${f.answeredOnly ? ' on' : ''}" id="answeredChip">✅ Only with model answers</button>
    <button class="chip${state.settings.showAnswers ? ' on' : ''}" id="expandChip">📖 Expand answers by default</button>
    <button class="chip" id="clearChip">✕ Clear filters</button>
    <span class="count">${list.length} of ${pool.length} questions</span>
  </div>`;

  const keyFor = {
    topic: (q) => (q.topics && q.topics[0]) || 'Uncategorised',
    chapter: (q) => courseById.get(q.courseId)?.chapterById.get(q.chapterId)?.title || 'Unassigned chapter',
    exam: (q) => EXAM_LABEL[q.examType] || 'Unspecified',
    batch: (q) => q.batch || 'Unspecified batch',
    year: (q) => String(q.year || 'Undated'),
    difficulty: (q) => DIFF_LABEL[q.difficulty] || 'Unrated',
  };

  let body;
  if (!list.length) {
    body = empty('No questions match', 'Loosen a filter, or add questions to the course JSON.');
  } else if (grouping === 'flat') {
    body = list.map((q) => card(q, courseById, scopedCourse)).join('');
  } else if (grouping === 'topic') {
    // A question can carry several topics, so it appears under each of them.
    const m = new Map();
    for (const q of list) {
      for (const t of (q.topics && q.topics.length ? q.topics : ['Uncategorised'])) {
        if (!m.has(t)) m.set(t, []);
        m.get(t).push(q);
      }
    }
    body = renderGroups(new Map([...m].sort((a, b) => b[1].length - a[1].length)), courseById, scopedCourse);
  } else {
    const m = groupBy(list, keyFor[grouping]);
    const sorted = grouping === 'year'
      ? new Map([...m].sort((a, b) => Number(b[0]) - Number(a[0])))
      : new Map([...m].sort((a, b) => b[1].length - a[1].length));
    body = renderGroups(sorted, courseById, scopedCourse);
  }

  const head = pageHead({
    crumbs: scopedCourse
      ? [{ label: 'Courses', href: '#/' }, { label: scopedCourse.code, href: `#/c/${scopedCourse.id}` }, { label: 'Question bank' }]
      : [{ label: 'Question bank' }],
    title: scopedCourse ? `${scopedCourse.code} — Question Bank` : 'Question Bank',
    sub: 'Every past-year question, sorted the way you need it, each with a model answer written for maximum marks.',
  });

  return {
    html: head + filters + body,
    mount(root) {
      const map = { course: 'course', ch: 'ch', type: 'type', year: 'year', batch: 'batch',
                    diff: 'diff', topic: 'topic', marks: 'marks', g: 'g', sort: 'sort' };
      for (const name of Object.keys(map)) {
        const el = root.querySelector(`#f-${name}`);
        el?.addEventListener('change', () => {
          const patch = { [name]: el.value };
          if (name === 'course') { patch.ch = ''; patch.topic = ''; }
          setQuery(patch);
        });
      }
      root.querySelector('#answeredChip')?.addEventListener('click', () =>
        setQuery({ answered: f.answeredOnly ? '' : '1' }));
      root.querySelector('#expandChip')?.addEventListener('click', () => {
        setSetting('showAnswers', !state.settings.showAnswers);
        setQuery({});
      });
      root.querySelector('#clearChip')?.addEventListener('click', () => {
        location.hash = scopedCourse ? `#/c/${scopedCourse.id}/questions` : '#/questions';
      });
      const s = root.querySelector('#qsearch');
      if (s) {
        let t;
        s.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => setQuery({ s: s.value }), 250); });
      }
      bindAnswerLangToggles(root);

      // Deep link: #/…?q=<question-id> opens and scrolls to that question.
      if (query.q) {
        const el = root.querySelector(`#q-${CSS.escape(query.q)}`);
        if (el) { el.open = true; setTimeout(() => el.scrollIntoView({ block: 'center' }), 60); }
      }
    },
  };
}

function card(q, courseById, scopedCourse) {
  const c = courseById.get(q.courseId);
  return questionCard(q, {
    chapterTitle: scopedCourse ? c?.chapterById.get(q.chapterId)?.title : `${c?.code || ''}`,
  });
}

function renderGroups(map, courseById, scopedCourse) {
  return [...map].map(([name, qs]) => `<section class="topic-block">
    <h2 id="g-${esc(String(name).replace(/\s+/g, '-').toLowerCase())}">${esc(name)}
      <span class="n">${qs.length}</span>
      <span class="n">${qs.reduce((n, q) => n + (q.marks || 0), 0)} marks total</span></h2>
    ${qs.map((q) => card(q, courseById, scopedCourse)).join('')}
  </section>`).join('');
}
