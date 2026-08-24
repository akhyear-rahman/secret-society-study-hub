import { getCourse } from '../content.js';
import { esc, DIFFS, DIFF_LABEL } from '../util.js';
import { md } from '../markdown.js';
import { pageHead, empty, theoryRow, statCard, diffTag } from '../ui.js';
import { isRead, cardDue } from '../store.js';
import { setQuery } from '../router.js';

export default async function course({ params, query }) {
  const c = await getCourse(params.cid);
  const chapterFilter = query.ch || '';
  const diffFilter = query.d || '';
  const q = (query.s || '').toLowerCase();

  let theories = c.theories;
  if (chapterFilter) theories = theories.filter((t) => t.chapterId === chapterFilter);
  if (diffFilter) theories = theories.filter((t) => t.difficulty === diffFilter);
  if (q) theories = theories.filter((t) =>
    `${t.title} ${t.titleBn} ${(t.tags || []).join(' ')}`.toLowerCase().includes(q));

  const due = c.cards.filter((x) => cardDue(x.id)).length;
  const readN = c.theories.filter((t) => isRead(t.id)).length;

  const head = pageHead({
    crumbs: [{ label: 'Courses', href: '#/' }, { label: c.code }],
    title: c.title,
    titleBn: c.titleBn,
    sub: [c.code, c.credits ? `${c.credits} credits` : '', c.semester ? `Semester ${c.semester}` : '']
      .filter(Boolean).join(' · '),
    actions: `
      <a class="btn" href="#/c/${esc(c.id)}/questions">🗂️ Question bank</a>
      <a class="btn" href="#/c/${esc(c.id)}/recall">🧠 Recall${due ? ` (${due})` : ''}</a>
      <a class="btn primary" href="#/c/${esc(c.id)}/exam">🎯 Mock exam</a>`,
  });

  // A course counts as empty only when it has no syllabus either — a chapter
  // list or imported notes are already worth showing.
  if (!c.chapters.length && !c.stats.theories && !c.stats.questions && !c.stats.notes) {
    return head + (c.description
      ? `<div class="card"><div class="prose" style="max-width:none">${md(c.description)}</div></div>`
      : empty('This course has no content yet',
          `Create <code>content/courses/${esc(c.id)}.json</code> — copy the template from <code>content/courses/_template.json</code>.`,
          '<a class="btn primary" href="#/help" style="margin-top:14px">Authoring guide</a>'));
  }

  const sampleWarning = c.sampleContent ? `<div class="card" style="border-color:var(--warn);background:var(--warn-soft);margin-bottom:18px">
    <b>⚠ Contains seeded practice content, not real past papers.</b>
    <p style="margin:6px 0 0;font-size:13.5px">The questions in this course were written to demonstrate the
    format and to give you something to practise against — the years and batches on them are invented.
    Replace them with your actual past papers, then delete <code>"sampleContent": true</code> from
    <code>${esc(c.id)}.json</code> to remove this banner.</p></div>` : '';

  const overview = `<div class="grid g4" style="margin-bottom:20px">
    ${statCard(`${readN}/${c.stats.theories}`, 'theories read')}
    ${statCard(c.stats.questions, 'past questions', `${c.stats.answered} answered`)}
    ${statCard(due, 'cards due')}
    ${statCard(c.stats.chapters, 'chapters')}
    ${statCard(c.stats.notes, 'notes')}
    ${statCard(c.stats.years.length ? `${Math.min(...c.stats.years)}–${Math.max(...c.stats.years)}` : '—', 'years covered')}
  </div>`;

  const desc = c.description
    ? `<div class="card" style="margin-bottom:20px"><div class="prose" style="max-width:none">${md(c.description)}</div></div>` : '';

  const pattern = c.examPattern ? `<div class="card" style="margin-bottom:20px">
    <h3 style="margin-top:0">Exam pattern</h3>
    <div class="prose" style="max-width:none;font-size:14.5px">${md(c.examPattern.notes || '')}</div>
    ${c.examPattern.sections ? `<table class="pattern" style="width:100%;border-collapse:collapse;font-size:13.5px;margin-top:10px">
      <thead><tr><th style="text-align:left;padding:6px;border-bottom:1px solid var(--line)">Section</th>
      <th style="text-align:left;padding:6px;border-bottom:1px solid var(--line)">Answer</th>
      <th style="text-align:left;padding:6px;border-bottom:1px solid var(--line)">Marks each</th></tr></thead>
      <tbody>${c.examPattern.sections.map((s) => `<tr>
        <td style="padding:6px">${esc(s.name)}</td>
        <td style="padding:6px">${esc(s.answer ?? '')} of ${esc(s.outOf ?? '')}</td>
        <td style="padding:6px">${esc(s.marks ?? '')}</td></tr>`).join('')}</tbody></table>` : ''}
  </div>` : '';

  // Syllabus map — shown whenever chapters carry a reading reference,
  // an instructor or a summary, which is what makes it worth a table.
  const hasSyllabusDetail = c.chapters.some((ch) => ch.ref || ch.instructor || ch.summary);
  const anyInstructor = c.chapters.some((ch) => ch.instructor);
  const syllabus = hasSyllabusDetail ? `<section style="margin-bottom:22px">
    <h2 style="margin-top:0">Syllabus map</h2>
    <div class="card pad0" style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:13.5px">
        <thead><tr>
          <th style="text-align:left;padding:9px 12px;border-bottom:1px solid var(--line);width:1%">#</th>
          <th style="text-align:left;padding:9px 12px;border-bottom:1px solid var(--line)">Chapter / topic</th>
          <th style="text-align:left;padding:9px 12px;border-bottom:1px solid var(--line)">Reading</th>
          ${anyInstructor ? '<th style="text-align:left;padding:9px 12px;border-bottom:1px solid var(--line)">By</th>' : ''}
          <th style="text-align:left;padding:9px 12px;border-bottom:1px solid var(--line);width:1%">Content</th>
        </tr></thead>
        <tbody>${c.chapters.map((ch) => {
          const nT = c.theories.filter((t) => t.chapterId === ch.id).length;
          const nQ = c.questions.filter((q) => q.chapterId === ch.id).length;
          const nN = c.notes.filter((n) => n.chapterId === ch.id).length;
          return `<tr style="border-bottom:1px solid var(--line)">
            <td style="padding:9px 12px;color:var(--fg-3);font-family:var(--mono)">${esc(ch.no ?? '')}</td>
            <td style="padding:9px 12px">
              <a href="#/c/${esc(c.id)}?ch=${esc(ch.id)}"><b>${esc(ch.title)}</b></a>
              ${ch.titleBn ? `<div style="font-family:var(--bangla);color:var(--fg-3);font-size:12.5px">${esc(ch.titleBn)}</div>` : ''}
              ${ch.summary ? `<div class="muted" style="font-size:12.5px;margin-top:3px">${esc(ch.summary)}</div>` : ''}
            </td>
            <td style="padding:9px 12px;color:var(--fg-2);white-space:nowrap">${esc(ch.ref || '—')}</td>
            ${anyInstructor ? `<td style="padding:9px 12px"><span class="tag">${esc(ch.instructor || '—')}</span></td>` : ''}
            <td style="padding:9px 12px;white-space:nowrap">
              ${nT ? `<span class="tag">${nT}&nbsp;th</span>` : ''}
              ${nQ ? `<span class="tag">${nQ}&nbsp;Q</span>` : ''}
              ${nN ? `<span class="tag">${nN}&nbsp;note</span>` : ''}
              ${!nT && !nQ && !nN ? '<span class="muted" style="font-size:12px">empty</span>' : ''}
            </td></tr>`;
        }).join('')}</tbody>
      </table>
    </div>
  </section>` : '';

  const chapterChips = `<div class="chipbar" style="margin-bottom:10px">
    <button class="chip${chapterFilter ? '' : ' on'}" data-ch="">All chapters</button>
    ${c.chapters.map((ch) => {
      const n = c.theories.filter((t) => t.chapterId === ch.id).length;
      return `<button class="chip${chapterFilter === ch.id ? ' on' : ''}" data-ch="${esc(ch.id)}">${esc(ch.no ? ch.no + '. ' : '')}${esc(ch.title)} <span class="muted">${n}</span></button>`;
    }).join('')}
  </div>`;

  const diffChips = `<div class="chipbar" style="margin-bottom:14px">
    <button class="chip${diffFilter ? '' : ' on'}" data-d="">Any level</button>
    ${DIFFS.map((d) => `<button class="chip${diffFilter === d ? ' on' : ''}" data-d="${d}">${DIFF_LABEL[d]}</button>`).join('')}
    <span class="count">${theories.length} theor${theories.length === 1 ? 'y' : 'ies'}</span>
  </div>`;

  const search = `<div class="filters"><span class="sel" style="flex:1;max-width:320px">
    <label>Find</label><input id="tsearch" type="search" placeholder="Filter theories…" value="${esc(query.s || '')}" style="flex:1;max-width:none">
  </span></div>`;

  const list = theories.length
    ? `<div class="grid g2">${theories.map((t) => theoryRow(t, c)).join('')}</div>`
    : c.theories.length
      ? empty('No theories match these filters')
      : empty('No theories written yet',
          `The syllabus is mapped out above — add entries to the <code>theories</code> array of
           <code>${esc(c.id)}.json</code> and they appear here, each one linked to its chapter.`,
          '<a class="btn primary" href="#/help" style="margin-top:14px">Authoring guide</a>');

  const theorySection = c.theories.length
    ? `<h2>Theories</h2>${search}${chapterChips}${diffChips}${list}`
    : `<h2>Theories</h2>${list}`;

  const html = head + sampleWarning + overview + desc + pattern + syllabus + theorySection;

  return {
    html,
    mount(root) {
      root.querySelectorAll('[data-ch]').forEach((b) =>
        b.addEventListener('click', () => setQuery({ ch: b.dataset.ch })));
      root.querySelectorAll('[data-d]').forEach((b) =>
        b.addEventListener('click', () => setQuery({ d: b.dataset.d })));
      const s = root.querySelector('#tsearch');
      if (s) {
        let t;
        s.addEventListener('input', () => {
          clearTimeout(t);
          t = setTimeout(() => setQuery({ s: s.value }), 220);
        });
      }
    },
  };
}
