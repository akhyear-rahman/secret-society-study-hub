// The front door. Three jobs, in order: say what this is, get you to any
// part of it in one click, and show honestly how much of it is filled in.

import { allCourses, siteIndex } from '../content.js';
import { state, liveStreak, cardDue, isRead, daysToExam } from '../store.js';
import { esc, sum, todayKey } from '../util.js';
import { statCard, empty } from '../ui.js';
import { rankedPriorities, realQuestions } from '../priority.js';

const tile = (href, icon, name, blurb, meta) => `
  <a class="card navtile" href="${esc(href)}">
    <span class="nt-ico">${icon}</span>
    <b>${esc(name)}</b>
    <small>${esc(blurb)}</small>
    ${meta ? `<span class="nt-n">${esc(meta)}</span>` : ''}
  </a>`;

export default async function home() {
  const [idx, courses] = await Promise.all([siteIndex(), allCourses()]);
  const site = idx.site || {};

  const totals = {
    theories: sum(courses.map((c) => c.stats.theories)),
    questions: sum(courses.map((c) => c.stats.questions)),
    answered: sum(courses.map((c) => c.stats.answered)),
    notes: sum(courses.map((c) => c.stats.notes)),
    cards: sum(courses.map((c) => c.stats.cards)),
    chapters: sum(courses.map((c) => c.stats.chapters)),
    books: sum(courses.map((c) => c.textbooks.length)),
  };
  const due = courses.flatMap((c) => c.cards).filter((c) => cardDue(c.id));
  const readCount = courses.flatMap((c) => c.theories).filter((t) => isRead(t.id)).length;
  const today = state.days[todayKey()] || { xp: 0 };
  const rows = rankedPriorities(courses);
  const top = rows[0];
  const years = courses.flatMap((c) => realQuestions(c).map((q) => q.year)).filter(Boolean);
  const span = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : '—';

  const nextExam = courses
    .map((c) => ({ c, d: daysToExam(c.id) }))
    .filter((x) => x.d !== null && x.d >= 0)
    .sort((a, b) => a.d - b.d)[0];

  const empties = courses.filter((c) =>
    !c.chapters.length && !c.stats.theories && !c.stats.questions && !c.stats.notes);

  /* ----------------------------------------------------------- hero --- */

  const hero = `<section class="hero home-hero">
    <div class="spread">
      <div style="max-width:56ch">
        <p class="eyebrow">Semester 7 · Economics · University of Dhaka</p>
        <h1 style="margin:6px 0 10px">${esc(site.greeting || 'The Order convenes.')}</h1>
        <p class="sub">${esc(site.subtitle || '')}</p>
        <div class="row" style="margin-top:20px">
          <a class="btn primary" href="#/plan">🎓 What should I study now?</a>
          ${due.length ? `<a class="btn" href="#/recall">🧠 ${due.length} card${due.length === 1 ? '' : 's'} due</a>` : ''}
          <a class="btn ghost" href="#/questions">🗂️ Question bank</a>
        </div>
        ${nextExam ? `<p class="muted" style="font-size:13px;margin-top:14px">
          Next exam on record — <b>${esc(nextExam.c.code)}</b> in <b>${nextExam.d}</b> day${nextExam.d === 1 ? '' : 's'}.</p>` : ''}
      </div>
      <div class="grid g4" style="min-width:290px">
        ${statCard(liveStreak(), 'day streak')}
        ${statCard(state.xp, 'total xp')}
        ${statCard(today.xp, 'xp today')}
        ${statCard(due.length, 'due now')}
      </div>
    </div>
  </section>`;

  /* ------------------------------------------------------ navigation --- */

  const nav = `<section>
    <h2>Go anywhere</h2>
    <div class="grid g3 navgrid">
      ${tile('#/path', '🗺️', 'The Path',
        'The quest map. Chapters as steps, with in-course, midterm and final missions along the way.',
        `${totals.chapters} steps`)}
      ${tile('#/plan', '🎓', 'Study Plan',
        'Every chapter ranked by the marks still on the table, with one next action each.',
        rows.length ? `${rows.length} chapters ranked` : 'needs questions')}
      ${tile('#/questions', '🗂️', 'Question Bank',
        'Every past-year question, grouped topic-, chapter-, year- or difficulty-wise.',
        `${totals.questions} questions · ${totals.answered} answered`)}
      ${tile('#/recall', '🧠', 'Active Recall',
        'Spaced-repetition drilling. Grade yourself; the hard ones come back sooner.',
        `${totals.cards} cards · ${due.length} due`)}
      ${tile('#/exam', '🎯', 'Mock Exam',
        'A fresh paper on the real pattern, timed, then self-marked against the model answers.',
        state.exams.length ? `${state.exams.length} sat` : 'none sat yet')}
      ${tile('#/notes', '📝', 'Notes',
        'Class notes and lecture sheets, cross-linked to the theories they explain.',
        `${totals.notes} notes`)}
      ${tile('#/textbooks', '📚', 'Textbooks',
        'Prescribed and reference books, with their exercises indexed against theories.',
        `${totals.books} books`)}
      ${tile('#/progress', '📈', 'Progress',
        'XP, streak, twelve-week activity map, weakest chapters, badges and backups.',
        `${state.badges.length}/12 badges`)}
      ${tile('#/help', '❓', 'Add Content',
        'How the JSON files map onto every screen, and the fastest order to fill them in.',
        'authoring guide')}
    </div>
  </section>`;

  /* --------------------------------------------------------- courses --- */

  const courseCards = courses.map((c) => {
    const read = c.theories.filter((t) => isRead(t.id)).length;
    const pct = c.stats.theories ? Math.round((read / c.stats.theories) * 100) : 0;
    return `<a class="card course-card" href="#/c/${esc(c.id)}">
      <span class="stripe" style="background:${esc(c.color)}"></span>
      <div style="padding-left:8px">
        <div class="spread"><span class="ccode">${esc(c.code)}</span>
          ${c.credits ? `<span class="tag">${esc(c.credits)} cr</span>` : ''}</div>
        <h3>${esc(c.title)}</h3>
        ${c.titleBn ? `<p class="bn">${esc(c.titleBn)}</p>` : ''}
        <div class="bar"><span style="width:${pct}%"></span></div>
        <div class="mini">
          <span><b>${c.stats.chapters}</b> chapters</span>
          <span><b>${c.stats.theories}</b> theories</span>
          <span><b>${c.stats.questions}</b> questions</span>
          <span><b>${c.stats.notes}</b> notes</span>
        </div>
      </div>
    </a>`;
  }).join('');

  const courseSection = `<section class="reveal">
    <div class="spread"><h2>Your courses</h2></div>
    ${courses.length ? `<div class="grid g2">${courseCards}</div>`
      : empty('No courses registered', 'Add them to <code>content/index.json</code>.')}
  </section>`;

  /* ------------------------------------------------------ the method --- */

  const method = `<section class="reveal">
    <h2>How this works</h2>
    <p class="sub" style="margin-bottom:16px">Four ideas, each of which changes what you do rather than
      just what you look at.</p>
    <div class="grid g2">
      <div class="card method">
        <span class="m-num">01</span>
        <b>The past papers come first</b>
        <p>Everything is organised around what examiners have actually asked, not around
        chapter order. Questions carry the years they recurred in, so a question that has
        come six times is visibly worth more than one that came once. Theories exist to
        serve those questions, and each one lists the questions it answers.</p>
      </div>
      <div class="card method">
        <span class="m-num">02</span>
        <b>Reason in Bangla, write in English</b>
        <p>Every theory has a fluent Bangla explanation that keeps the economic and
        theoretical terminology in English, marked in gold. You think in the language you
        think in, while the exact words you will have to put on the script stay in front
        of you. Press <kbd>L</kbd> to switch.</p>
      </div>
      <div class="card method">
        <span class="m-num">03</span>
        <b>Retrieval, not rereading</b>
        <p>Rereading feels like learning and mostly is not. Every theory carries recall
        cards, and every answered question becomes one automatically. You grade yourself
        four ways; the scheduler brings back what you fumbled and leaves alone what you
        know.</p>
      </div>
      <div class="card method">
        <span class="m-num">04</span>
        <b>Ranked by marks at stake</b>
        <p>The Study Plan scores each chapter by the marks the archive suggests it is
        worth — weighted for recurrence and recency — then subtracts how ready you already
        are. What is left is the marks still on the table, and that is the order to work
        in.${top ? ` Right now that puts <b>${esc(top.chapter.title)}</b> first.` : ''}</p>
      </div>
    </div>
  </section>`;

  /* --------------------------------------------------- a study hour --- */

  const session = `<section class="reveal">
    <h2>A session, end to end</h2>
    <div class="card">
      <ol class="steps">
        <li><b>Clear what is due.</b> Open <a href="#/recall">Active Recall</a> and work
          through the queue. Ten minutes, and it is the highest-value ten minutes available.</li>
        <li><b>Check the ranking.</b> <a href="#/plan">Study Plan</a> tells you which chapter
          has the most marks still uncovered. Take the top one.</li>
        <li><b>Read the theory.</b> Press <kbd>F</kbd> for reading mode — the app gets out of
          the way and leaves one column of serif on a warm page. Grade your grasp at the end.</li>
        <li><b>Read the questions beside it.</b> The theory page lists every past-year
          question on that chapter, with the model answer and its marking scheme.</li>
        <li><b>Sit a paper.</b> Once a chapter feels solid, <a href="#/exam">Mock Exam</a>
          builds one on the real pattern. Write under time, then mark yourself honestly
          against the scheme — that step is where the learning is.</li>
      </ol>
    </div>
  </section>`;

  /* --------------------------------------------- where content stands --- */

  const statusRows = courses.map((c) => {
    const answered = c.stats.questions ? Math.round((c.stats.answered / c.stats.questions) * 100) : null;
    const cell = (n, label) => n
      ? `<span class="tag">${n} ${label}</span>`
      : '<span class="muted" style="font-size:12px">—</span>';
    return `<tr>
      <td style="padding:9px 12px;white-space:nowrap"><b>${esc(c.code)}</b>
        <div class="muted" style="font-size:12px">${esc(c.title)}</div></td>
      <td style="padding:9px 12px">${cell(c.stats.chapters, 'chapters')}</td>
      <td style="padding:9px 12px">${cell(c.stats.theories, 'theories')}</td>
      <td style="padding:9px 12px">${c.stats.questions
        ? `<span class="tag">${c.stats.questions} questions</span>
           <span class="tag ${answered >= 50 ? 'beginner' : answered > 0 ? 'intermediate' : 'advanced'}">${answered}% answered</span>`
        : '<span class="muted" style="font-size:12px">—</span>'}</td>
      <td style="padding:9px 12px">${cell(c.stats.notes, 'notes')}</td>
    </tr>`;
  }).join('');

  const status = `<section class="reveal">
    <h2>Where the content stands</h2>
    <p class="sub" style="margin-bottom:14px">Built from the files themselves, so it is never
      out of date. Gaps here are the honest to-do list.</p>
    <div class="card pad0" style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:13.5px">
        <thead><tr>
          ${['Course', 'Syllabus', 'Theories', 'Question bank', 'Notes'].map((h) =>
            `<th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);
              font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--fg-3)">${h}</th>`).join('')}
        </tr></thead>
        <tbody>${statusRows}</tbody>
      </table>
    </div>
    <p class="muted" style="font-size:12.5px;margin-top:10px">
      Archive spans <b>${esc(span)}</b> · ${totals.chapters} chapters mapped ·
      ${totals.theories} theories written (${readCount} read) ·
      ${totals.questions} questions (${totals.answered} with model answers) ·
      ${totals.cards} recall cards · ${totals.notes} notes
    </p>
  </section>`;

  /* ------------------------------------------------------- shortcuts --- */

  const KEYS = [
    ['/', 'Search everything'], ['T', 'Cycle theme'], ['L', 'Bangla ⇄ English'],
    ['F', 'Reading mode'], ['+ −', 'Reading type size'], ['Esc', 'Close / leave reading'],
    ['G then P', 'Study Plan'], ['G then Q', 'Question Bank'], ['G then R', 'Active Recall'],
    ['Space', 'Reveal a card'], ['1–4', 'Grade a card'], ['G then H', 'Back here'],
  ];
  const shortcuts = `<section class="reveal">
    <h2>Shortcuts</h2>
    <div class="card"><div class="keygrid">
      ${KEYS.map(([k, v]) => `<div class="keyrow"><kbd>${esc(k)}</kbd><span>${esc(v)}</span></div>`).join('')}
    </div></div>
  </section>`;

  /* ----------------------------------------------------------- setup --- */

  const setup = empties.length ? `<section class="reveal">
    <h2>Waiting for content</h2>
    <p class="sub" style="margin-bottom:12px">${empties.length} course${empties.length === 1 ? ' has' : 's have'}
      nothing in them yet — the app is ready for them.</p>
    <div class="card">
      <p style="margin-top:0">Drop a JSON file at <code>content/courses/&lt;course-id&gt;.json</code> and it
        appears everywhere at once. The ids waiting are:</p>
      <div class="chipbar">${empties.map((c) => `<span class="chip">${esc(c.id)}</span>`).join('')}</div>
      <p style="margin-bottom:0"><a class="btn sm" href="#/help" style="margin-top:12px">Read the authoring guide →</a></p>
    </div>
  </section>` : '';

  return hero + nav + courseSection + method + session + status + shortcuts + setup;
}
