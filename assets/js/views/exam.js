// Mock exam: generates a model question paper from the past-year bank,
// following the course's real exam pattern, then runs it as a timed,
// gamified test with self-marking against the model answers.

import { getCourse, allCourses } from '../content.js';
import { esc, shuffle, rng, fmtTime, sum, clamp, DIFFS, DIFF_LABEL, EXAM_TYPES, EXAM_LABEL } from '../util.js';
import { md } from '../markdown.js';
import { pageHead, empty, selectEl, diffTag, marksTag } from '../ui.js';
import { state, recordExam } from '../store.js';
import { setQuery, go } from '../router.js';

const DRAFT_KEY = 'sem7hub:exam-draft';

export default async function exam({ params, query }) {
  const scoped = params.cid ? await getCourse(params.cid) : null;
  const courses = scoped ? [scoped] : await allCourses();
  const courseId = scoped ? scoped.id : (query.course || courses.find((c) => c.questions.length)?.id || courses[0]?.id);
  const course = courses.find((c) => c.id === courseId) || courses[0];

  const head = pageHead({
    crumbs: scoped
      ? [{ label: 'Courses', href: '#/' }, { label: scoped.code, href: `#/c/${scoped.id}` }, { label: 'Mock exam' }]
      : [{ label: 'Mock exam' }],
    title: 'Mock Exam',
    sub: 'A fresh question paper every time — built from real past-year questions, following the real pattern.',
  });

  if (!course || !course.questions.length) {
    return head + empty('No questions to build a paper from',
      'Add past-year questions to a course JSON first, then come back.');
  }

  return query.run === '1' ? runner(course, query, head) : setup(course, courses, scoped, query, head);
}

/* ------------------------------------------------------------- setup ---- */

function buildPaper(course, opts) {
  const rand = rng(opts.seed);
  const pool = course.questions.filter((q) => {
    if (opts.examType && q.examType !== opts.examType) return false;
    if (opts.chapter && q.chapterId !== opts.chapter) return false;
    if (opts.difficulty && q.difficulty !== opts.difficulty) return false;
    return true;
  });
  if (!pool.length) return [];

  // Weight by how often a question has recurred and by its marks — the
  // pattern of a real paper, not a uniform sample.
  const weighted = pool.map((q) => ({
    q, w: 1 + (q.repeats?.length || 0) * 1.5 + (q.marks || 5) / 10 + rand(),
  })).sort((a, b) => b.w - a.w);

  const pattern = course.examPattern?.sections;
  if (pattern && !opts.ignorePattern) {
    const used = new Set();
    const paper = [];
    for (const sec of pattern) {
      const want = Number(sec.outOf || sec.answer || 0);
      const bucket = weighted.filter(({ q }) =>
        !used.has(q.id) && (!sec.marks || Math.abs((q.marks || 0) - sec.marks) <= 3));
      const chosen = (bucket.length >= want ? bucket : weighted.filter(({ q }) => !used.has(q.id)))
        .slice(0, want);
      for (const { q } of chosen) { used.add(q.id); paper.push({ ...q, section: sec.name, secMarks: sec.marks }); }
    }
    if (paper.length) return paper;
  }

  const n = clamp(Number(opts.count || 6), 1, pool.length);
  return shuffle(weighted.slice(0, Math.min(pool.length, n * 2)), rand).slice(0, n).map(({ q }) => q);
}

