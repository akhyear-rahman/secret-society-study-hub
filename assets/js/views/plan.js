// Study Plan — the "what should I do right now" screen.
// Ranks every chapter by the marks still on the table, then hands you the
// single next action for each.

import { allCourses } from '../content.js';
import { esc, sum, clamp, EXAM_LABEL } from '../util.js';
import { plain } from '../markdown.js';
import { pageHead, empty, statCard, diffTag, marksTag } from '../ui.js';
import { state, setExamDate, daysToExam, cardDue, liveStreak } from '../store.js';
import { rankedPriorities, readinessScore, likelyQuestions, why, realQuestions } from '../priority.js';
import { setQuery } from '../router.js';

function ring(pct, size = 74) {
  const r = size / 2 - 5, c = 2 * Math.PI * r;
  const off = c * (1 - clamp(pct, 0, 1));
  return `<div class="ring" style="--sz:${size}px">
    <svg viewBox="0 0 ${size} ${size}">
      <circle class="trk" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none"/>
      <circle class="val" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none"
        stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/>
    </svg><b>${Math.round(pct * 100)}%</b></div>`;
}

export default async function plan({ query }) {
  const courses = await allCourses();
  const scope = query.course || '';
  const inScope = scope ? courses.filter((c) => c.id === scope) : courses;

  const rows = rankedPriorities(inScope);
  const ready = readinessScore(rows);
  const dueCount = inScope.flatMap((c) => c.cards).filter((c) => cardDue(c.id)).length;

  const withExam = courses
    .map((c) => ({ c, d: daysToExam(c.id) }))
    .filter((x) => x.d !== null && x.d >= 0)
    .sort((a, b) => a.d - b.d);
  const next = withExam[0];

  const head = pageHead({
    crumbs: [{ label: 'Study Plan' }],
    title: 'Study Plan',
    sub: 'Ranked by the marks still on the table — expected exam yield for each chapter, minus how ready you already are.',
  });

  /* ---------------------------------------------------------- hero --- */
  const hero = `<section class="hero">
    <div class="spread">
      <div style="min-width:260px">
        <div class="row" style="gap:16px;align-items:center">
          ${ring(ready, 82)}
          <div>
            <h2 style="margin:0 0 2px;font-size:22px">${
              ready >= 0.75 ? 'You are in good shape.'
              : ready >= 0.4 ? 'Solid base — keep going.'
              : ready >= 0.15 ? 'Early days. The order below matters.'
              : 'Start at number one.'}</h2>
            <p class="sub" style="font-size:13.5px">
              Ready for an estimated <b>${Math.round(ready * 100)}%</b> of the marks the archive predicts.
              ${next ? `<br><b>${esc(next.c.code)}</b> exam in <b>${next.d}</b> day${next.d === 1 ? '' : 's'}.` : ''}
            </p>
          </div>
        </div>
        <div class="row" style="margin-top:18px">
          ${dueCount ? `<a class="btn primary" href="#/recall${scope ? `?course=${esc(scope)}` : ''}">🧠 Clear ${dueCount} due card${dueCount === 1 ? '' : 's'}</a>` : ''}
          ${rows[0] ? `<a class="btn" href="#/c/${esc(rows[0].course.id)}?ch=${esc(rows[0].chapter.id)}">▶ Start with ${esc(rows[0].chapter.title)}</a>` : ''}
        </div>
      </div>
      <div class="grid g4" style="min-width:280px">
        ${statCard(liveStreak(), 'day streak')}
        ${statCard(dueCount, 'cards due')}
        ${statCard(rows.length, 'chapters ranked')}
        ${statCard(sum(inScope.map((c) => realQuestions(c).length)), 'past questions')}
      </div>
    </div>
  </section>`;

  /* ------------------------------------------------------- filters --- */
  const filters = `<div class="filters">
    <div class="chipbar">
      <button class="chip${scope ? '' : ' on'}" data-course="">All courses</button>
      ${courses.map((c) => `<button class="chip${scope === c.id ? ' on' : ''}" data-course="${esc(c.id)}">${esc(c.code || c.title)}</button>`).join('')}
    </div>
  </div>`;

  /* ---------------------------------------------------- the ranking --- */
  const maxPriority = rows.length ? rows[0].priority : 1;
  const ranking = rows.length ? rows.slice(0, 15).map((r, i) => {
    const theory = r.theories.find((t) => !state.theory[t.id]?.read) || r.theories[0];
    const dueHere = r.cards.filter((c) => cardDue(c.id)).length;
    const share = r.priority / maxPriority;
    return `<div class="plan-item">
      <div class="plan-rank">${i + 1}</div>
      <div class="plan-main">
        <div class="row" style="gap:8px">
          <b>${esc(r.chapter.title)}</b>
          <span class="tag">${esc(r.course.code)}</span>
          ${i < 3 ? '<span class="tag hot">high yield</span>' : ''}
          ${!r.hasContent ? '<span class="tag advanced">needs writing</span>' : ''}
        </div>
        <div class="plan-why">${esc(why(r))}</div>
        <div class="yieldbar" title="Blue = ready, grey = still to cover">
          <i style="width:${(r.readiness * 100).toFixed(0)}%;background:linear-gradient(90deg,var(--accent),var(--accent-2))"></i>
        </div>
        <div class="plan-acts">
          ${theory ? `<a class="btn sm" href="#/c/${esc(r.course.id)}/theory/${esc(theory.id)}">📖 Read theory</a>` : ''}
          ${dueHere ? `<a class="btn sm" href="#/c/${esc(r.course.id)}/recall?ch=${esc(r.chapter.id)}&mode=due">🧠 ${dueHere} due</a>`
            : r.cards.length ? `<a class="btn sm" href="#/c/${esc(r.course.id)}/recall?ch=${esc(r.chapter.id)}&mode=all">🧠 Drill ${r.cards.length}</a>` : ''}
          ${r.questions.length ? `<a class="btn sm" href="#/c/${esc(r.course.id)}/questions?ch=${esc(r.chapter.id)}">🗂️ ${r.questions.length} question${r.questions.length === 1 ? '' : 's'}</a>` : ''}
          ${r.questions.length && r.answerCoverage < 1
            ? `<span class="tag" title="${r.questions.length - r.answered} still need a model answer">${Math.round(r.answerCoverage * 100)}% answered</span>` : ''}
        </div>
      </div>
      <div style="flex:none;text-align:right;min-width:70px">
        <div style="font-size:19px;font-weight:750;letter-spacing:-.03em;font-variant-numeric:tabular-nums">${Math.round(r.priority)}</div>
        <div class="muted" style="font-size:10.5px;text-transform:uppercase;letter-spacing:.05em">priority</div>
      </div>
    </div>`;
  }).join('') : empty('Nothing to rank yet',
      'Add past-year questions to a course and this list builds itself.');

  /* ------------------------------------------------ likely questions --- */
  const likelyBlocks = inScope
    .filter((c) => realQuestions(c).length >= 6)
    .map((c) => {
      const qs = likelyQuestions(c, 6);
      return `<section style="margin-bottom:22px">
        <h3 style="margin:0 0 10px">${esc(c.code)} — most frequently examined</h3>
        <div class="card pad0">
          ${qs.map((q, i) => `<a class="rail-item" href="#/c/${esc(c.id)}/questions?q=${encodeURIComponent(q.id)}"
              style="display:flex;gap:12px;align-items:flex-start;padding:12px 15px;border-bottom:1px solid var(--line);border-radius:0">
            <span class="muted" style="font-variant-numeric:tabular-nums;font-weight:700;flex:none">${i + 1}</span>
            <span style="flex:1;min-width:0">
              ${esc(plain(q.text, 130))}
              <span class="meta">
                ${marksTag(q.marks)}
                ${q.year ? `<span class="tag">${esc(q.year)}</span>` : ''}
                ${q.examType ? `<span class="tag">${esc(EXAM_LABEL[q.examType] || q.examType)}</span>` : ''}
                ${q.repeats?.length ? `<span class="tag hot">↻ seen ${q.repeats.length + 1}×</span>` : ''}
                ${q.answer ? '<span class="tag beginner">✓ answered</span>' : '<span class="tag">no answer yet</span>'}
              </span>
            </span>
          </a>`).join('')}
        </div>
      </section>`;
    }).join('');

  /* --------------------------------------------------- exam dates --- */
  const dates = `<div class="card">
    <p style="margin-top:0;font-size:13.5px">Set your exam dates and the plan counts down to the nearest one.</p>
    <div class="grid g2">
      ${courses.map((c) => `<label style="display:flex;gap:10px;align-items:center;font-size:13.5px">
        <span style="flex:1"><b>${esc(c.code)}</b> <span class="muted">${esc(c.title)}</span></span>
        <input type="date" class="examdate" data-course="${esc(c.id)}"
          value="${esc(state.examDates[c.id] || '')}"
          style="border:1px solid var(--line);background:var(--bg);border-radius:8px;padding:5px 9px;font-size:13px">
      </label>`).join('')}
    </div>
  </div>`;

  return {
    html: head + hero + filters +
      `<h2 style="margin-top:0">Do these next</h2>
       <p class="sub" style="margin-bottom:14px">Priority = expected marks × how much of it you have not
       covered. Work down the list; re-check after each session.${rows.length > 15
         ? ` Showing the top 15 of ${rows.length} ranked chapters.` : ''}</p>` + ranking +
      (likelyBlocks ? `<h2>Most likely to come up</h2>
        <p class="sub" style="margin-bottom:14px">Ranked by how often each question has recurred and how recently.
        This is a frequency count of the archive, not a prediction.</p>${likelyBlocks}` : '') +
      `<h2>Exam dates</h2>${dates}`,

    mount(root) {
      root.querySelectorAll('[data-course]').forEach((b) =>
        b.addEventListener('click', () => setQuery({ course: b.dataset.course })));
      root.querySelectorAll('.examdate').forEach((inp) =>
        inp.addEventListener('change', () => setExamDate(inp.dataset.course, inp.value)));
    },
  };
}
