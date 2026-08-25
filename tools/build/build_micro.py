"""Remap the seeded course-1.json onto the real ECON 401 syllabus structure."""
import json
from pathlib import Path

ROOT = Path(r"C:\Users\JB PLC\Desktop\New folder (2)\Claude")
src = json.loads((ROOT / "content/courses/course-1.json").read_text(encoding="utf-8"))

# Varian chapter numbers, in the order the syllabus teaches them.
chapters = [
    {"id": "ch7", "no": 7, "title": "Utility Maximization", "titleBn": "উপযোগ সর্বাধিককরণ",
     "ref": "Varian Ch. 7 · Appendices 7.1–7.5",
     "summary": "Utility maximization implies expenditure minimization, and the converse. "
                "Excluded: EXAMPLE — The existence of a utility function. Assignment-1.",
     "assignment": "Assignment-1"},
    {"id": "ch8", "no": 8, "title": "Choice", "titleBn": "নির্বাচন",
     "ref": "Varian Ch. 8 · 8.1–8.4, 8.6–8.11",
     "summary": "Excluded: 8.5 The integrability problem. Assignment-1.",
     "assignment": "Assignment-1"},
    {"id": "ch1", "no": 1, "title": "Technology", "titleBn": "প্রযুক্তি",
     "ref": "Varian Ch. 1 · 1.1–1.11",
     "summary": "Assignment-2.", "assignment": "Assignment-2"},
    {"id": "ch2", "no": 2, "title": "Profit Maximization", "titleBn": "মুনাফা সর্বাধিককরণ",
     "ref": "Varian Ch. 2 · 2.1–2.6",
     "summary": "2.3 is an optional reading. Assignment-2.", "assignment": "Assignment-2"},
    {"id": "ch4", "no": 4, "title": "Cost Minimization", "titleBn": "ব্যয় ন্যূনতমকরণ",
     "ref": "Varian Ch. 4 · 4.1",
     "summary": "Included: EXAMPLE — Cost function for the Cobb-Douglas technology; "
                "EXAMPLE — The cost function for the Leontief technology. Assignment-2.",
     "assignment": "Assignment-2"},
]

# The seeded game-theory material is off-syllabus for 401 and is dropped here.
# It remains recoverable from git history (commit 5c8594a).
DROP_THEORIES = {"th-nash"}
DROP_QUESTIONS = {"q-2021-f-5a", "q-2018-i-2a"}
DROP_EXERCISES = {"ex-varian-15-1"}
DROP_NOTES = {"n-game-tut"}

# Duality material sits in Ch 7; the Slutsky decomposition sits in Ch 8.
CHAPTER_OF = {
    "th-duality": "ch7", "th-slutsky": "ch8",
    "q-2016-f-2b": "ch7", "q-2019-f-3a": "ch8", "q-2021-f-4a": "ch8", "q-2014-i-1c": "ch8",
    "ex-varian-7-3": "ch7", "ex-varian-8-2": "ch8",
    "n-lec3": "ch7",
}

out = {
    "id": "adv-micro",
    "code": "ECON 401",
    "title": "Advanced Microeconomics-I",
    "titleBn": "উচ্চতর ব্যষ্টিক অর্থনীতি-১",
    "color": "#7c8cff",
    "credits": 4,
    "semester": 7,
    "sampleContent": True,
    "description": (
        "Chapter structure taken from **7th Semester (FINAL SYLLABUS)** — Varian, "
        "*Microeconomic Analysis*, chapters 7, 8, 1, 2 and 4, taught in that order.\n\n"
        "Chapters 7 and 8 carry **Assignment-1**; chapters 1, 2 and 4 carry **Assignment-2**."
    ),
    "examPattern": {
        "durationMin": 180,
        "notes": "**Placeholder — confirm against your department's paper before relying on it.** "
                 "Set up as a 70-mark final: a compulsory short-answer section plus four of six "
                 "long questions. Edit `examPattern` in this file once you have a real past paper.",
        "sections": [
            {"name": "Section A — Short answer (compulsory)", "answer": 5, "outOf": 5, "marks": 4},
            {"name": "Section B — Long answer (any four)", "answer": 4, "outOf": 6, "marks": 12},
        ],
    },
    "chapters": chapters,
    "textbooks": [
        {"id": "tb-varian", "title": "Microeconomic Analysis", "author": "Hal R. Varian",
         "edition": "3rd", "year": 1992, "prescribed": True,
         "chaptersCovered": "Ch. 7, 8, 1, 2, 4 (syllabus order)",
         "notes": "The prescribed text for the whole course. Note the syllabus exclusions: "
                  "the *existence of a utility function* example in Ch. 7, and **8.5 The "
                  "integrability problem**.",
         "file": "", "url": ""},
        {"id": "tb-mwg", "title": "Microeconomic Theory", "author": "Mas-Colell, Whinston & Green",
         "edition": "1st", "year": 1995, "prescribed": False,
         "chaptersCovered": "Ch. 2–3 (consumer), Ch. 5 (production)",
         "notes": "Use for rigour when a question asks you to *prove* a property rather than state it.",
         "file": "", "url": ""},
    ],
}

for key, drop in (("theories", DROP_THEORIES), ("questions", DROP_QUESTIONS),
                  ("exercises", DROP_EXERCISES), ("notes", DROP_NOTES)):
    items = [it for it in src.get(key, []) if it["id"] not in drop]
    for it in items:
        if it["id"] in CHAPTER_OF:
            it["chapterId"] = CHAPTER_OF[it["id"]]
        # strip the now-dangling cross references
        for ref_key, valid in (("questionIds", {q["id"] for q in src["questions"]} - DROP_QUESTIONS),
                               ("theoryIds", {t["id"] for t in src["theories"]} - DROP_THEORIES),
                               ("exerciseIds", {x["id"] for x in src["exercises"]} - DROP_EXERCISES)):
            if ref_key in it:
                it[ref_key] = [r for r in it[ref_key] if r in valid]
    out[key] = items

dest = ROOT / "content/courses/adv-micro.json"
dest.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
(ROOT / "content/courses/course-1.json").unlink()

print(f"wrote {dest.name}: {len(out['theories'])} theories, {len(out['questions'])} questions, "
      f"{len(out['exercises'])} exercises, {len(out['notes'])} notes, {len(chapters)} chapters")
