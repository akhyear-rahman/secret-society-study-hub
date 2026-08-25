// The Path — a Duolingo-style quest map.
//
// Chapters become nodes on a winding track. Missions punctuate it:
//
//   In-course   small     every fourth chapter   15 marks / 60 min
//   Midterm     medium    at the halfway mark    30 marks / 90 min
//   Final       flagship  at the end             the course's real pattern
//
// A chapter node is cleared by reading its theories and holding its recall
// cards; a mission is cleared by sitting that paper and scoring half. Nothing
// is hard-locked — a locked node still opens, it just warns you first. This is
// revision, not a game you can lose.

import { allCourses, siteIndex } from '../content.js';
import { esc, clamp, sum } from '../util.js';
import { pageHead, empty } from '../ui.js';
import { state, isRead, cardMastery, cardDue } from '../store.js';
import { realQuestions } from '../priority.js';
import { setQuery } from '../router.js';
import { observeIn } from '../motion.js';

const STEP = 122;      // vertical distance between node centres
const AMP  = 104;      // how far the track swings either side
const TRACK = 360;     // fixed track width, so the SVG maths stays honest

const TIERS = {
  incourse: { label: 'In-course',   sub: 'Small mission',    marks: 15, mins: 60,  count: 2, size: 78,  em: '🗝️' },
  midterm:  { label: 'Midterm',     sub: 'Medium mission',   marks: 30, mins: 90,  count: 3, size: 92,  em: '⚔️' },
  final:    { label: 'Final Examination', sub: 'Flagship mission', marks: 50, mins: 180, count: 4, size: 112, em: '👑' },
};

/** How far through a chapter you are, 0..1. Same weighting as the study plan. */
function chapterProgress(course, ch) {
  const ths = course.theories.filter((t) => t.chapterId === ch.id);
  const cards = course.cards.filter((c) => c.chapterId === ch.id);
  if (!ths.length && !cards.length) return 0;
  const readFrac = ths.length ? ths.filter((t) => isRead(t.id)).length / ths.length : 0;
  const mastery = cards.length ? sum(cards.map((c) => cardMastery(c.id))) / cards.length : 0;
  return clamp(0.35 * readFrac + 0.65 * mastery, 0, 1);
}

const crownsFor = (p) => (p >= 0.9 ? 3 : p >= 0.66 ? 2 : p >= 0.33 ? 1 : 0);

/** Has this mission been sat and passed? */
function missionCleared(tierId) {
  return state.exams.some((e) => e.tier === tierId && e.total && e.score / e.total >= 0.5);
}
const missionBest = (tierId) => state.exams
  .filter((e) => e.tier === tierId && e.total)
  .reduce((best, e) => Math.max(best, e.score / e.total), 0);

/** Build the ordered list of nodes for one course. */
export function buildPath(course) {
  const chapters = course.chapters;
  const types = new Set(realQuestions(course).map((q) => q.examType));
  const nodes = [];
  const mid = Math.floor(chapters.length / 2);
  let mission = 0;

  chapters.forEach((ch, i) => {
    const p = chapterProgress(course, ch);
    nodes.push({
      kind: 'chapter', id: `ch:${ch.id}`, chapter: ch, progress: p,
      crowns: crownsFor(p),
      theories: course.theories.filter((t) => t.chapterId === ch.id),
      cards: course.cards.filter((c) => c.chapterId === ch.id),
      questions: course.questions.filter((q) => q.chapterId === ch.id),
      href: `#/c/${course.id}?ch=${encodeURIComponent(ch.id)}`,
    });

    const isMid = i === mid - 1 && chapters.length >= 6;
    const isLast = i === chapters.length - 1;
    const everyFourth = (i + 1) % 4 === 0;

    let tier = null;
    if (isLast) tier = 'final';
    else if (isMid) tier = 'midterm';
    else if (everyFourth) tier = 'incourse';
    if (!tier) return;
    // Only offer a paper the course actually has questions for.
    if (tier !== 'final' && !types.has(tier) && !types.has('final')) return;

    const t = TIERS[tier];
    const tierId = `${course.id}:${tier}:${++mission}`;
    const useType = types.has(tier) ? tier : '';
    const mins = tier === 'final' ? (course.examPattern?.durationMin || t.mins) : t.mins;
    nodes.push({
      kind: 'mission', id: tierId, tier, tierId, meta: t,
      cleared: missionCleared(tierId), best: missionBest(tierId),
      covers: chapters.slice(Math.max(0, i - 3), i + 1),
      href: `#/c/${course.id}/exam?tier=${encodeURIComponent(tierId)}`
          + `&mins=${mins}&count=${t.count}${useType ? `&type=${useType}` : ''}`
          + (tier === 'final' ? '' : '&pat=0'),
    });
  });

  // The first node that is not finished is where you are.
  const doneAt = (n) => (n.kind === 'chapter' ? n.progress >= 0.7 : n.cleared);
  let activeSet = false;
  for (const n of nodes) {
    if (doneAt(n)) { n.status = 'done'; continue; }
    n.status = activeSet ? 'todo' : 'active';
    activeSet = true;
  }
  return nodes;
}

