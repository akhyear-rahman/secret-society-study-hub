// Content loader + in-memory index.
//
// content/index.json     -> site config + the course registry
// content/courses/<id>.json -> everything for one course
//
// Courses are fetched lazily and cached, so opening the app costs one small
// JSON request; a course's theories/questions load only when you open it.

import { plain } from './markdown.js';
import { groupBy } from './util.js';

let indexPromise = null;
const courseCache = new Map();   // id -> Promise<course>
const loaded = new Map();        // id -> course (resolved)

async function getJSON(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return res.json();
}

export function siteIndex() {
  if (!indexPromise) {
    indexPromise = getJSON('content/index.json').catch((e) => {
      console.error('content/index.json failed to load', e);
      return { site: { title: 'Study Hub', subtitle: '' }, courses: [] };
    });
  }
  return indexPromise;
}

/** Normalise a raw course file: fill defaults and build cross-reference maps. */
function hydrate(raw, meta) {
  const c = {
    id: raw.id || meta.id,
    code: raw.code || meta.code || '',
    title: raw.title || meta.title || meta.id,
    color: raw.color || meta.color || '#7c8cff',
    credits: raw.credits ?? meta.credits ?? null,
    semester: raw.semester ?? meta.semester ?? null,
    description: raw.description || '',
    // Set in a course file to flag seeded/demo questions rather than real papers.
    sampleContent: !!raw.sampleContent,
    examPattern: raw.examPattern || null,
    chapters: raw.chapters || [],
    theories: raw.theories || [],
    questions: raw.questions || [],
    exercises: raw.exercises || [],
    notes: raw.notes || [],
    textbooks: raw.textbooks || [],
  };

  c.chapterById = new Map(c.chapters.map((ch) => [ch.id, ch]));
  c.theoryById  = new Map(c.theories.map((t) => [t.id, t]));
  c.questionById = new Map(c.questions.map((q) => [q.id, q]));
  c.exerciseById = new Map(c.exercises.map((x) => [x.id, x]));

  // Back-links: a question that names theoryIds shows up on those theory pages
  // even when the theory itself does not list the question.
  for (const t of c.theories) t._questions = new Set(t.questionIds || []);
  for (const q of c.questions) {
    for (const tid of q.theoryIds || []) c.theoryById.get(tid)?._questions.add(q.id);
  }
  for (const t of c.theories) {
    t.questions = Array.from(t._questions).map((id) => c.questionById.get(id)).filter(Boolean)
      .sort((a, b) => (b.year || 0) - (a.year || 0));
    delete t._questions;
    t.exerciseList = (t.exerciseIds || []).map((id) => c.exerciseById.get(id)).filter(Boolean);
    t.courseId = c.id;
  }
  for (const q of c.questions) q.courseId = c.id;
  for (const n of c.notes) n.courseId = c.id;
  for (const x of c.exercises) x.courseId = c.id;

  // Recall cards: authored cards on theories, plus every question with an
  // answer becomes a card automatically. Card ids are stable across reloads.
  c.cards = [];
  for (const t of c.theories) {
    (t.recall || []).forEach((r, i) => c.cards.push({
      id: `${c.id}:${t.id}:r${i}`, courseId: c.id, chapterId: t.chapterId,
      theoryId: t.id, q: r.q, a: r.a,
      difficulty: r.difficulty || t.difficulty || 'intermediate',
      source: t.title,
    }));
  }
  for (const q of c.questions) {
    if (!q.answer) continue;
    c.cards.push({
      id: `${c.id}:${q.id}:q`, courseId: c.id, chapterId: q.chapterId,
      questionId: q.id, q: q.text, a: q.answer,
      difficulty: q.difficulty || 'intermediate',
      source: `${q.examType || 'exam'} ${q.year || ''}`.trim(),
    });
  }

  c.stats = {
    theories: c.theories.length,
    questions: c.questions.length,
    notes: c.notes.length,
    chapters: c.chapters.length,
    cards: c.cards.length,
    answered: c.questions.filter((q) => q.answer).length,
    years: Array.from(new Set(c.questions.map((q) => q.year).filter(Boolean))).sort((a, b) => b - a),
    batches: Array.from(new Set(c.questions.map((q) => q.batch).filter(Boolean))).sort(),
    topics: Array.from(new Set(c.questions.flatMap((q) => q.topics || []))).sort(),
  };
  return c;
}

export async function getCourse(id) {
  if (courseCache.has(id)) return courseCache.get(id);
  const p = (async () => {
    const idx = await siteIndex();
    const meta = (idx.courses || []).find((x) => x.id === id);
    if (!meta) throw new Error(`Unknown course: ${id}`);
    let raw;
    try {
      raw = await getJSON(meta.file || `content/courses/${id}.json`);
    } catch (e) {
      console.warn(`Course "${id}" has no content file yet.`, e.message);
      raw = { id };
    }
    const c = hydrate(raw, meta);
    loaded.set(id, c);
    return c;
  })();
  courseCache.set(id, p);
  return p;
}

