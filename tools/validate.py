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

# Words a complete answer runs to, calibrated from the time the paper actually
# allows rather than a generic table — see docs/ANSWER-SPEC.md §4. The bands are
# deliberately wide; a derivation-heavy answer legitimately runs long.
LENGTH_TARGETS = [(2, 90), (5, 200), (10, 430), (12.5, 600), (20, 820), (30, 1100)]


def target_words(marks):
    """(low, high) word band for an answer worth `marks`."""
    if not marks:
        return None
    pts = LENGTH_TARGETS
    if marks <= pts[0][0]:
        mid = pts[0][1]
    elif marks >= pts[-1][0]:
        mid = pts[-1][1]
    else:
        mid = pts[-1][1]
        for (m1, w1), (m2, w2) in zip(pts, pts[1:]):
            if m1 <= marks <= m2:
                mid = w1 + (w2 - w1) * (marks - m1) / (m2 - m1)
                break
    return int(mid * 0.55), int(mid * 1.75)


# A displayed equation is not prose, but it is not free either: writing one out
# by hand costs roughly what a short sentence costs. Counting its LaTeX source
# as prose overstates badly (one fraction is three 'words' and a moment's
# writing), so each display block is charged a flat allowance instead, and
# inline math is treated as the single symbol it renders to.
DISPLAY_EQUATION_WORDS = 10


def answer_words(text):
    import re
    t = re.sub(r"```.*?```", " ", text or "", flags=re.S)     # drop code blocks
    n_display = len(re.findall(r"\$\$.*?\$\$", t, flags=re.S))
    t = re.sub(r"\$\$.*?\$\$", " ", t, flags=re.S)
    t = re.sub(r"\$(?!\s)[^$\n]+?(?<!\s)\$", " x ", t)
    t = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", t)
    t = re.sub(r"[#*`|>_-]", " ", t)
    return len(t.split()) + n_display * DISPLAY_EQUATION_WORDS


def checklist_marks(points):
    """Total the "— N marks" tags on an answerPoints checklist.

    Returns None when nothing is tagged, so a checklist written without
    mark allocations is left alone rather than reported as summing to zero.
    """
    import re
    total, seen = 0.0, False
    for p in points or []:
        m = re.search(r"—\s*([\d.]+)\s*marks?\s*$", str(p).strip())
        if m:
            total += float(m.group(1))
            seen = True
    return total if seen else None


DIFFS = {"beginner", "intermediate", "advanced"}
EXAM_TYPES = {"incourse", "midterm", "final", "tutorial", "viva", "assignment", "practice"}

errors: list[str] = []
# (file, item, message) — grouped on output so one missing field across a
# hundred questions prints as one line, not a hundred.
warnings: list[tuple[str, str, str]] = []


def err(where: str, msg: str) -> None:
    errors.append(f"{where}: {msg}")


def warn(where: str, msg: str, item: str = "") -> None:
    warnings.append((where, item, msg))


def print_warnings() -> None:
    grouped: dict[tuple[str, str], list[str]] = {}
    for where, item, msg in warnings:
        grouped.setdefault((where, msg), []).append(item)
    print(f"\n{len(warnings)} warning(s) in {len(grouped)} group(s):")
    for (where, msg), items in grouped.items():
        named = [i for i in items if i]
        if len(named) > 1:
            shown = ", ".join(named[:4])
            more = f" +{len(named) - 4} more" if len(named) > 4 else ""
            print(f"  ! {where}: {len(named)} x {msg}  ({shown}{more})")
        elif named:
            print(f"  ! {where} {named[0]}: {msg}")
        else:
            print(f"  ! {where}: {msg}")


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
        w = where
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
            warn(w, "theory has neither a bn nor an en explanation", tid)
        elif not t.get("bn"):
            warn(w, "theory has no Bangla explanation yet", tid)
        if not t.get("recall"):
            warn(w, "theory has no recall cards", tid)

    for q in questions:
        qid = q.get("id", "?")
        w = where
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
            warn(w, "question has no model answer", qid)
        else:
            # An answered question must also carry its rubric and its authority.
            if not q.get("answerPoints"):
                warn(w, "answer has no answerPoints checklist", qid)
            else:
                # ANSWER-SPEC: the checklist must account for the full mark
                # total. Re-anchoring a question to a different sitting changes
                # its marks and silently leaves the old checklist behind, which
                # is exactly how three of these drifted once.
                claimed = checklist_marks(q["answerPoints"])
                if claimed is not None and q.get("marks")                         and abs(claimed - float(q["marks"])) > 1e-9:
                    warn(w, f"answerPoints sum to {claimed:g} but the question "
                            f"is worth {q['marks']:g}", qid)
            if not q.get("source"):
                warn(w, "answer does not name its source book", qid)
            band = target_words(q.get("marks"))
            if band:
                n = answer_words(q["answer"])
                if n < band[0]:
                    warn(w, f"answer looks short for {q['marks']} marks "
                            f"({n} words, expected {band[0]}-{band[1]})", qid)
                elif n > band[1]:
                    warn(w, f"answer looks long for {q['marks']} marks "
                            f"({n} words, expected {band[0]}-{band[1]})", qid)
        if not q.get("marks") and q.get("examType") != "practice":
            warn(w, "question has no marks recorded", qid)
        if not q.get("topics"):
            warn(w, "question has no topics", qid)

    for x in exercises:
        w, xid = where, x.get("id", "?")
        if x.get("textbookId") and x["textbookId"] not in book_ids:
            err(w, f'textbookId {x["textbookId"]!r} does not exist')
        if not x.get("solution"):
            warn(w, "exercise has no solution written", xid)

    for n in notes:
        w = where
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
        print_warnings()
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