function setup(course, courses, scoped, query, head) {
  const seed = Number(query.seed) || Date.now() % 100000;
  const opts = {
    seed,
    examType: query.type || '',
    chapter: query.ch || '',
    difficulty: query.diff || '',
    count: query.count || 6,
    ignorePattern: query.pat === '0',
  };
  const paper = buildPaper(course, opts);
  const totalMarks = sum(paper.map((q) => q.marks || 0));
  const suggested = course.examPattern?.durationMin || Math.max(30, Math.round(totalMarks * 2.5));
  const duration = Number(query.mins) || suggested;

  const controls = `<div class="filters">
    ${scoped ? '' : selectEl('Course', 'course', courses.map((c) => ({ value: c.id, label: c.code || c.title })), course.id)}
    ${selectEl('Pattern', 'type',
      [{ value: '', label: 'Mixed' }].concat(EXAM_TYPES.map((t) => ({ value: t, label: EXAM_LABEL[t] }))), opts.examType)}
    ${course.chapters.length ? selectEl('Chapter', 'ch',
      [{ value: '', label: 'All chapters' }].concat(course.chapters.map((ch) => ({ value: ch.id, label: ch.title }))), opts.chapter) : ''}
    ${selectEl('Level', 'diff',
      [{ value: '', label: 'Mixed levels' }].concat(DIFFS.map((d) => ({ value: d, label: DIFF_LABEL[d] }))), opts.difficulty)}
    ${selectEl('Questions', 'count', ['3', '4', '5', '6', '8', '10'], String(opts.count))}
    ${selectEl('Minutes', 'mins', ['20', '30', '45', '60', '90', '120', '180'], String(duration))}
    <button class="btn sm" id="reroll">🎲 Reshuffle paper</button>
  </div>`;

  if (!paper.length) {
    return { html: head + controls + empty('No questions match this pattern', 'Loosen a filter above.'),
             mount: (root) => bindSetup(root, scoped) };
  }

  const bySection = new Map();
  for (const q of paper) {
    const k = q.section || 'Answer all questions';
    if (!bySection.has(k)) bySection.set(k, []);
    bySection.get(k).push(q);
  }

  const preview = [...bySection].map(([name, qs]) => `<section style="margin-bottom:20px">
    <h3 style="margin:0 0 8px">${esc(name)}</h3>
    <ol style="padding-left:22px;margin:0">
      ${qs.map((q) => `<li style="margin-bottom:8px">
        ${esc(q.text)}
        <div class="row" style="gap:6px;margin-top:4px">${marksTag(q.marks)}${diffTag(q.difficulty)}
          ${q.year ? `<span class="tag">seen ${esc(q.year)}</span>` : ''}
          ${q.repeats?.length ? `<span class="tag accent">↻ ×${q.repeats.length + 1}</span>` : ''}</div>
      </li>`).join('')}
    </ol></section>`).join('');

  const html = head + controls + `
    <div class="card" style="margin-bottom:18px">
      <div class="spread">
        <div>
          <h2 style="margin:0">${esc(course.code)} — Model Question Paper</h2>
          <p class="sub">${paper.length} questions · ${totalMarks} marks · ${duration} minutes · paper #${seed}</p>
        </div>
        <button class="btn primary" id="startBtn">▶ Start the exam</button>
      </div>
    </div>
    <div class="card">${preview}</div>
    ${state.exams.length ? `<h2>Past attempts</h2>${historyTable()}` : ''}`;

  return {
    html,
    mount(root) {
      bindSetup(root, scoped);
      root.querySelector('#reroll')?.addEventListener('click', () => setQuery({ seed: String(Date.now() % 100000) }));
      root.querySelector('#startBtn')?.addEventListener('click', () => {
        localStorage.removeItem(DRAFT_KEY);
        setQuery({ run: '1', seed: String(seed), mins: String(duration) }, { replace: false });
      });
    },
  };
}

function bindSetup(root, scoped) {
  ['course', 'type', 'ch', 'diff', 'count', 'mins'].forEach((name) => {
    const el = root.querySelector(`#f-${name}`);
    el?.addEventListener('change', () => {
      const patch = { [name]: el.value };
      if (name === 'course') { patch.ch = ''; }
      setQuery(patch);
    });
  });
}

function historyTable() {
  return `<div class="card pad0"><table style="width:100%;border-collapse:collapse;font-size:13.5px">
    <thead><tr>
      ${['Date', 'Course', 'Score', '%', 'Time'].map((h) =>
        `<th style="text-align:left;padding:9px 12px;border-bottom:1px solid var(--line)">${h}</th>`).join('')}
    </tr></thead><tbody>
    ${state.exams.slice(0, 10).map((e) => {
      const pct = e.total ? Math.round((e.score / e.total) * 100) : 0;
      return `<tr>
        <td style="padding:9px 12px">${new Date(e.date).toLocaleDateString()}</td>
        <td style="padding:9px 12px">${esc(e.courseId)}</td>
        <td style="padding:9px 12px">${e.score}/${e.total}</td>
        <td style="padding:9px 12px"><span class="tag ${pct >= 80 ? 'beginner' : pct >= 50 ? 'intermediate' : 'advanced'}">${pct}%</span></td>
        <td style="padding:9px 12px">${fmtTime(e.seconds)}</td></tr>`;
    }).join('')}
    </tbody></table></div>`;
}

/* ------------------------------------------------------------ runner ---- */

