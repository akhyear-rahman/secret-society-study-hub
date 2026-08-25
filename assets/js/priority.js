// Exam-yield engine.
//
// The premise: revision time should go where the expected marks are, not where
// the syllabus happens to start. For every chapter we compute
//
//   yield     — marks the archive suggests it is worth, weighted for how
//               often questions recur and how recent they are
//   readiness — how ready YOU are for it, from theories read and card mastery
//   priority  — yield x (1 - readiness), i.e. the marks still on the table
//
// Everything is derived from data already in the course files; nothing here
// needs to be maintained by hand.

import { state, isRead, cardMastery } from './store.js';
import { sum, clamp } from './util.js';

/** Questions that actually appeared in an exam — 'practice' items excluded. */
export const realQuestions = (course) =>
  course.questions.filter((q) => q.examType !== 'practice');

/**
 * Recency weight. A question from the latest year in the archive counts
 * roughly twice one from the earliest. Undated questions get the midpoint.
 */
function recencyWeight(year, minY, maxY) {
  if (!year || maxY === minY) return 1.35;
  return 1 + (year - minY) / (maxY - minY);
}

/** Per-chapter yield and readiness for one course. */
export function chapterPriorities(course) {
  const qs = realQuestions(course);
  const years = qs.map((q) => q.year).filter(Boolean);
  const minY = years.length ? Math.min(...years) : 0;
  const maxY = years.length ? Math.max(...years) : 0;

  const rows = course.chapters.map((ch) => {
    const chQs = qs.filter((q) => q.chapterId === ch.id);
    const chTh = course.theories.filter((t) => t.chapterId === ch.id);
    const chCards = course.cards.filter((c) => c.chapterId === ch.id);

    // A question that has recurred is worth more than its face marks: each
    // recorded repeat counts as another sighting.
    const yieldMarks = sum(chQs.map((q) => {
      const marks = q.marks || 10;
      const sightings = 1 + (q.repeats?.length || 0);
      return marks * sightings * recencyWeight(q.year, minY, maxY);
    }));

    const readFrac = chTh.length ? chTh.filter((t) => isRead(t.id)).length / chTh.length : 0;
    const mastery = chCards.length ? sum(chCards.map((c) => cardMastery(c.id))) / chCards.length : 0;
    // Reading is a first pass; retention is what the exam tests, so mastery
    // carries the larger weight. A chapter with no content yet reads as 0.
    const readiness = chTh.length || chCards.length
      ? clamp(0.35 * readFrac + 0.65 * mastery, 0, 1) : 0;

    const answered = chQs.filter((q) => q.answer).length;

    return {
      course, chapter: ch,
      questions: chQs, theories: chTh, cards: chCards,
      rawMarks: sum(chQs.map((q) => q.marks || 0)),
      sightings: sum(chQs.map((q) => 1 + (q.repeats?.length || 0))),
      yieldMarks, readiness, readFrac, mastery,
      answered, answerCoverage: chQs.length ? answered / chQs.length : 0,
      priority: yieldMarks * (1 - readiness),
      hasContent: chTh.length > 0,
    };
  });

  return rows.filter((r) => r.questions.length || r.theories.length);
}

/** Chapter priorities across every course, ranked. */
export function rankedPriorities(courses) {
  return courses
    .flatMap((c) => chapterPriorities(c))
    .filter((r) => r.yieldMarks > 0)
    .sort((a, b) => b.priority - a.priority);
}

/** Share of expected marks you are currently ready for, 0..1. */
export function readinessScore(rows) {
  const total = sum(rows.map((r) => r.yieldMarks));
  if (!total) return 0;
  return sum(rows.map((r) => r.yieldMarks * r.readiness)) / total;
}

/**
 * The questions most likely to appear next, by recurrence and recency.
 * This is a frequency ranking of what the archive contains, not a forecast —
 * the view says so.
 */
export function likelyQuestions(course, limit = 10) {
  const qs = realQuestions(course);
  const years = qs.map((q) => q.year).filter(Boolean);
  const minY = years.length ? Math.min(...years) : 0;
  const maxY = years.length ? Math.max(...years) : 0;

  return qs
    .map((q) => ({
      q,
      score: (1 + (q.repeats?.length || 0) * 2) * recencyWeight(q.year, minY, maxY) * (1 + (q.marks || 0) / 25),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.q);
}

/** One-line explanation of why a chapter is ranked where it is. */
export function why(row) {
  const bits = [];
  const n = row.questions.length;
  bits.push(`${n} question${n === 1 ? '' : 's'}`);
  // Sightings counts recorded repeats, so it exceeds the number of distinct
  // questions whenever the chapter has recurring favourites.
  if (row.sightings > n) bits.push(`${row.sightings} sightings with repeats`);
  if (row.rawMarks) bits.push(`${row.rawMarks} marks`);
  if (!row.hasContent) bits.push('no theory written yet');
  else if (row.readiness < 0.15) bits.push('barely started');
  else if (row.readiness < 0.5) bits.push(`${Math.round(row.readiness * 100)}% ready`);
  else bits.push(`${Math.round(row.readiness * 100)}% ready — nearly there`);
  return bits.join(' · ');
}
