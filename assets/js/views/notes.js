import { getCourse, allCourses } from '../content.js';
import { esc } from '../util.js';
import { md, mdWithToc, plain } from '../markdown.js';
import { pageHead, empty, selectEl } from '../ui.js';
import { setQuery } from '../router.js';

export default async function notes({ params, query }) {
  const scoped = params.cid ? await getCourse(params.cid) : null;
  const courses = scoped ? [scoped] : await allCourses();
  const courseById = new Map(courses.map((c) => [c.id, c]));

  /* ---- single note reader ---- */
  if (params.nid) {
    const c = scoped;
    const n = c.notes.find((x) => x.id === params.nid);
    if (!n) return empty('Note not found');
    const { body, headings } = mdWithToc(n.body || '');
    const ch = c.chapterById.get(n.chapterId);
    const linked = (n.theoryIds || []).map((id) => c.theoryById.get(id)).filter(Boolean);

    const rail = [
      headings.length ? `<div class="rail-card"><div class="rail-head">On this page</div>
        <div class="rail-body toc">${headings.map((h) => `<a href="#${esc(h.id)}" class="lvl${h.level}">${esc(h.text)}</a>`).join('')}</div></div>` : '',
      linked.length ? `<div class="rail-card"><div class="rail-head">Theories covered <span class="n">${linked.length}</span></div>
        <div class="rail-body">${linked.map((t) => `<a class="rail-item" href="#/c/${esc(c.id)}/theory/${esc(t.id)}">${esc(t.title)}</a>`).join('')}</div></div>` : '',
      n.file ? `<div class="rail-card"><div class="rail-head">Attachment</div><div class="rail-body">
        <a class="btn sm wide" href="${esc(n.file)}" target="_blank" rel="noopener">📎 Open original file</a></div></div>` : '',
    ].filter(Boolean).join('');

    return pageHead({
      crumbs: [{ label: 'Courses', href: '#/' }, { label: c.code, href: `#/c/${c.id}` },
               { label: 'Notes', href: `#/c/${c.id}/notes` }, { label: n.title }],
      title: n.title,
      sub: [n.date, n.source, ch?.title].filter(Boolean).join(' · '),
    }) + `<div class="reader${rail ? '' : ' solo'}">
      <article class="prose">${body || '<p class="muted">This note is empty.</p>'}</article>
      ${rail ? `<aside class="rail">${rail}</aside>` : ''}</div>`;
  }

  /* ---- note list ---- */
  const courseFilter = scoped ? scoped.id : (query.course || '');
  let list = courses.flatMap((c) => c.notes);
  if (courseFilter) list = list.filter((n) => n.courseId === courseFilter);
  if (query.ch) list = list.filter((n) => n.chapterId === query.ch);
  if (query.s) {
    const s = query.s.toLowerCase();
    list = list.filter((n) => `${n.title} ${n.body}`.toLowerCase().includes(s));
  }
  list = list.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

  const chapters = courseFilter ? (courseById.get(courseFilter)?.chapters || []) : [];

  const filters = `<div class="filters">
    ${scoped ? '' : selectEl('Course', 'course',
      [{ value: '', label: 'All courses' }].concat(courses.map((c) => ({ value: c.id, label: c.code || c.title }))), courseFilter)}
    ${chapters.length ? selectEl('Chapter', 'ch',
      [{ value: '', label: 'All chapters' }].concat(chapters.map((ch) => ({ value: ch.id, label: ch.title }))), query.ch || '') : ''}
    <span class="sel" style="flex:1;max-width:300px"><label for="nsearch">Find</label>
      <input id="nsearch" type="search" placeholder="Search notes…" value="${esc(query.s || '')}" style="flex:1;max-width:none"></span>
    <span class="count">${list.length} note${list.length === 1 ? '' : 's'}</span>
  </div>`;

  const cards = list.map((n) => {
    const c = courseById.get(n.courseId);
    const ch = c?.chapterById.get(n.chapterId);
    return `<a class="card" href="#/c/${esc(n.courseId)}/notes/${esc(n.id)}">
      <div class="row" style="gap:6px">
        <span class="tag">${esc(c?.code || n.courseId)}</span>
        ${ch ? `<span class="tag">${esc(ch.title)}</span>` : ''}
        ${n.source ? `<span class="tag">${esc(n.source)}</span>` : ''}
        ${n.date ? `<span class="muted" style="margin-left:auto;font-size:12px">${esc(n.date)}</span>` : ''}
      </div>
      <h3 style="margin:9px 0 5px">${esc(n.title)}</h3>
      <p class="muted" style="font-size:13px;margin:0">${esc(plain(n.body, 150))}</p>
      ${(n.theoryIds || []).length ? `<div class="mini"><span><b>${n.theoryIds.length}</b> linked theories</span></div>` : ''}
    </a>`;
  }).join('');

  const head = pageHead({
    crumbs: scoped ? [{ label: 'Courses', href: '#/' }, { label: scoped.code, href: `#/c/${scoped.id}` }, { label: 'Notes' }]
                   : [{ label: 'Notes' }],
    title: 'Lecture Notes',
    sub: 'Class notes, hand-outs and your own summaries — linked back to the theories they explain.',
  });

  return {
    html: head + filters + (list.length ? `<div class="grid g2">${cards}</div>`
      : empty('No notes yet', 'Add entries to the <code>notes</code> array of a course JSON, or drop a PDF in <code>content/files/</code> and link it.')),
    mount(root) {
      ['course', 'ch'].forEach((name) => {
        const el = root.querySelector(`#f-${name}`);
        el?.addEventListener('change', () => setQuery({ [name]: el.value, ...(name === 'course' ? { ch: '' } : {}) }));
      });
      const s = root.querySelector('#nsearch');
      let t;
      s?.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => setQuery({ s: s.value }), 220); });
    },
  };
}
