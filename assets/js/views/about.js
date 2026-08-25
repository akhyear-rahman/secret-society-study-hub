// Everything explanatory, moved off the home page so that page can stay bare:
// the method, what a session looks like, honest coverage, and the shortcuts.

import { allCourses } from '../content.js';
import { esc, sum } from '../util.js';
import { pageHead } from '../ui.js';
import { rankedPriorities, realQuestions } from '../priority.js';
import { state, isRead } from '../store.js';

export default async function about() {
  const courses = await allCourses();
  const top = rankedPriorities(courses)[0];

  const totals = {
    chapters: sum(courses.map((c) => c.stats.chapters)),
    theories: sum(courses.map((c) => c.stats.theories)),
    questions: sum(courses.map((c) => c.stats.questions)),
    answered: sum(courses.map((c) => c.stats.answered)),
    notes: sum(courses.map((c) => c.stats.notes)),
    cards: sum(courses.map((c) => c.stats.cards)),
  };
  const readCount = courses.flatMap((c) => c.theories).filter((t) => isRead(t.id)).length;
  const years = courses.flatMap((c) => realQuestions(c).map((q) => q.year)).filter(Boolean);
  const span = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : '—';

  const head = pageHead({
    crumbs: [{ label: 'How this works' }],
    title: 'How this works',
    sub: 'What the app is built around, what a study session looks like, and exactly how much '
       + 'of it is filled in so far.',
  });

  const method = `<section>
    <h2>Four ideas</h2>
    <div class="grid g2">
      <div class="card method">
        <span class="m-num">01</span>
        <b>The past papers come first</b>
        <p>Everything is organised around what examiners have actually asked, not around
        chapter order. Questions carry the years they recurred in, so one that has come six
        times is visibly worth more than one that came once. Theories exist to serve those
        questions, and each lists the questions it answers.</p>
      </div>
      <div class="card method">
        <span class="m-num">02</span>
        <b>Reason in Bangla, write in English</b>
        <p>Every theory has a fluent Bangla explanation that keeps the economic and
        theoretical terminology in English, marked in gold. You think in the language you
        think in, while the exact words you will have to put on the script stay in front of
        you. Press <kbd>L</kbd> to switch.</p>
      </div>
      <div class="card method">
        <span class="m-num">03</span>
        <b>Retrieval, not rereading</b>
        <p>Rereading feels like learning and mostly is not. Every theory carries recall
        cards, and every answered question becomes one automatically. You grade yourself four
        ways; the scheduler brings back what you fumbled and leaves alone what you know.</p>
      </div>
      <div class="card method">
        <span class="m-num">04</span>
        <b>Ranked by marks at stake</b>
        <p>The Study Plan scores each chapter by the marks the archive suggests it is worth —
        weighted for recurrence and recency — then subtracts how ready you already are. What
        remains is the marks still on the table, and that is the order to work
        in.${top ? ` Right now that puts <b>${esc(top.chapter.title)}</b> first.` : ''}</p>
      </div>
    </div>
  </section>`;

  const session = `<section class="reveal">
    <h2>A session, end to end</h2>
    <div class="card">
      <ol class="steps">
        <li><b>Clear what is due.</b> Open <a href="#/recall">Active Recall</a> and work through
          the queue. Ten minutes, and it is the highest-value ten minutes available.</li>
        <li><b>Check the ranking.</b> <a href="#/plan">Study Plan</a> tells you which chapter has
          the most marks still uncovered. Take the top one.</li>
        <li><b>Read the theory.</b> Press <kbd>F</kbd> for reading mode — the app gets out of the
          way and leaves one column of serif on a warm page. Grade your grasp at the end.</li>
        <li><b>Read the questions beside it.</b> The theory page lists every past-year question
          on that chapter, with the model answer and its marking scheme.</li>
        <li><b>Sit a mission.</b> <a href="#/path">The Path</a> puts an in-course after every
          fourth chapter, a midterm at the halfway mark and the final at the end. Write under
          time, then mark yourself honestly against the scheme — that step is where the
          learning is.</li>
      </ol>
    </div>
  </section>`;

  const rows = courses.map((c) => {
    const pct = c.stats.questions ? Math.round((c.stats.answered / c.stats.questions) * 100) : null;
    const cell = (n, label) => (n
      ? `<span class="tag">${n} ${label}</span>`
      : '<span class="muted" style="font-size:12px">—</span>');
    return `<tr>
      <td style="padding:9px 12px;white-space:nowrap"><b>${esc(c.code)}</b>
        <div class="muted" style="font-size:12px">${esc(c.title)}</div></td>
      <td style="padding:9px 12px">${cell(c.stats.chapters, 'chapters')}</td>
      <td style="padding:9px 12px">${cell(c.stats.theories, 'theories')}</td>
      <td style="padding:9px 12px">${c.stats.questions
        ? `<span class="tag">${c.stats.questions} questions</span>
           <span class="tag ${pct >= 50 ? 'beginner' : pct > 0 ? 'intermediate' : 'advanced'}">${pct}% answered</span>`
        : '<span class="muted" style="font-size:12px">—</span>'}</td>
      <td style="padding:9px 12px">${cell(c.stats.notes, 'notes')}</td>
    </tr>`;
  }).join('');

  const status = `<section class="reveal">
    <h2>Where the content stands</h2>
    <p class="sub" style="margin-bottom:14px">Built from the files themselves, so it is never out
      of date. The gaps are the honest to-do list.</p>
    <div class="card pad0" style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:13.5px">
        <thead><tr>
          ${['Course', 'Syllabus', 'Theories', 'Question bank', 'Notes'].map((h) =>
            `<th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);
              font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--fg-3)">${h}</th>`).join('')}
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p class="muted" style="font-size:12.5px;margin-top:10px">
      Archive spans <b>${esc(span)}</b> · ${totals.chapters} chapters mapped ·
      ${totals.theories} theories written (${readCount} read) ·
      ${totals.questions} questions (${totals.answered} with model answers) ·
      ${totals.cards} recall cards · ${totals.notes} notes
    </p>
  </section>`;

  const KEYS = [
    ['/', 'Search everything'], ['T', 'Cycle theme'], ['L', 'Bangla ⇄ English'],
    ['F', 'Reading mode'], ['+ −', 'Reading type size'], ['A', 'This page'],
    ['Esc', 'Close menu / search / reading'],
    ['G then H', 'Home'], ['G then P', 'Study Plan'], ['G then M', 'The Path'],
    ['G then Q', 'Question Bank'], ['G then R', 'Active Recall'], ['G then E', 'Mock Exam'],
    ['Space', 'Reveal a card'], ['1–4', 'Grade a card'],
  ];
  const shortcuts = `<section class="reveal">
    <h2>Shortcuts</h2>
    <div class="card"><div class="keygrid">
      ${KEYS.map(([k, v]) => `<div class="keyrow"><kbd>${esc(k)}</kbd><span>${esc(v)}</span></div>`).join('')}
    </div></div>
  </section>`;

  const priv = `<section class="reveal">
    <h2>Your data</h2>
    <div class="card">
      <p style="margin:0;font-size:14px">Nothing leaves this browser. Progress, XP, streaks, card
      scheduling and exam history all live in <code>localStorage</code> — there is no account and
      no server. Export a backup from <a href="#/progress">Progress</a> before you switch device
      or clear site data. ${state.exams.length ? `You have sat ${state.exams.length} mock
      exam${state.exams.length === 1 ? '' : 's'} so far.` : ''}</p>
    </div>
  </section>`;

  return head + method + session + status + shortcuts + priv;
}
