// The front door, kept deliberately bare: where you are, what to do next,
// and the courses. Everything explanatory lives at #/about; everything else
// is one tap away in the drawer.

import { allCourses, siteIndex } from '../content.js';
import { state, liveStreak, cardDue, isRead, daysToExam } from '../store.js';
import { esc, sum } from '../util.js';
import { empty } from '../ui.js';
import { rankedPriorities } from '../priority.js';

export default async function home() {
  const [idx, courses] = await Promise.all([siteIndex(), allCourses()]);
  const site = idx.site || {};

  const due = courses.flatMap((c) => c.cards).filter((c) => cardDue(c.id)).length;
  const rows = rankedPriorities(courses);
  const top = rows[0];
  const nextExam = courses
    .map((c) => ({ c, d: daysToExam(c.id) }))
    .filter((x) => x.d !== null && x.d >= 0)
    .sort((a, b) => a.d - b.d)[0];

  /* --------------------------------------------------------- opening --- */

  const hero = `<section class="home-open">
    <p class="eyebrow">Semester 7 · Economics · University of Dhaka</p>
    <h1>${esc(site.greeting || 'The Order convenes.')}</h1>
    <p class="sub lede">${esc(site.subtitle || '')}</p>

    <div class="row hero-acts">
      <a class="btn primary" href="#/plan">Study Plan</a>
      ${due ? `<a class="btn" href="#/recall">Review ${due} due</a>` : ''}
      <a class="btn ghost" href="#/path">The Path</a>
    </div>

    <div class="tickers">
      <span><b data-count="${liveStreak()}">${liveStreak()}</b> day streak</span>
      <span><b data-count="${state.xp}">${state.xp}</b> XP</span>
      <span><b data-count="${due}">${due}</b> due now</span>
      ${nextExam ? `<span><b>${nextExam.d}</b> days to ${esc(nextExam.c.code)}</span>` : ''}
    </div>

    ${top ? `<a class="nextup" href="#/c/${esc(top.course.id)}?ch=${esc(top.chapter.id)}">
      <span class="nu-body">
        <span class="nu-tag">Next up</span>
        <span class="nu-title">${esc(top.chapter.title)}</span>
        <span class="nu-sub">${esc(top.course.code)} · highest marks still uncovered</span>
      </span>
      <span class="nu-go">→</span>
    </a>` : ''}
  </section>`;

  /* --------------------------------------------------------- courses --- */

  const cards = courses.map((c) => {
    const read = c.theories.filter((t) => isRead(t.id)).length;
    const pct = c.stats.theories ? Math.round((read / c.stats.theories) * 100) : 0;
    const bits = [
      c.stats.chapters ? `${c.stats.chapters} ch` : '',
      c.stats.theories ? `${c.stats.theories} theories` : '',
      c.stats.questions ? `${c.stats.questions} Q` : '',
    ].filter(Boolean).join(' · ') || 'empty';
    return `<a class="card course-card" href="#/c/${esc(c.id)}">
      <span class="stripe" style="background:${esc(c.color)}"></span>
      <div style="padding-left:8px">
        <span class="ccode">${esc(c.code)}</span>
        <h3>${esc(c.title)}</h3>
        <div class="bar"><span style="width:${pct}%"></span></div>
        <div class="mini"><span>${esc(bits)}</span></div>
      </div>
    </a>`;
  }).join('');

  const courseSection = `<section class="reveal">
    <h2>Courses</h2>
    ${courses.length ? `<div class="grid g2">${cards}</div>`
      : empty('No courses registered', 'Add them to <code>content/index.json</code>.')}
  </section>`;

  /* ------------------------------------------------------------ foot --- */

  const foot = `<p class="home-foot reveal">
    <a href="#/about">How this works →</a>
    <span class="sep">·</span>
    <a href="#/questions">${sum(courses.map((c) => c.stats.questions))} past questions</a>
    <span class="sep">·</span>
    <a href="#/help">Add content</a>
  </p>`;

  return hero + courseSection + foot;
}
