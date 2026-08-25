# -*- coding: utf-8 -*-
"""Merge theories and model answers into content/courses/env-econ.json."""
import json, sys
from pathlib import Path

SP = Path(r"C:\Users\JBPLC~1\AppData\Local\Temp\claude\C--Users-JB-PLC-Desktop-New-folder--2--Claude\94c2b6f6-192b-4bba-a35c-b77ec8b92878\scratchpad")
sys.path.insert(0, str(SP))
from env_theories_a import THEORIES_A
from env_theories_b import THEORIES_B
from env_answers import ANSWERS

ROOT = Path(r"C:\Users\JB PLC\Desktop\New folder (2)\Claude")
dest = ROOT / "content/courses/env-econ.json"
course = json.loads(dest.read_text(encoding="utf-8"))

theories = THEORIES_A + THEORIES_B
by_id = {t["id"]: t for t in theories}
chapter_ids = {c["id"] for c in course["chapters"]}
for t in theories:
    assert t["chapterId"] in chapter_ids, f"bad chapterId {t['chapterId']} on {t['id']}"
    t.setdefault("questionIds", [])
    t.setdefault("exerciseIds", [])

qs = {q["id"]: q for q in course["questions"]}
missing = [qid for qid in ANSWERS if qid not in qs]
assert not missing, f"answers for unknown questions: {missing}"

for qid, a in ANSWERS.items():
    q = qs[qid]
    q["answer"] = a["answer"]
    q["answerPoints"] = a["answerPoints"]
    q["theoryIds"] = a["theoryIds"]
    for tid in a["theoryIds"]:
        assert tid in by_id, f"{qid} links unknown theory {tid}"
        if qid not in by_id[tid]["questionIds"]:
            by_id[tid]["questionIds"].append(qid)

# Every question in a chapter a theory covers should surface on that theory
# page, even without a hand-written link.
for t in theories:
    for q in course["questions"]:
        if q["chapterId"] == t["chapterId"] and q["id"] not in t["questionIds"]:
            t["questionIds"].append(q["id"])

course["theories"] = theories
course["sampleContent"] = False
dest.write_text(json.dumps(course, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

answered = sum(1 for q in course["questions"] if q.get("answer"))
cards = sum(len(t.get("recall", [])) for t in theories)
print(f"theories: {len(theories)}   recall cards: {cards}")
print(f"answered: {answered}/{len(course['questions'])} questions")
print(f"bilingual: {sum(1 for t in theories if t.get('bn') and t.get('en'))}/{len(theories)}")