/** Load every course listed in the index (used by global search / question bank). */
export async function allCourses() {
  const idx = await siteIndex();
  return Promise.all((idx.courses || []).map((m) => getCourse(m.id)));
}

export const cachedCourse = (id) => loaded.get(id);

/* ------------------------------------------------------------- search ---- */

let searchDocs = null;

export async function buildSearchIndex() {
  if (searchDocs) return searchDocs;
  const courses = await allCourses();
  const docs = [];
  for (const c of courses) {
    docs.push({ kind: 'course', icon: '📘', id: c.id, courseId: c.id,
      title: `${c.code} — ${c.title}`,
      sub: `${c.stats.chapters} chapters · ${c.stats.questions} questions`,
      href: `#/c/${c.id}`, text: plain(c.description, 0) });

    for (const t of c.theories) {
      docs.push({ kind: 'theory', icon: '📖', id: t.id, courseId: c.id,
        title: t.title, sub: `${c.code} · ${c.chapterById.get(t.chapterId)?.title || 'Theory'}`,
        href: `#/c/${c.id}/theory/${t.id}`,
        text: [t.titleBn, plain(t.bn, 0), plain(t.en, 0), (t.tags || []).join(" ")].join(" ") });
    }
    for (const q of c.questions) {
      docs.push({ kind: 'question', icon: '❓', id: q.id, courseId: c.id,
        title: plain(q.text, 110),
        sub: `${c.code} · ${q.examType || ''} ${q.year || ''} · ${q.marks || '?'} marks`.replace(/\s+/g, ' '),
        href: `#/c/${c.id}/questions?q=${encodeURIComponent(q.id)}`,
        text: [q.text, q.textBn || "", plain(q.answer, 0), plain(q.answerBn, 0), (q.topics || []).join(" ")].join(" ") });
    }
    for (const n of c.notes) {
      docs.push({ kind: 'note', icon: '📝', id: n.id, courseId: c.id,
        title: n.title, sub: `${c.code} · ${n.date || 'Note'}`,
        href: `#/c/${c.id}/notes/${n.id}`, text: plain(n.body, 0) });
    }
    for (const b of c.textbooks) {
      docs.push({ kind: 'book', icon: '📚', id: b.id, courseId: c.id,
        title: b.title, sub: `${c.code} · ${b.author || ''}`,
        href: `#/textbooks`, text: [b.author, b.edition, b.notes].join(' ') });
    }
  }
  searchDocs = docs;
  return docs;
}

/** Rank: title prefix > title contains > body contains. */
export function searchDocsFor(docs, query, limit = 40) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  const scored = [];
  for (const d of docs) {
    const title = d.title.toLowerCase();
    const body = (d.text || '').toLowerCase();
    let score = 0, ok = true;
    for (const t of terms) {
      if (title.startsWith(t)) score += 60;
      else if (title.includes(t)) score += 32;
      else if (d.sub.toLowerCase().includes(t)) score += 12;
      else if (body.includes(t)) score += 8;
      else { ok = false; break; }
    }
    if (ok) scored.push({ ...d, score });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

/* --------------------------------------------------- question filtering --- */

export const QUESTION_SORTS = {
  'year-desc':  (a, b) => (b.year || 0) - (a.year || 0),
  'year-asc':   (a, b) => (a.year || 0) - (b.year || 0),
  'marks-desc': (a, b) => (b.marks || 0) - (a.marks || 0),
  'difficulty': (a, b) => ['beginner', 'intermediate', 'advanced'].indexOf(a.difficulty)
                        - ['beginner', 'intermediate', 'advanced'].indexOf(b.difficulty),
  'frequency':  (a, b) => ((b.repeats || []).length) - ((a.repeats || []).length),
};

export function filterQuestions(questions, f = {}) {
  return questions.filter((q) => {
    if (f.courseId && q.courseId !== f.courseId) return false;
    if (f.chapterId && q.chapterId !== f.chapterId) return false;
    if (f.examType && q.examType !== f.examType) return false;
    if (f.year && String(q.year) !== String(f.year)) return false;
    if (f.batch && q.batch !== f.batch) return false;
    if (f.difficulty && q.difficulty !== f.difficulty) return false;
    if (f.topic && !(q.topics || []).includes(f.topic)) return false;
    if (f.minMarks && (q.marks || 0) < Number(f.minMarks)) return false;
    if (f.answeredOnly && !q.answer) return false;
    if (f.text) {
      const hay = `${q.text} ${q.answer || ''} ${(q.topics || []).join(' ')}`.toLowerCase();
      if (!hay.includes(f.text.toLowerCase())) return false;
    }
    return true;
  });
}

export const byTopic = (questions) =>
  groupBy(questions.flatMap((q) => (q.topics && q.topics.length ? q.topics : ['Uncategorised'])
    .map((t) => ({ topic: t, q }))), (x) => x.topic);
