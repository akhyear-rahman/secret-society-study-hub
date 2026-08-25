// Persistent local state: settings, study progress, spaced-repetition
// scheduling, XP / streak / badges, and exam history.
// Everything lives in localStorage — the app has no backend by design.

import { todayKey, daysBetween, clamp } from './util.js';

const KEY = 'sem7hub:v1';

const DEFAULTS = {
  settings: {
    lang: 'bn',            // 'bn' | 'en'  — which explanation to show
    theme: 'dark',         // 'dark' | 'light' | 'system'
    showQuestions: true,   // theory page: show the related-PYQ rail
    showAnswers: false,    // question bank: expand model answers by default
    reading: false,        // distraction-free reading mode
    readScale: 1,          // reader type size, 0.85 … 1.4
  },
  examDates: {},           // courseId -> yyyy-mm-dd, drives the study plan
  // theoryId -> { read: bool, ts, confidence 0..3 }
  theory: {},
  // questionId -> { seen, attempted, selfScore (0..1), ts }
  question: {},
  // cardId -> { ease, interval, due (yyyy-mm-dd), reps, lapses }
  srs: {},
  xp: 0,
  streak: { count: 0, last: null, best: 0 },
  days: {},                // yyyy-mm-dd -> { xp, cards, questions, minutes }
  exams: [],               // { id, courseId, title, date, score, total, seconds, answers }
  badges: [],              // badge ids earned
  bookmarks: [],           // "theory:id" / "question:id"
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(DEFAULTS), ...parsed,
      settings: { ...DEFAULTS.settings, ...(parsed.settings || {}) },
      streak: { ...DEFAULTS.streak, ...(parsed.streak || {}) } };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

export const state = load();

let saveTimer;
export function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { console.warn('Could not persist progress:', e); }
  }, 120);
}

const listeners = new Set();
export const onChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
function emit() { listeners.forEach((f) => f(state)); }

export function setSetting(k, v) { state.settings[k] = v; save(); emit(); }

