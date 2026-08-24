#!/usr/bin/env python3
"""Validate the content files before you commit.

Checks that every JSON parses, that ids are unique, that every cross-reference
(chapterId, theoryIds, questionIds, exerciseIds, textbookId) points at
something real, and that required fields are present. Warns about the soft
stuff: missing model answers, missing Bangla text, unrated difficulty.

    python tools/validate.py
    python tools/validate.py --strict      # warnings become failures
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIFFS = {"beginner", "intermediate", "advanced"}
EXAM_TYPES = {"incourse", "midterm", "final", "tutorial", "viva", "assignment"}

errors: list[str] = []
warnings: list[str] = []


def err(where: str, msg: str) -> None:
    errors.append(f"{where}: {msg}")


def warn(where: str, msg: str) -> None:
    warnings.append(f"{where}: {msg}")


def load(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        err(str(path.relative_to(ROOT)), "file not found")
    except json.JSONDecodeError as e:
        err(str(path.relative_to(ROOT)), f"invalid JSON at line {e.lineno} col {e.colno}: {e.msg}")
    return None


def check_unique(where: str, kind: str, items: list, seen: set) -> None:
    for it in items:
        i = it.get("id")
        if not i:
            err(where, f"a {kind} has no id")
        elif i in seen:
            err(where, f"duplicate {kind} id {i!r}")
        else:
            seen.add(i)


def validate_course(path: Path, meta: dict) -> tuple[int, int, int, int]:
    """Returns (theories, questions, chapters, notes)."""
    where = str(path.relative_to(ROOT))
    data = load(path)
    if data is None:
        return 0, 0, 0, 0

    chapters = data.get("chapters", [])
    theories = data.get("theories", [])
    questions = data.get("questions", [])
    exercises = data.get("exercises", [])
    notes = data.get("notes", [])
    books = data.get("textbooks", [])

    ids: set[str] = set()
    for kind, items in (("chapter", chapters), ("theory", theories), ("question", questions),
                        ("exercise", exercises), ("note", notes), ("textbook", books)):
        check_unique(where, kind, items, ids)

    chapter_ids = {c.get("id") for c in chapters}
    theory_ids = {t.get("id") for t in theories}
    question_ids = {q.get("id") for q in questions}
    exercise_ids = {x.get("id") for x in exercises}
    book_ids = {b.get("id") for b in books}

    if data.get("id") and data["id"] != meta["id"]:
        err(where, f'"id" is {data["id"]!r} but index.json registers it as {meta["id"]!r}')

    for t in theories:
        tid = t.get("id", "?")
        w = f"{where} theory {tid}"
        if not t.get("title"):
            err(w, "missing title")
        if t.get("chapterId") and t["chapterId"] not in chapter_ids:
            err(w, f'chapterId {t["chapterId"]!r} does not exist')
        if t.get("difficulty") and t["difficulty"] not in DIFFS:
            err(w, f'difficulty {t["difficulty"]!r} must be one of {sorted(DIFFS)}')
        for q in t.get("questionIds", []):
            if q not in question_ids:
                err(w, f"questionIds references unknown question {q!r}")
        for x in t.get("exerciseIds", []):
            if x not in exercise_ids:
                err(w, f"exerciseIds references unknown exercise {x!r}")
        if not t.get("bn") and not t.get("en"):
            warn(w, "has neither a bn nor an en explanation")
        elif not t.get("bn"):
            warn(w, "no Bangla explanation yet")
        if not t.get("recall"):
            warn(w, "no recall cards — active recall will skip it")

    for q in questions:
        qid = q.get("id", "?")
        w = f"{where} question {qid}"
        if not q.get("text"):
            err(w, "missing text")
        if q.get("chapterId") and q["chapterId"] not in chapter_ids:
            err(w, f'chapterId {q["chapterId"]!r} does not exist')
        if q.get("examType") and q["examType"] not in EXAM_TYPES:
            err(w, f'examType {q["examType"]!r} must be one of {sorted(EXAM_TYPES)}')
        if q.get("difficulty") and q["difficulty"] not in DIFFS:
            err(w, f'difficulty {q["difficulty"]!r} must be one of {sorted(DIFFS)}')
        for t in q.get("theoryIds", []):
            if t not in theory_ids:
                err(w, f"theoryIds references unknown theory {t!r}")
        if not q.get("answer"):
            warn(w, "no model answer")
        if not q.get("marks"):
            warn(w, "no marks recorded — mock exams cannot weight it")
        if not q.get("topics"):
            warn(w, "no topics — it lands in 'Uncategorised' in topic-wise view")

    for x in exercises:
        w = f"{where} exercise {x.get('id', '?')}"
        if x.get("textbookId") and x["textbookId"] not in book_ids:
            err(w, f'textbookId {x["textbookId"]!r} does not exist')
        if not x.get("solution"):
            warn(w, "no solution written")

    for n in notes:
        w = f"{where} note {n.get('id', '?')}"
        if n.get("chapterId") and n["chapterId"] not in chapter_ids:
            err(w, f'chapterId {n["chapterId"]!r} does not exist')
        for t in n.get("theoryIds", []):
            if t not in theory_ids:
                err(w, f"theoryIds references unknown theory {t!r}")

    if chapters and not theories:
        warn(where, f"{len(chapters)} chapters mapped but no theories written yet")

    return len(theories), len(questions), len(chapters), len(notes)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--strict", action="store_true", help="treat warnings as errors")
    args = ap.parse_args()

    index = load(ROOT / "content" / "index.json")
    if index is None:
        print("\n".join(errors))
        return 1

    courses = index.get("courses", [])
    if not courses:
        err("content/index.json", "no courses registered")

    seen_ids: set[str] = set()
    total_t = total_q = 0
    print(f"Validating {len(courses)} registered course(s)\n")

    for meta in courses:
        cid = meta.get("id")
        if not cid:
            err("content/index.json", "a course entry has no id")
            continue
        if cid in seen_ids:
            err("content/index.json", f"duplicate course id {cid!r}")
        seen_ids.add(cid)

        path = ROOT / (meta.get("file") or f"content/courses/{cid}.json")
        if not path.exists():
            print(f"  - {cid:<18} no content file yet ({path.relative_to(ROOT)})")
            continue
        t, q, ch, n = validate_course(path, meta)
        total_t += t
        total_q += q
        print(f"  - {cid:<18} {ch:>2} chapters, {t:>3} theories, {q:>3} questions, {n:>2} notes")

    print(f"\nTotal: {total_t} theories, {total_q} questions")

    if warnings:
        print(f"\n{len(warnings)} warning(s):")
        for w in warnings:
            print(f"  ! {w}")
    if errors:
        print(f"\n{len(errors)} error(s):")
        for e in errors:
            print(f"  x {e}")
        return 1
    if args.strict and warnings:
        print("\nFailing because --strict was given.")
        return 1

    print("\nAll good.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
