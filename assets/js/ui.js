// Shared render helpers used by more than one view.

import { esc, stars, DIFF_LABEL, EXAM_LABEL } from './util.js';
import { md, mdInline, plain } from './markdown.js';
import { state, isRead, isBookmarked } from './store.js';

export const diffTag = (d) =>
  d ? `<span class="tag ${esc(d)}">${esc(DIFF_LABEL[d] || d)}</span>` : '';

export const marksTag = (m) =>
  m ? `<span class="tag marks">${esc(m)} marks</span>` : '';

export function pageHead({ crumbs = [], title, titleBn, sub, actions = '' }) {
  const cr = crumbs.length
    ? `<div class="crumbs">${crumbs.map((c, i) =>
        (i ? '<span class="sep">/</span>' : '') +
        (c.href ? `<a href="${esc(c.href)}">${esc(c.label)}</a>` : `<span>${esc(c.label)}</span>`)
      ).join('')}</div>` : '';
  return `<div class="page-head"><div class="spread"><div style="min-width:0">
    ${cr}
    <h1>${esc(title)}</h1>
    ${titleBn ? `<p class="sub" style="font-family:var(--bangla)">${esc(titleBn)}</p>` : ''}
    ${sub ? `<p class="sub">${esc(sub)}</p>` : ''}
  </div><div class="row">${actions}</div></div></div>`;
}

export const empty = (title, body = '', action = '') =>
  `<div class="empty"><h3>${esc(title)}</h3><p>${body}</p>${action}</div>`;

/**
 * A past-year question rendered as a collapsible card with its model answer.
 * @param {object} q     question record
 * @param {object} opts  { open, courseCode, showTheoryLink, chapterTitle }
 */
export function questionCard(q, opts = {}) {
  const open = opts.open ?? state.settings.showAnswers;
  const meta = [
    q.qNo ? `<span class="tag">Q ${esc(q.qNo)}</span>` : '',
    q.examType ? `<span class="tag">${esc(EXAM_LABEL[q.examType] || q.examType)}</span>` : '',
    q.year ? `<span class="tag">${esc(q.year)}</span>` : '',
    q.batch ? `<span class="tag">Batch ${esc(q.batch)}</span>` : '',
    marksTag(q.marks),
    diffTag(q.difficulty),
    (q.repeats && q.repeats.length)
      ? `<span class="tag accent" title="Also appeared in ${esc(q.repeats.join(', '))}">↻ repeated ×${q.repeats.length + 1}</span>` : '',
    opts.chapterTitle ? `<span class="tag">${esc(opts.chapterTitle)}</span>` : '',
  ].filter(Boolean).join('');

  const scheme = (q.answerPoints && q.answerPoints.length)
    ? `<div class="scheme"><b>How marks are awarded</b><ul>${
        q.answerPoints.map((p) => `<li>${md(p).replace(/^<p>|<\/p>$/g, '')}</li>`).join('')}</ul></div>`
    : '';

  const body = q.answer
    ? `<div class="answer">
        <div class="ansbar">
          <span class="tag accent">Model answer</span>
          ${q.sameAsLabel
            ? `<span class="tag" title="The same question, answered once and shared">↻ also set ${esc(q.sameAsLabel)}</span>`
            : ''}
          ${q.answerBn ? '<button class="btn sm ans-lang" data-q="' + esc(q.id) + '">বাংলায় দেখুন</button>' : ''}
          <span class="muted" style="font-size:12px">${esc(plain(q.answer, 0).split(/\s+/).length)} words</span>
        </div>
        ${scheme}
        <div class="prose ans-body" data-lang="en">${md(q.answer)}</div>
        ${q.answerBn ? `<div class="prose bn ans-body" data-lang="bn" hidden>${md(q.answerBn)}</div>` : ''}
        ${q.source ? `<p class="ans-source">Source — ${esc(q.source)}</p>` : ''}
        ${(q.theoryIds || []).length && opts.showTheoryLink !== false
          ? `<p class="muted" style="font-size:12.5px;margin-top:14px">Theory: ${
              (q.theoryIds).map((t) => `<a href="#/c/${esc(q.courseId)}/theory/${esc(t)}">${esc(t)}</a>`).join(', ')}</p>`
          : ''}
      </div>`
    : `<div class="answer"><div class="empty" style="padding:20px">
         <h3>No model answer yet</h3>
         <p>Add one to <code>content/courses/${esc(q.courseId)}.json</code> under this question's <code>answer</code> field.</p>
       </div></div>`;

  return `<details class="qcard" id="q-${esc(q.id)}"${open ? ' open' : ''}>
    <summary>
      <svg class="caret" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>
      <div class="qtext">${mdInline(q.text)}
        <div class="qmeta">${meta}</div>
      </div>
    </summary>${body}
  </details>`;
}