function runner(course, query, head) {
  const seed = Number(query.seed) || 1;
  const paper = buildPaper(course, {
    seed, examType: query.type || '', chapter: query.ch || '',
    difficulty: query.diff || '', count: query.count || 6, ignorePattern: query.pat === '0',
  });
  const totalMarks = sum(paper.map((q) => q.marks || 0));
  const minutes = Number(query.mins) || 60;

  if (!paper.length) return head + empty('Could not rebuild that paper', 'Go back and generate a new one.');

  const html = `
    <div class="exam-head">
      <div class="spread">
        <div>
          <strong>${esc(course.code)} — Mock Exam</strong>
          <div class="muted" style="font-size:12.5px">${paper.length} questions · ${totalMarks} marks · paper #${seed}</div>
        </div>
        <div class="row">
          <span class="timer" id="timer">${fmtTime(minutes * 60)}</span>
          <button class="btn" id="pauseBtn">⏸ Pause</button>
          <button class="btn primary" id="submitBtn">Submit &amp; self-mark</button>
        </div>
      </div>
      <div class="qnav" id="qnav" style="margin-top:10px"></div>
    </div>
    <div id="examBody"></div>`;

  return {
    html,
    mount(root) {
      const answers = loadDraft(seed, paper.length);
      let cur = 0, left = minutes * 60, paused = false, finished = false;
      const body = root.querySelector('#examBody');
      const nav = root.querySelector('#qnav');
      const timerEl = root.querySelector('#timer');

      function renderNav() {
        // Both classes can apply: .cur is defined after .done in the
        // stylesheet, so the current question still reads as current.
        nav.innerHTML = paper.map((q, i) =>
          `<button data-i="${i}" class="${answers[i]?.trim() ? 'done ' : ''}${i === cur ? 'cur' : ''}">${i + 1}</button>`).join('');
        nav.querySelectorAll('[data-i]').forEach((b) =>
          b.addEventListener('click', () => { cur = Number(b.dataset.i); renderQ(); }));
      }

      function renderQ() {
        const q = paper[cur];
        body.innerHTML = `<div class="exam-q">
          <div class="row" style="margin-bottom:10px">
            <span class="tag accent">Question ${cur + 1} of ${paper.length}</span>
            ${q.section ? `<span class="tag">${esc(q.section)}</span>` : ''}
            ${marksTag(q.marks)}${diffTag(q.difficulty)}
            ${q.year ? `<span class="tag">originally ${esc(q.year)}</span>` : ''}
          </div>
          <p style="font-size:16.5px;font-weight:620;line-height:1.6;margin:0 0 14px">${esc(q.text)}</p>
          <textarea id="ans" placeholder="Write your answer — outline first, then expand. Aim for ${q.marks || 10} marks' worth of substance.">${esc(answers[cur] || '')}</textarea>
          <div class="spread" style="margin-top:12px">
            <span class="muted" style="font-size:12.5px" id="wc"></span>
            <div class="row">
              <button class="btn" id="prevQ"${cur === 0 ? ' disabled' : ''}>← Previous</button>
              <button class="btn" id="nextQ"${cur === paper.length - 1 ? ' disabled' : ''}>Next →</button>
            </div>
          </div>
        </div>`;
        const ta = body.querySelector('#ans');
        const wc = body.querySelector('#wc');
        const count = () => {
          const n = ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0;
          const target = (q.marks || 10) * 22;
          wc.textContent = `${n} words · a ${q.marks || 10}-mark answer usually runs ~${target} words`;
        };
        ta.addEventListener('input', () => { answers[cur] = ta.value; count(); saveDraft(seed, answers); renderNav(); });
        count();
        body.querySelector('#prevQ')?.addEventListener('click', () => { cur--; renderQ(); });
        body.querySelector('#nextQ')?.addEventListener('click', () => { cur++; renderQ(); });
        renderNav();
        ta.focus();
      }

      const tick = setInterval(() => {
        if (paused || finished) return;
        left--;
        timerEl.textContent = fmtTime(left);
        timerEl.className = 'timer' + (left < 60 ? ' danger' : left < 300 ? ' warn' : '');
        if (left <= 0) { clearInterval(tick); submit(true); }
      }, 1000);

      root.querySelector('#pauseBtn').addEventListener('click', (e) => {
        paused = !paused;
        e.currentTarget.textContent = paused ? '▶ Resume' : '⏸ Pause';
      });
      root.querySelector('#submitBtn').addEventListener('click', () => submit(false));

      function submit(auto) {
        if (finished) return;
        const blank = answers.filter((a) => !a?.trim()).length;
        if (!auto && blank && !confirm(`${blank} question${blank === 1 ? ' is' : 's are'} still blank. Submit anyway?`)) return;
        finished = true;
        clearInterval(tick);
        renderMarking(root, course, paper, answers, minutes * 60 - left, seed, query.tier || '');
      }

      renderQ();
      return () => clearInterval(tick);
    },
  };
}

function saveDraft(seed, answers) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ seed, answers })); } catch {}
}
function loadDraft(seed, n) {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    if (d && d.seed === seed && Array.isArray(d.answers)) return d.answers;
  } catch {}
  return new Array(n).fill('');
}

/* ----------------------------------------------------------- marking ---- */