/* --------------------------------------------------------------- view --- */

export default async function path({ params, query }) {
  const [idx, courses] = await Promise.all([siteIndex(), allCourses()]);
  const withPath = courses.filter((c) => c.chapters.length);
  // Default to the course with the most to actually do, not whichever is
  // registered first — an empty path is a poor first impression.
  const richest = withPath.slice().sort((a, b) =>
    (b.stats.questions + b.stats.theories * 3) - (a.stats.questions + a.stats.theories * 3))[0];
  const wanted = params.cid || query.course || richest?.id;
  const course = withPath.find((c) => c.id === wanted) || withPath[0];

  const head = pageHead({
    crumbs: [{ label: 'The Path' }],
    title: 'The Path',
    sub: 'Every chapter is a step. Missions punctuate the climb — an in-course skirmish, '
       + 'a midterm, and the final as the flagship. Nothing is locked shut; the track only '
       + 'tells you where you are.',
  });

  const chooser = `<div class="filters">
    <div class="chipbar">
      ${withPath.map((c) => `<button class="chip${c.id === course?.id ? ' on' : ''}"
        data-course="${esc(c.id)}">${esc(c.code || c.title)}</button>`).join('')}
    </div>
  </div>`;

  if (!course) {
    return head + empty('No course has a syllabus yet',
      'Add chapters to a course and its path draws itself.');
  }

  const nodes = buildPath(course);
  if (!nodes.length) {
    return head + chooser + empty('This course has no chapters yet',
      `Add a <code>chapters</code> array to <code>${esc(course.id)}.json</code>.`);
  }

  /* ---- geometry: fixed-width track so the connector maths is exact ---- */
  const pt = (i) => ({
    x: TRACK / 2 + Math.sin(i * 0.85) * AMP,
    y: 70 + i * STEP,
  });
  const height = 70 + (nodes.length - 1) * STEP + 130;

  let d = '';
  nodes.forEach((n, i) => {
    const p = pt(i);
    if (i === 0) { d += `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`; return; }
    const q = pt(i - 1);
    const my = (q.y + p.y) / 2;
    d += ` C ${q.x.toFixed(1)} ${my.toFixed(1)}, ${p.x.toFixed(1)} ${my.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  });

  const doneCount = nodes.filter((n) => n.status === 'done').length;
  const pctDone = nodes.length ? doneCount / nodes.length : 0;

  const nodeHtml = nodes.map((n, i) => {
    const p = pt(i);
    const common = `style="top:${p.y}px;left:${p.x}px"`;

    if (n.kind === 'chapter') {
      const due = n.cards.filter((c) => cardDue(c.id)).length;
      return `<a class="qnode chap ${n.status}" ${common} href="${esc(n.href)}"
          data-i="${i}" title="${esc(n.chapter.title)}">
        <span class="qdisc">
          <span class="qnum">${esc(n.chapter.no ?? i + 1)}</span>
          ${n.status === 'done' ? '<span class="qtick">✓</span>' : ''}
        </span>
        <span class="qcrowns">${'♛'.repeat(n.crowns)}${'<span class="dim">♛</span>'.repeat(3 - n.crowns)}</span>
        <span class="qlabel">${esc(n.chapter.title)}</span>
        <span class="qmeta">
          ${n.theories.length ? `${n.theories.length} th` : 'no theory'}${
            n.questions.length ? ` · ${n.questions.length} Q` : ''}${
            due ? ` · <b>${due} due</b>` : ''}
        </span>
        ${n.status === 'active' ? '<span class="qhere">You are here</span>' : ''}
      </a>`;
    }

    const t = n.meta;
    // One style attribute only — a second is silently discarded, taking the
    // --msz size with it.
    return `<a class="qnode mission ${n.tier} ${n.status}${n.cleared ? ' cleared' : ''}"
        href="${esc(n.href)}" data-i="${i}"
        style="top:${p.y}px;left:${p.x}px;--msz:${t.size}px">
      <span class="qdisc mdisc"><span class="mem">${t.em}</span></span>
      <span class="qlabel strong">${esc(t.label)}</span>
      <span class="qmeta">${esc(t.sub)} · ${t.marks} marks · ${
        n.tier === 'final' ? (course.examPattern?.durationMin || t.mins) : t.mins} min</span>
      ${n.cleared ? `<span class="qbest">Best ${Math.round(n.best * 100)}%</span>`
                  : n.status === 'active' ? '<span class="qhere">Take it on</span>' : ''}
    </a>`;
  }).join('');

  const legend = `<div class="qlegend card">
    <div><span class="lg lg-done"></span> cleared</div>
    <div><span class="lg lg-active"></span> where you are</div>
    <div><span class="lg lg-todo"></span> ahead</div>
    <div><span class="lg lg-m"></span> mission</div>
    <div class="muted" style="margin-left:auto;font-size:12px">
      ${doneCount} of ${nodes.length} steps cleared</div>
  </div>`;

  const html = head + chooser + `
    <div class="qsummary card">
      <div class="spread">
        <div>
          <b style="font-family:var(--display);font-size:17px">${esc(course.code)} — ${esc(course.title)}</b>
          <div class="muted" style="font-size:12.5px;margin-top:3px">
            ${nodes.filter((n) => n.kind === 'chapter').length} chapters ·
            ${nodes.filter((n) => n.kind === 'mission').length} missions ·
            ${nodes.filter((n) => n.kind === 'mission' && n.cleared).length} cleared
          </div>
        </div>
        <div style="min-width:200px;flex:1;max-width:340px">
          <div class="bar"><span style="width:${(pctDone * 100).toFixed(0)}%"></span></div>
          <div class="muted" style="font-size:11.5px;margin-top:5px;text-align:right">
            ${Math.round(pctDone * 100)}% of the path</div>
        </div>
      </div>
    </div>
    ${legend}
    <div class="qtrack-wrap">
      <div class="qtrack" style="height:${height}px;width:${TRACK}px">
        <svg class="qline" width="${TRACK}" height="${height}" viewBox="0 0 ${TRACK} ${height}" aria-hidden="true">
          <path d="${d}" fill="none" stroke="var(--line-2)" stroke-width="10" stroke-linecap="round"
                stroke-dasharray="2 20"/>
        </svg>
        ${nodeHtml}
      </div>
    </div>`;

  return {
    html,
    mount(root) {
      root.querySelectorAll('[data-course]').forEach((b) =>
        b.addEventListener('click', () => setQuery({ course: b.dataset.course })));

      // Stagger the nodes in as the track scrolls past them.
      const els = Array.from(root.querySelectorAll('.qnode'));
      els.forEach((el, i) => { el.style.setProperty('--d', `${Math.min(i, 14) * 45}ms`); });
      const stop = observeIn(els, { rootMargin: '0px 0px -8% 0px', threshold: 0 });

      // Bring "you are here" into view without yanking the page around.
      const here = root.querySelector('.qnode.active');
      if (here) setTimeout(() => here.scrollIntoView({ block: 'center', behavior: 'smooth' }), 420);

      return stop;
    },
  };
}