export function theoryRow(t, course) {
  const ch = course.chapterById.get(t.chapterId);
  return `<a class="card" href="#/c/${esc(course.id)}/theory/${esc(t.id)}">
    <div class="row" style="gap:7px">
      ${diffTag(t.difficulty)}
      ${t.importance ? `<span class="stars" title="Exam importance">${stars(t.importance)}</span>` : ''}
      ${isRead(t.id) ? '<span class="tag" style="margin-left:auto">✓ read</span>' : ''}
      ${isBookmarked('theory:' + t.id) ? '<span class="tag">🔖</span>' : ''}
    </div>
    <h3 style="margin:8px 0 3px">${esc(t.title)}</h3>
    ${t.titleBn ? `<p class="bn" style="font-family:var(--bangla);color:var(--fg-2);margin:0 0 8px;font-size:13.5px">${esc(t.titleBn)}</p>` : ''}
    <p class="muted" style="font-size:13px;margin:0">${esc(plain(t.en || t.bn, 130))}</p>
    <div class="mini">
      ${ch ? `<span>${esc(ch.title)}</span>` : ''}
      <span><b>${t.questions.length}</b> PYQ</span>
      ${t.exerciseList.length ? `<span><b>${t.exerciseList.length}</b> exercises</span>` : ''}
      ${(t.recall || []).length ? `<span><b>${t.recall.length}</b> cards</span>` : ''}
    </div>
  </a>`;
}

export function selectEl(label, name, options, value) {
  return `<span class="sel"><label for="f-${name}">${esc(label)}</label>
    <select id="f-${name}" name="${esc(name)}">
      ${options.map((o) => {
        const v = typeof o === 'object' ? o.value : o;
        const l = typeof o === 'object' ? o.label : o;
        return `<option value="${esc(v)}"${String(v) === String(value ?? '') ? ' selected' : ''}>${esc(l)}</option>`;
      }).join('')}
    </select></span>`;
}

export function statCard(value, label, hint = '') {
  // Plain integers animate up on mount; anything else (ratios, dashes,
  // year spans) is printed as given.
  const n = Number(value);
  const countable = Number.isInteger(n) && String(value).trim() === String(n);
  // The real figure is rendered up front and the animation counts up to it.
  // If frames never arrive, the correct number is already on screen.
  return `<div class="stat"><b${countable ? ` data-count="${n}"` : ''}>${esc(value)}</b><small>${esc(label)}</small>
    ${hint ? `<div class="muted" style="font-size:11.5px;margin-top:4px">${esc(hint)}</div>` : ''}</div>`;
}

/** Wire the per-answer Bangla/English switch inside question cards. */
export function bindAnswerLangToggles(root = document) {
  root.querySelectorAll('.ans-lang').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const card = btn.closest('.qcard');
      const en = card.querySelector('.ans-body[data-lang="en"]');
      const bn = card.querySelector('.ans-body[data-lang="bn"]');
      const showBn = en.hidden === false;
      en.hidden = showBn; bn.hidden = !showBn;
      btn.textContent = showBn ? 'Show in English' : 'বাংলায় দেখুন';
    });
  });
}
