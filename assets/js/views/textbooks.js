import { getCourse, allCourses } from '../content.js';
import { esc } from '../util.js';
import { md } from '../markdown.js';
import { pageHead, empty, diffTag } from '../ui.js';

export default async function textbooks({ params }) {
  const scoped = params.cid ? await getCourse(params.cid) : null;
  const courses = scoped ? [scoped] : await allCourses();

  const head = pageHead({
    crumbs: scoped ? [{ label: 'Courses', href: '#/' }, { label: scoped.code, href: `#/c/${scoped.id}` }, { label: 'Textbooks' }]
                   : [{ label: 'Textbooks' }],
    title: 'Textbooks',
    sub: 'Prescribed and reference books, with their exercises wired into the matching theories.',
  });

  const blocks = courses.filter((c) => c.textbooks.length).map((c) => `
    <section style="margin-bottom:28px">
      <h2 style="margin-top:0"><a href="#/c/${esc(c.id)}">${esc(c.code)}</a> — ${esc(c.title)}</h2>
      <div class="grid g2">
        ${c.textbooks.map((b) => {
          const exs = c.exercises.filter((x) => x.textbookId === b.id);
          const solved = exs.filter((x) => x.solution).length;
          return `<div class="card">
            <div class="row" style="gap:6px">
              ${b.prescribed ? '<span class="tag accent">Prescribed</span>' : '<span class="tag">Reference</span>'}
              ${b.edition ? `<span class="tag">${esc(b.edition)} ed.</span>` : ''}
            </div>
            <h3 style="margin:9px 0 3px">${esc(b.title)}</h3>
            <p class="muted" style="margin:0 0 8px;font-size:13.5px">${esc(b.author || '')}${b.year ? ` · ${esc(b.year)}` : ''}</p>
            ${b.notes ? `<div class="prose" style="font-size:13.5px;max-width:none">${md(b.notes)}</div>` : ''}
            ${b.chaptersCovered ? `<p class="muted" style="font-size:12.5px;margin:6px 0 0">Covers: ${esc(b.chaptersCovered)}</p>` : ''}
            <div class="mini"><span><b>${exs.length}</b> exercises indexed</span><span><b>${solved}</b> solved</span></div>
            <div class="row" style="margin-top:12px">
              ${b.file ? `<a class="btn sm" href="${esc(b.file)}" target="_blank" rel="noopener">📖 Open PDF</a>` : ''}
              ${b.url ? `<a class="btn sm" href="${esc(b.url)}" target="_blank" rel="noopener">🔗 Source</a>` : ''}
              ${exs.length ? `<a class="btn sm" href="#/c/${esc(c.id)}?ch=">📝 ${exs.length} exercises</a>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>

      ${c.exercises.length ? `<details style="margin-top:14px">
        <summary style="cursor:pointer;font-weight:650;color:var(--accent)">All ${c.exercises.length} indexed exercises for ${esc(c.code)}</summary>
        <div style="margin-top:12px">
          ${c.exercises.map((x) => {
            const th = c.theories.find((t) => (t.exerciseIds || []).includes(x.id));
            return `<details class="qcard">
              <summary><svg class="caret" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
                <div class="qtext">${esc(x.text || x.ref)}
                  <div class="qmeta">${x.ref ? `<span class="tag">${esc(x.ref)}</span>` : ''}${diffTag(x.difficulty)}
                  ${th ? `<span class="tag accent">${esc(th.title)}</span>` : ''}</div></div></summary>
              <div class="answer">${x.solution ? `<div class="prose">${md(x.solution)}</div>`
                : '<p class="muted">Solution not written yet.</p>'}
                ${th ? `<p style="margin-top:12px"><a class="btn sm" href="#/c/${esc(c.id)}/theory/${esc(th.id)}">Read the theory →</a></p>` : ''}
              </div></details>`;
          }).join('')}
        </div></details>` : ''}
    </section>`).join('');

  return head + (blocks || empty('No textbooks registered yet',
    'Add a <code>textbooks</code> array to a course JSON. Put PDFs in <code>content/textbooks/</code> and point <code>file</code> at them.'));
}
