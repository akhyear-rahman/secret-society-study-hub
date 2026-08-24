import { allCourses, siteIndex } from '../content.js';
import { state, liveStreak, cardDue, isRead } from '../store.js';
import { esc, sum, todayKey } from '../util.js';
import { statCard, empty } from '../ui.js';

export default async function home() {
  const [idx, courses] = await Promise.all([siteIndex(), allCourses()]);
  const site = idx.site || {};

  const totals = {
    theories: sum(courses.map((c) => c.stats.theories)),
    questions: sum(courses.map((c) => c.stats.questions)),
    answered: sum(courses.map((c) => c.stats.answered)),
    notes: sum(courses.map((c) => c.stats.notes)),
    cards: sum(courses.map((c) => c.stats.cards)),
  };
  const allCards = courses.flatMap((c) => c.cards);
  const due = allCards.filter((c) => cardDue(c.id));
  const readCount = courses.flatMap((c) => c.theories).filter((t) => isRead(t.id)).length;
  const today = state.days[todayKey()] || { xp: 0, cards: 0 };
  // "Empty" means nothing at all — a mapped syllabus or imported notes count.
  const empties = courses.filter((c) =>
    !c.chapters.length && !c.stats.theories && !c.stats.questions && !c.stats.notes);

  const hero = `<section class="hero">
    <div class="spread">
      <div>
        <h1 style="margin-bottom:4px">${esc(site.greeting || 'Ready when you are.')}</h1>
        <p class="sub">${esc(site.subtitle || 'Semester 7 — theories, past papers, model answers and practice in one place.')}</p>
        <div class="row" style="margin-top:16px">
          <a class="btn primary" href="#/recall">🧠 Review ${due.length} due card${due.length === 1 ? '' : 's'}</a>
          <a class="btn" href="#/exam">🎯 Start a mock exam</a>
          <a class="btn ghost" href="#/questions">🗂️ Question bank</a>
        </div>
      </div>
      <div class="grid g4" style="min-width:290px">
        ${statCard(liveStreak(), 'day streak')}
        ${statCard(state.xp, 'total xp')}
        ${statCard(today.xp, 'xp today')}
        ${statCard(due.length, 'due now')}
      </div>
    </div>
  </section>`;

  const cards = courses.map((c) => {
    const readInCourse = c.theories.filter((t) => isRead(t.id)).length;
    const pct = c.stats.theories ? Math.round((readInCourse / c.stats.theories) * 100) : 0;
    return `<a class="card course-card" href="#/c/${esc(c.id)}">
      <span class="stripe" style="background:${esc(c.color)}"></span>
      <div style="padding-left:8px">
        <div class="spread"><span class="ccode">${esc(c.code)}</span>
          ${c.credits ? `<span class="tag">${esc(c.credits)} cr</span>` : ''}</div>
        <h3>${esc(c.title)}</h3>
        ${c.titleBn ? `<p class="bn">${esc(c.titleBn)}</p>` : ''}
        <div class="bar"><span style="width:${pct}%"></span></div>
        <div class="mini">
          <span><b>${c.stats.theories}</b> theories</span>
          <span><b>${c.stats.questions}</b> questions</span>
          <span><b>${c.stats.answered}</b> answered</span>
          <span><b>${c.stats.notes}</b> notes</span>
        </div>
        <div class="mini"><span>${pct}% of theories marked read</span></div>
      </div>
    </a>`;
  }).join('');

  const setup = empties.length ? `<section>
    <h2>Waiting for content</h2>
    <p class="sub" style="margin-bottom:12px">${empties.length} course${empties.length === 1 ? ' has' : 's have'} no content file yet — the app is ready for them.</p>
    <div class="card">
      <p style="margin-top:0">Drop a JSON file at <code>content/courses/&lt;course-id&gt;.json</code> and it appears here instantly. The ids waiting are:</p>
      <div class="chipbar">${empties.map((c) => `<span class="chip">${esc(c.id)}</span>`).join('')}</div>
      <p style="margin-bottom:0"><a class="btn sm" href="#/help" style="margin-top:12px">Read the authoring guide →</a></p>
    </div>
  </section>` : '';

  return `${hero}
    <section>
      <div class="spread"><h2 style="margin-top:0">Your courses</h2>
        <span class="muted" style="font-size:13px">${courses.length} courses · ${totals.theories} theories · ${totals.questions} past-year questions</span></div>
      ${courses.length ? `<div class="grid g2">${cards}</div>`
        : empty('No courses registered', 'Add them to <code>content/index.json</code>.')}
    </section>

    <section>
      <h2>At a glance</h2>
      <div class="grid g4">
        ${statCard(totals.theories, 'theories', `${readCount} read`)}
        ${statCard(totals.questions, 'past questions', `${totals.answered} with model answers`)}
        ${statCard(totals.cards, 'recall cards', `${due.length} due today`)}
        ${statCard(totals.notes, 'lecture notes')}
        ${statCard(state.exams.length, 'mock exams taken')}
        ${statCard(state.badges.length + '/12', 'badges earned')}
      </div>
    </section>
    ${setup}`;
}
