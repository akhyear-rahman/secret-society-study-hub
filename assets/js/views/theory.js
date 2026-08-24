import { getCourse } from '../content.js';
import { esc, stars, EXAM_LABEL } from '../util.js';
import { mdWithToc, md, plain } from '../markdown.js';
import { pageHead, empty, diffTag, marksTag, questionCard, bindAnswerLangToggles } from '../ui.js';
import { state, setSetting, markTheoryRead, isRead, toggleBookmark, isBookmarked } from '../store.js';
import { setQuery, go } from '../router.js';

export default async function theory({ params, query }) {
  const c = await getCourse(params.cid);
  const t = c.theoryById.get(params.tid);
  if (!t) {
    return pageHead({ crumbs: [{ label: c.code, href: `#/c/${c.id}` }], title: 'Theory not found' })
      + empty('No theory with that id', `Looked for <code>${esc(params.tid)}</code> in <code>${esc(c.id)}.json</code>.`);
  }

  const ch = c.chapterById.get(t.chapterId);
  const lang = query.lang || state.settings.lang;          // bn | en
  const withQ = query.qs ? query.qs !== '0' : state.settings.showQuestions;

  const source = lang === 'bn' ? (t.bn || t.en) : (t.en || t.bn);
  const usingFallback = lang === 'bn' ? !t.bn : !t.en;
  const { body, headings } = mdWithToc(source);

  const idxInCourse = c.theories.indexOf(t);
  const prev = c.theories[idxInCourse - 1];
  const next = c.theories[idxInCourse + 1];

  const head = pageHead({
    crumbs: [
      { label: 'Courses', href: '#/' },
      { label: c.code, href: `#/c/${c.id}` },
      ...(ch ? [{ label: ch.title, href: `#/c/${c.id}?ch=${encodeURIComponent(ch.id)}` }] : []),
      { label: 'Theory' },
    ],
    title: t.title,
    titleBn: t.titleBn,
    sub: [
      t.importance ? `Exam importance ${stars(t.importance)}` : '',
      `${t.questions.length} past-year question${t.questions.length === 1 ? '' : 's'}`,
      t.exerciseList.length ? `${t.exerciseList.length} textbook exercise${t.exerciseList.length === 1 ? '' : 's'}` : '',
    ].filter(Boolean).join(' · '),
    actions: `
      <div class="pill" role="group" aria-label="Explanation language">
        <button class="lang-a${lang === 'bn' ? ' on' : ''}" data-lang="bn" style="${lang === 'bn' ? 'background:var(--accent);color:var(--accent-fg)' : ''}">বাংলা</button>
        <button class="lang-b${lang === 'en' ? ' on' : ''}" data-lang="en" style="${lang === 'en' ? 'background:var(--accent);color:var(--accent-fg)' : ''}">English</button>
      </div>
      <button class="btn sm" id="toggleQs">${withQ ? '📕 Theory only' : '📑 Show questions'}</button>
      <button class="btn sm" id="bmBtn">${isBookmarked('theory:' + t.id) ? '🔖 Saved' : '🔖 Save'}</button>`,
  });

  const meta = `<div class="row" style="margin:-8px 0 16px">
    ${diffTag(t.difficulty)}
    ${ch ? `<span class="tag">${esc(ch.no ? 'Ch ' + ch.no + ' · ' : '')}${esc(ch.title)}</span>` : ''}
    ${(t.tags || []).map((x) => `<span class="tag">#${esc(x)}</span>`).join('')}
    ${isRead(t.id) ? '<span class="tag beginner">✓ marked read</span>' : ''}
  </div>`;

  const fallbackNote = usingFallback && source
    ? `<div class="card" style="border-color:var(--warn);background:var(--warn-soft);margin-bottom:16px;font-size:13.5px">
         ${lang === 'bn'
           ? 'বাংলা ব্যাখ্যা এখনো লেখা হয়নি — ইংরেজি সংস্করণ দেখানো হচ্ছে। JSON-এ এই theory-র <code>bn</code> ফিল্ডে লিখুন।'
           : 'No English version yet — showing the Bangla explanation. Add an <code>en</code> field for this theory.'}
       </div>` : '';

  const article = source
    ? `<article class="prose${lang === 'bn' ? ' bn' : ''}" id="theoryBody">${body}</article>`
    : empty('This theory has no explanation yet',
        `Add <code>bn</code> and/or <code>en</code> markdown to theory <code>${esc(t.id)}</code>.`);

  const formulas = (t.formulas && t.formulas.length) ? `
    <section class="card" style="margin-top:22px">
      <h3 style="margin-top:0">Formula sheet</h3>
      <div class="prose" style="max-width:none">${t.formulas.map((f) => `<pre><code>${esc(f)}</code></pre>`).join('')}</div>
    </section>` : '';

  const exercises = t.exerciseList.length ? `
    <section style="margin-top:26px">
      <h2>Textbook exercises</h2>
      ${t.exerciseList.map((x) => {
        const bk = c.textbooks.find((b) => b.id === x.textbookId);
        return `<details class="qcard">
          <summary><svg class="caret" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
            <div class="qtext">${esc(x.text || x.ref)}
              <div class="qmeta">
                ${x.ref ? `<span class="tag">${esc(x.ref)}</span>` : ''}
                ${bk ? `<span class="tag">${esc(bk.title)}</span>` : ''}
                ${diffTag(x.difficulty)}
              </div></div></summary>
          <div class="answer">${x.solution
            ? `<div class="prose">${md(x.solution)}</div>`
            : '<p class="muted">Solution not written yet.</p>'}</div>
        </details>`;
      }).join('')}
    </section>` : '';

  const questions = withQ && t.questions.length ? `
    <section style="margin-top:26px">
      <h2>Past-year questions on this theory</h2>
      <p class="sub" style="margin-bottom:14px">Sorted newest first. Each answer is written to score the full marks allotted.</p>
      ${t.questions.map((q) => questionCard(q, {
        chapterTitle: c.chapterById.get(q.chapterId)?.title,
        showTheoryLink: false,
      })).join('')}
    </section>` : '';

  /* ------------------------------------------------------------- rail --- */
  const toc = headings.length ? `<div class="rail-card">
    <div class="rail-head">On this page</div>
    <div class="rail-body toc">${headings.map((h) =>
      `<a href="#${esc(h.id)}" class="lvl${h.level}">${esc(h.text)}</a>`).join('')}</div>
  </div>` : '';

  const keyterms = (t.keyTerms && t.keyTerms.length) ? `<div class="rail-card">
    <div class="rail-head">Key terminology <span class="n">${t.keyTerms.length}</span></div>
    <div class="rail-body keyterms" style="padding:0">
      ${t.keyTerms.map((k) => `<div class="keyterm">
        <b>${esc(k.en)}</b>${k.bn ? `<i>${esc(k.bn)}</i>` : ''}
        ${k.def ? `<p>${esc(k.def)}</p>` : ''}</div>`).join('')}
    </div></div>` : '';

  const qrail = t.questions.length ? `<div class="rail-card">
    <div class="rail-head">Past questions <span class="n">${t.questions.length}</span></div>
    <div class="rail-body">
      ${t.questions.map((q) => `<a class="rail-item" href="#q-${esc(q.id)}">
        ${esc(plain(q.text, 90))}
        <div class="meta">${marksTag(q.marks)}${q.year ? `<span class="tag">${esc(q.year)}</span>` : ''}
        ${q.examType ? `<span class="tag">${esc(EXAM_LABEL[q.examType] || q.examType)}</span>` : ''}</div>
      </a>`).join('')}
    </div></div>` : '';

  const exrail = t.exerciseList.length ? `<div class="rail-card">
    <div class="rail-head">Textbook exercises <span class="n">${t.exerciseList.length}</span></div>
    <div class="rail-body">${t.exerciseList.map((x) =>
      `<div class="rail-item">${esc(x.ref || plain(x.text, 70))}</div>`).join('')}</div></div>` : '';

  const readCard = `<div class="rail-card"><div class="rail-head">Mark your grasp</div>
    <div class="rail-body">
      <div class="row" style="gap:6px">
        ${[['0', '🙁 Not yet'], ['1', '😐 Shaky'], ['2', '🙂 Solid'], ['3', '🤩 Nailed it']]
          .map(([v, l]) => `<button class="btn sm conf" data-conf="${v}"${
            state.theory[t.id]?.confidence === Number(v) ? ' style="border-color:var(--accent);color:var(--accent)"' : ''
          }>${l}</button>`).join('')}
      </div>
      ${(t.recall || []).length
        ? `<a class="btn sm wide" style="margin-top:10px" href="#/c/${esc(c.id)}/recall?theory=${esc(t.id)}">🧠 Drill ${t.recall.length} recall card${t.recall.length === 1 ? '' : 's'}</a>` : ''}
    </div></div>`;

  const nav = `<div class="rail-card"><div class="rail-head">Chapter navigation</div><div class="rail-body">
    ${prev ? `<a class="rail-item" href="#/c/${esc(c.id)}/theory/${esc(prev.id)}">← ${esc(prev.title)}</a>` : ''}
    ${next ? `<a class="rail-item" href="#/c/${esc(c.id)}/theory/${esc(next.id)}">${esc(next.title)} →</a>` : ''}
    <a class="rail-item" href="#/c/${esc(c.id)}">All theories in ${esc(c.code)}</a>
  </div></div>`;

  const rail = [toc, keyterms, qrail, exrail, readCard, nav].filter(Boolean).join('');
  const html = `${head}${meta}${fallbackNote}
    <div class="reader${rail ? '' : ' solo'}">
      <div>${article}${formulas}${exercises}${questions}
        <div class="row" style="margin-top:30px;justify-content:space-between">
          ${prev ? `<a class="btn" href="#/c/${esc(c.id)}/theory/${esc(prev.id)}">← Previous</a>` : '<span></span>'}
          ${next ? `<a class="btn" href="#/c/${esc(c.id)}/theory/${esc(next.id)}">Next →</a>` : '<span></span>'}
        </div>
      </div>
      ${rail ? `<aside class="rail">${rail}</aside>` : ''}
    </div>`;

  return {
    html,
    mount(root) {
      root.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => {
        setSetting('lang', b.dataset.lang);
        setQuery({ lang: b.dataset.lang });
      }));
      root.querySelector('#toggleQs')?.addEventListener('click', () => {
        setSetting('showQuestions', !withQ);
        setQuery({ qs: withQ ? '0' : '1' });
      });
      root.querySelector('#bmBtn')?.addEventListener('click', (e) => {
        const on = toggleBookmark('theory:' + t.id);
        e.currentTarget.textContent = on ? '🔖 Saved' : '🔖 Save';
      });
      root.querySelectorAll('.conf').forEach((b) => b.addEventListener('click', () => {
        markTheoryRead(t.id, Number(b.dataset.conf));
        root.querySelectorAll('.conf').forEach((x) => x.removeAttribute('style'));
        b.style.borderColor = 'var(--accent)'; b.style.color = 'var(--accent)';
      }));
      bindAnswerLangToggles(root);

      // Reading a theory for ~20s counts as read.
      const timer = setTimeout(() => { if (!isRead(t.id)) markTheoryRead(t.id); }, 20000);
      return () => clearTimeout(timer);
    },
  };
}
