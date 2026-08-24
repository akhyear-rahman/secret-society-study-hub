import { allCourses } from '../content.js';
import { esc, fmtTime, sum, todayKey, clamp } from '../util.js';
import { pageHead, statCard, empty } from '../ui.js';
import { state, BADGES, liveStreak, cardMastery, isRead, exportData, importData, resetAll } from '../store.js';

export default async function progress() {
  const courses = await allCourses();
  const allCards = courses.flatMap((c) => c.cards);
  const reviewed = allCards.filter((c) => state.srs[c.id]);
  const mastered = allCards.filter((c) => cardMastery(c.id) >= 0.8);
  const readTotal = courses.flatMap((c) => c.theories).filter((t) => isRead(t.id)).length;
  const theoryTotal = sum(courses.map((c) => c.stats.theories));

  /* ---- 12-week activity heat strip ---- */
  const days = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    days.push({ k, xp: state.days[k]?.xp || 0 });
  }
  const maxXp = Math.max(30, ...days.map((d) => d.xp));
  // Opacity rather than color-mix: the accent square sits on the page
  // background, so it reads correctly in both themes without mixing.
  const heat = `<div style="display:grid;grid-template-rows:repeat(7,11px);grid-auto-flow:column;gap:3px;overflow-x:auto;padding:4px 0">
    ${days.map((d) => {
      const a = d.xp ? 0.25 + 0.75 * clamp(d.xp / maxXp, 0, 1) : 0;
      return `<span title="${d.k}: ${d.xp} XP" style="width:11px;height:11px;border-radius:3px;
        background:${a ? 'var(--accent)' : 'var(--bg-3)'};opacity:${a || 1};
        border:1px solid var(--line)"></span>`;
    }).join('')}
  </div>`;

  /* ---- per-course mastery ---- */
  const courseRows = courses.map((c) => {
    const read = c.theories.filter((t) => isRead(t.id)).length;
    const m = c.cards.length ? sum(c.cards.map((x) => cardMastery(x.id))) / c.cards.length : 0;
    const answeredPct = c.stats.questions ? Math.round((c.stats.answered / c.stats.questions) * 100) : 0;
    return `<div class="card">
      <div class="spread"><b>${esc(c.code)}</b><span class="muted" style="font-size:12.5px">${esc(c.title)}</span></div>
      <div style="margin-top:10px;font-size:12.5px;color:var(--fg-3)">Theories read — ${read}/${c.stats.theories}</div>
      <div class="bar"><span style="width:${c.stats.theories ? (read / c.stats.theories) * 100 : 0}%"></span></div>
      <div style="margin-top:8px;font-size:12.5px;color:var(--fg-3)">Card mastery — ${Math.round(m * 100)}%</div>
      <div class="bar"><span style="width:${m * 100}%"></span></div>
      <div style="margin-top:8px;font-size:12.5px;color:var(--fg-3)">Question bank coverage — ${answeredPct}% have model answers</div>
      <div class="bar"><span style="width:${answeredPct}%"></span></div>
    </div>`;
  }).join('');

  /* ---- weakest chapters ---- */
  const weak = [];
  for (const c of courses) {
    for (const ch of c.chapters) {
      const cards = c.cards.filter((x) => x.chapterId === ch.id);
      if (cards.length < 2) continue;
      const m = sum(cards.map((x) => cardMastery(x.id))) / cards.length;
      weak.push({ course: c, ch, m, n: cards.length });
    }
  }
  weak.sort((a, b) => a.m - b.m);
  const weakList = weak.slice(0, 6).map((w) => `<a class="rail-item" href="#/c/${esc(w.course.id)}/recall?ch=${esc(w.ch.id)}&mode=all"
      style="display:flex;gap:10px;align-items:center;border:1px solid var(--line);border-radius:9px;margin-bottom:8px;padding:10px 12px">
      <span style="flex:1"><b>${esc(w.ch.title)}</b><br><span class="muted" style="font-size:12px">${esc(w.course.code)} · ${w.n} cards</span></span>
      <span class="tag ${w.m < 0.34 ? 'advanced' : w.m < 0.67 ? 'intermediate' : 'beginner'}">${Math.round(w.m * 100)}%</span>
    </a>`).join('');

  const badges = `<div class="badgegrid">${BADGES.map((b) => {
    const got = state.badges.includes(b.id);
    return `<div class="badge${got ? '' : ' locked'}" title="${esc(b.hint)}">
      <span class="em">${b.em}</span><b>${esc(b.name)}</b><small>${esc(b.hint)}</small></div>`;
  }).join('')}</div>`;

  const exams = state.exams.length ? `<div class="card pad0" style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:13.5px">
      <thead><tr>${['Date', 'Paper', 'Score', '%', 'Time'].map((h) =>
        `<th style="text-align:left;padding:9px 12px;border-bottom:1px solid var(--line)">${h}</th>`).join('')}</tr></thead>
      <tbody>${state.exams.map((e) => {
        const pct = e.total ? Math.round((e.score / e.total) * 100) : 0;
        return `<tr><td style="padding:9px 12px">${new Date(e.date).toLocaleDateString()}</td>
          <td style="padding:9px 12px">${esc(e.title || e.courseId)}</td>
          <td style="padding:9px 12px">${e.score}/${e.total}</td>
          <td style="padding:9px 12px"><span class="tag ${pct >= 80 ? 'beginner' : pct >= 50 ? 'intermediate' : 'advanced'}">${pct}%</span></td>
          <td style="padding:9px 12px">${fmtTime(e.seconds)}</td></tr>`;
      }).join('')}</tbody></table></div>` : empty('No mock exams yet', 'Sit one from the <a href="#/exam">Mock Exam</a> tab.');

  const html = pageHead({ crumbs: [{ label: 'Progress' }], title: 'Progress',
    sub: 'Everything here lives in this browser only — export it before switching devices.' }) + `
    <div class="grid g4" style="margin-bottom:22px">
      ${statCard(liveStreak(), 'day streak', `best ${state.streak.best || 0}`)}
      ${statCard(state.xp, 'total xp')}
      ${statCard(`${readTotal}/${theoryTotal}`, 'theories read')}
      ${statCard(reviewed.length, 'cards reviewed')}
      ${statCard(mastered.length, 'cards mastered')}
      ${statCard(state.exams.length, 'mock exams')}
    </div>

    <h2>Last 12 weeks</h2>
    <div class="card">${heat}
      <p class="muted" style="font-size:12px;margin:8px 0 0">Each square is a day; darker means more XP earned.</p></div>

    <h2>By course</h2>
    <div class="grid g2">${courseRows || empty('No courses loaded')}</div>

    ${weakList ? `<h2>Weakest chapters — drill these first</h2><div>${weakList}</div>` : ''}

    <h2>Badges <span class="muted" style="font-size:13px;font-weight:400">${state.badges.length} of ${BADGES.length}</span></h2>
    ${badges}

    <h2>Mock exam history</h2>
    ${exams}

    <h2>Your data</h2>
    <div class="card">
      <p style="margin-top:0;font-size:13.5px">Progress is stored in this browser's <code>localStorage</code>. Export a backup before you clear site data or move device.</p>
      <div class="row">
        <button class="btn" id="exportBtn">⬇ Export backup</button>
        <label class="btn" style="cursor:pointer">⬆ Import backup
          <input type="file" id="importFile" accept="application/json" hidden></label>
        <button class="btn" id="resetBtn" style="border-color:var(--bad);color:var(--bad)">Reset all progress</button>
      </div>
    </div>`;

  return {
    html,
    mount(root) {
      root.querySelector('#exportBtn')?.addEventListener('click', () => {
        const blob = new Blob([exportData()], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `study-hub-progress-${todayKey()}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
      root.querySelector('#importFile')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try { importData(await file.text()); location.reload(); }
        catch { alert('That file is not a valid backup.'); }
      });
      root.querySelector('#resetBtn')?.addEventListener('click', () => {
        if (confirm('Erase all XP, streaks, card scheduling and exam history? This cannot be undone.')) {
          resetAll(); location.reload();
        }
      });
    },
  };
}