function renderMarking(root, course, paper, answers, seconds, seed, tier) {
  const awarded = new Array(paper.length).fill(0);
  const total = sum(paper.map((q) => q.marks || 0));

  root.innerHTML = `
    <div class="page-head"><h1>Self-marking</h1>
      <p class="sub">Compare each answer with the model answer and award yourself marks honestly — that is where the learning happens.</p></div>
    <div class="card" style="position:sticky;top:calc(var(--top-h) + 8px);z-index:15;margin-bottom:18px">
      <div class="spread">
        <div><b id="scoreNow">0</b> / ${total} marks · <span id="pctNow" class="tag">0%</span></div>
        <div class="row"><span class="muted" style="font-size:13px">Time taken ${fmtTime(seconds)}</span>
          <button class="btn primary" id="finishBtn">Save result</button></div>
      </div>
    </div>
    <div id="markBody"></div>`;

  const mb = root.querySelector('#markBody');
  mb.innerHTML = paper.map((q, i) => {
    const max = q.marks || 10;
    return `<div class="card" style="margin-bottom:16px">
      <div class="row" style="margin-bottom:8px">
        <span class="tag accent">Q${i + 1}</span>${marksTag(max)}${diffTag(q.difficulty)}
      </div>
      <p style="font-weight:640;margin:0 0 12px">${esc(q.text)}</p>

      <h4 style="margin:0 0 6px;font-size:13px;color:var(--fg-3);text-transform:uppercase;letter-spacing:.05em">Your answer</h4>
      <div class="prose" style="background:var(--bg-3);padding:12px 14px;border-radius:8px;max-width:none;white-space:pre-wrap;font-size:14px">${
        esc(answers[i] || '') || '<span class="muted">— left blank —</span>'}</div>

      ${q.answerPoints?.length ? `<div class="scheme" style="margin-top:14px"><b>Marking scheme</b><ul>${
        q.answerPoints.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>` : ''}

      <details style="margin-top:12px">
        <summary style="cursor:pointer;font-weight:650;font-size:13.5px;color:var(--accent)">Show the model answer</summary>
        <div class="prose" style="margin-top:10px;max-width:none">${q.answer ? md(q.answer) : '<p class="muted">No model answer stored for this question yet.</p>'}</div>
      </details>

      <div class="row" style="margin-top:14px;align-items:center">
        <label style="font-size:13px;color:var(--fg-3)">Marks awarded</label>
        <input type="range" min="0" max="${max}" step="0.5" value="0" data-i="${i}" class="markInput" style="flex:1;max-width:280px">
        <b class="markVal" data-i="${i}">0</b> / ${max}
      </div>
    </div>`;
  }).join('');

  const scoreNow = root.querySelector('#scoreNow');
  const pctNow = root.querySelector('#pctNow');
  const refresh = () => {
    const s = sum(awarded);
    const pct = total ? Math.round((s / total) * 100) : 0;
    scoreNow.textContent = s;
    pctNow.textContent = `${pct}%`;
    pctNow.className = `tag ${pct >= 80 ? 'beginner' : pct >= 50 ? 'intermediate' : 'advanced'}`;
  };
  mb.querySelectorAll('.markInput').forEach((inp) => inp.addEventListener('input', () => {
    const i = Number(inp.dataset.i);
    awarded[i] = Number(inp.value);
    mb.querySelector(`.markVal[data-i="${i}"]`).textContent = inp.value;
    refresh();
  }));

  root.querySelector('#finishBtn').addEventListener('click', () => {
    const score = sum(awarded);
    recordExam({
      id: `${course.id}-${seed}`, courseId: course.id, tier: tier || undefined,
      title: `${course.code} mock #${seed}`,
      score, total, seconds, questions: paper.map((q, i) => ({ id: q.id, awarded: awarded[i], max: q.marks || 10 })),
    });
    localStorage.removeItem(DRAFT_KEY);
    const pct = total ? Math.round((score / total) * 100) : 0;
    root.innerHTML = `<div class="card center" style="max-width:560px;margin:40px auto;padding:40px">
      <div style="font-size:56px">${pct >= 80 ? '🏆' : pct >= 60 ? '🥈' : pct >= 40 ? '📈' : '📚'}</div>
      <h1 style="margin:10px 0 4px">${score} / ${total}</h1>
      <p class="sub">${pct}% · ${fmtTime(seconds)} · +40 XP</p>
      <p class="muted" style="font-size:13.5px">${
        pct >= 80 ? 'First-class territory. Rotate to a harder chapter next.'
        : pct >= 60 ? 'Solid. Drill the questions you lost marks on in Active Recall.'
        : 'Go back to the theories behind the weakest answers, then retake this paper.'}</p>
      <div class="row" style="justify-content:center;margin-top:20px">
        <a class="btn primary" href="#/c/${esc(course.id)}/exam">New paper</a>
        <a class="btn" href="#/progress">Progress</a>
      </div>
    </div>`;
    scrollTo({ top: 0, behavior: 'smooth' });
  });

  scrollTo({ top: 0 });
}