/** Resolve the 'system' theme choice against the OS preference. */
export function effectiveTheme() {
  const pref = state.settings.theme;
  if (pref === 'light' || pref === 'dark') return pref;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function setExamDate(courseId, date) {
  if (date) state.examDates[courseId] = date;
  else delete state.examDates[courseId];
  save(); emit();
}
/** Whole days from today to the exam, or null if none is set. */
export function daysToExam(courseId) {
  const d = state.examDates[courseId];
  if (!d) return null;
  return Math.ceil((new Date(d + 'T00:00:00') - new Date(todayKey() + 'T00:00:00')) / 86400000);
}

/* ---------------------------------------------------------------- XP ---- */

export const BADGES = [
  { id: 'first-step',  em: '🌱', name: 'First Step',     hint: 'Read your first theory' },
  { id: 'ten-theories',em: '📖', name: 'Well Read',      hint: 'Read 10 theories' },
  { id: 'centurion',   em: '💯', name: 'Centurion',      hint: 'Answer 100 recall cards' },
  { id: 'streak-3',    em: '🔥', name: 'On a Roll',      hint: '3-day streak' },
  { id: 'streak-7',    em: '⚡', name: 'Week Warrior',   hint: '7-day streak' },
  { id: 'streak-30',   em: '🏔️', name: 'Unstoppable',    hint: '30-day streak' },
  { id: 'first-exam',  em: '🎯', name: 'Exam Ready',     hint: 'Finish a mock exam' },
  { id: 'exam-80',     em: '🏅', name: 'First Class',    hint: 'Score 80%+ on a mock exam' },
  { id: 'night-owl',   em: '🦉', name: 'Night Owl',      hint: 'Study after midnight' },
  { id: 'early-bird',  em: '🐦', name: 'Early Bird',     hint: 'Study before 7 am' },
  { id: 'topic-master',em: '👑', name: 'Topic Master',   hint: 'Master every card in a chapter' },
  { id: 'xp-1000',     em: '🚀', name: 'Thousand Club',  hint: 'Earn 1000 XP' },
];

export function award(id) {
  if (state.badges.includes(id)) return null;
  state.badges.push(id);
  save(); emit();
  return BADGES.find((b) => b.id === id) || null;
}

export function addXp(n, kind = 'xp') {
  const day = todayKey();
  state.xp += n;
  const d = state.days[day] || (state.days[day] = { xp: 0, cards: 0, questions: 0, minutes: 0 });
  d.xp += n;
  if (kind === 'card') d.cards++;
  if (kind === 'question') d.questions++;
  touchStreak();
  const hour = new Date().getHours();
  if (hour < 7) award('early-bird');
  if (hour >= 0 && hour < 4) award('night-owl');
  if (state.xp >= 1000) award('xp-1000');
  save(); emit();
}

export function touchStreak() {
  const day = todayKey();
  const s = state.streak;
  if (s.last === day) return;
  s.count = s.last && daysBetween(s.last, day) === 1 ? s.count + 1 : 1;
  s.last = day;
  s.best = Math.max(s.best || 0, s.count);
  if (s.count >= 3) award('streak-3');
  if (s.count >= 7) award('streak-7');
  if (s.count >= 30) award('streak-30');
  save();
}

/** Streak counts as broken (display 0) if the last study day was before yesterday. */
export function liveStreak() {
  const s = state.streak;
  if (!s.last) return 0;
  const gap = daysBetween(s.last, todayKey());
  return gap <= 1 ? s.count : 0;
}

/* ------------------------------------------------------------ theory ---- */

export function markTheoryRead(id, confidence) {
  const prev = state.theory[id];
  state.theory[id] = { read: true, ts: Date.now(), confidence: confidence ?? prev?.confidence ?? 1 };
  if (!prev) {
    addXp(10);
    award('first-step');
    if (Object.keys(state.theory).length >= 10) award('ten-theories');
  }
  save(); emit();
}
export const isRead = (id) => !!state.theory[id]?.read;

export function toggleBookmark(ref) {
  const i = state.bookmarks.indexOf(ref);
  if (i >= 0) state.bookmarks.splice(i, 1); else state.bookmarks.push(ref);
  save(); emit();
  return i < 0;
}
export const isBookmarked = (ref) => state.bookmarks.includes(ref);

/* --------------------------------------------------------------- SRS ---- */
// Simplified SM-2. grade: 0 again · 1 hard · 2 good · 3 easy

export function reviewCard(cardId, grade) {
  const c = state.srs[cardId] || { ease: 2.4, interval: 0, reps: 0, lapses: 0, due: todayKey() };
  if (grade === 0) {
    c.lapses++; c.reps = 0; c.interval = 0; c.ease = clamp(c.ease - 0.25, 1.3, 3.0);
  } else {
    c.reps++;
    c.ease = clamp(c.ease + (grade === 1 ? -0.15 : grade === 3 ? 0.12 : 0), 1.3, 3.0);
    if (c.reps === 1) c.interval = grade === 1 ? 1 : grade === 3 ? 3 : 2;
    else if (c.reps === 2) c.interval = grade === 1 ? 3 : grade === 3 ? 8 : 6;
    else c.interval = Math.round(c.interval * c.ease * (grade === 1 ? 0.7 : grade === 3 ? 1.25 : 1));
  }
  c.interval = clamp(c.interval, 0, 365);
  const due = new Date();
  due.setDate(due.getDate() + Math.max(grade === 0 ? 0 : 1, c.interval));
  c.due = due.toISOString().slice(0, 10);
  c.last = todayKey();
  state.srs[cardId] = c;

  addXp(grade === 0 ? 2 : 5, 'card');
  const total = Object.values(state.srs).reduce((n, x) => n + x.reps, 0);
  if (total >= 100) award('centurion');
  save(); emit();
  return c;
}

export const cardDue = (cardId) => {
  const c = state.srs[cardId];
  return !c || c.due <= todayKey();
};
/** 0..1 how well this card is known, from interval length. */
export const cardMastery = (cardId) => {
  const c = state.srs[cardId];
  if (!c || !c.reps) return 0;
  return clamp(c.interval / 21, 0, 1);
};

/* -------------------------------------------------------------- exams ---- */

export function recordExam(rec) {
  state.exams.unshift({ ...rec, date: new Date().toISOString() });
  state.exams = state.exams.slice(0, 60);
  addXp(40, 'question');
  award('first-exam');
  if (rec.total && rec.score / rec.total >= 0.8) award('exam-80');
  save(); emit();
}

export function resetAll() {
  localStorage.removeItem(KEY);
  Object.assign(state, structuredClone(DEFAULTS));
  save(); emit();
}

/** Full JSON backup so progress survives a device change. */
export const exportData = () => JSON.stringify(state, null, 2);
export function importData(json) {
  const parsed = JSON.parse(json);
  Object.assign(state, structuredClone(DEFAULTS), parsed);
  save(); emit();
}
