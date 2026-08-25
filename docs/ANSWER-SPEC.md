# Model answer specification

How a past-year question becomes a full-marks answer in this app. This is the
`econ-question-bank` method bound to *this* repository's schema and *these*
courses, so the output drops straight into a course JSON with no reshaping.

Read this before writing any answer. Hand it to Claude along with the
questions.

---

## 1. The two readers

Write every answer as if two people are watching.

- **The student**, who has to reproduce this under time pressure and wants the
  highest score available.
- **The examiner**, who is looking for specific things and will dock marks for
  anything missing.

You already know what the examiner rewards, because you are about to write it
that way.

---

## 2. Which book each course answers from

An answer that echoes the book the paper was set from reads, to the examiner,
as someone who actually did the reading. Use its exact definitions, notation,
axis labels and sequence of explanation — not a paraphrase.

| Course | Primary | Fall back to |
|---|---|---|
| **ECON 401** Advanced Micro | Varian, *Microeconomic Analysis*, 3rd ed. | Mas-Colell, Whinston & Green |
| **ECON 403** Advanced Macro | Mankiw, *Macroeconomics*, 9th ed. | Romer, *Advanced Macroeconomics*, 5th ed. (unemployment only) |
| **ECON 405** Advanced Econometrics | Wooldridge, *Cross Section and Panel Data*, 2nd ed. | Wooldridge, *Introductory Econometrics*, 7th ed. |
| **ECON 409** Environmental | Perman, Ma, McGilvray & Common, 4th ed. | The 98th-batch lecture sheets |
| **ECON 412** Research Methodology | Ranjit Kumar · Lune & Berg · Angrist & Pischke | — |

Rules that follow from this:

- Where the syllabus names a page or section limit, **stay inside it**. An
  answer that solves a problem using material excluded from the syllabus earns
  nothing and signals you did not read the outline.
- If two books define a term differently, follow the primary and flag it:
  `[⚠ Mankiw defines X as …; Romer as …. This answer follows Mankiw.]`
- If the primary does not cover the topic, say so and use standard
  undergraduate treatment: `[Note: not covered in Perman; standard treatment.]`
- **ECON 409 caution.** Perman is inferred, not stated — matched from the
  syllabus's own chapter numbering. Confirm before leaning hard on its notation.

---

## 3. Answer structure

1. **Open with the answer.** First sentence states what is asked and answers
   it. Never "In this answer I will discuss…".
2. **Define the key terms** in one or two sentences each — simplest language
   that stays accurate.
3. **Work the core** in numbered steps when the question says *derive*,
   *show that* or *prove*. Each step gets a line of justification, not just a
   line of algebra. Examiners award the justification.
4. **Diagrams.** If the topic normally carries one, say exactly what to draw
   and label: which variable on which axis, which curves, which area is
   shaded and what it represents.
5. **At least one analytical sentence** on any answer of 10 marks or more —
   judgement, not recall. *"This assumption fails whenever …"*
6. **Close in one line.** The conclusion the examiner is looking for.

Register: plain, fluent, semi-formal. Explain like a patient tutor; never
leave jargon undefined. Every sentence should be carrying marks.

---

## 4. Length, calibrated to the real paper

The generic table in the skill tops out at 450 words for a 20-mark question.
That is wrong for these papers, so calibrate from the time actually available.

ECON 409 final: **180 minutes, four questions of 12.5 marks** = 45 minutes per
answer. Sustained handwriting with thinking runs about 12–15 words a minute,
so a complete answer is **500–700 words**. Padding it out further costs time
you need elsewhere; coming in at 250 leaves marks on the table.

| Marks | Minutes | Target words |
|---|---|---|
| 2–4 | ~5 | 60–120 |
| 5 | ~10 | 150–260 |
| 10 | ~30 | 350–520 |
| 12.5 | ~45 | 500–700 |
| 20 | ~60 | 700–950 |

`tools/validate.py` warns outside a generous band around these. A warning is a
prompt to look, not an order to cut — a derivation-heavy answer legitimately
runs long.

---

## 5. The JSON a finished answer produces

```json
{
  "id": "q-2019-f-1",
  "chapterId": "coase",
  "examType": "final",
  "year": 2019,
  "batch": "10th",
  "qNo": "1",
  "marks": 12.5,
  "difficulty": "advanced",
  "topics": ["Market failure", "Coase theorem"],
  "repeats": [2020, 2021],
  "theoryIds": ["th-coase"],
  "text": "The question exactly as printed on the paper.",
  "answerPoints": [
    "List and explain at least four sources of market failure — 4 marks",
    "State the theorem, separating efficiency from invariance — 3 marks"
  ],
  "answer": "## Part 1 — …  (markdown)",
  "answerBn": "",
  "source": "Perman et al., Ch. 5"
}
```

**`answerPoints` is the full-marks checklist**, and it is not optional. Each
entry names what earns a specific slice of the marks. It renders as a green
box above the answer and becomes the rubric you grade yourself against after a
mock exam — which is the step where the learning actually happens.

**`source`** names the authority. It renders in italics under the answer.

**`topics`** must come from the controlled vocabulary — see §7.

---

## 6. Priority — which questions to answer first

Do not work through the bank in year order. Answer in descending order of
marks at stake, which the app already computes at `#/plan`:

- **HIGH** — appears in three or more sittings, or carries 20+ marks in total
- **MEDIUM** — two sittings, or 10–19 marks
- **LOW** — once, under 10 marks

For ECON 409 as it stands, that means Coase theorem (8 appearances, 91 marks)
before anything else, then WTP vs WTA, sustainable development, total economic
value, contingent valuation.

---

## 7. Topic vocabulary

Frequency ranking groups by topic, so a topic split across two labels reads as
half as important as it is. Before adding a topic string, check whether one
already exists that means the same thing.

```bash
python tools/topics.py            # list the vocabulary with counts
python tools/topics.py --near     # flag labels that look like duplicates
```

Prefer the existing label. Add a new one only for a genuinely new idea.

---

## 8. The prompt to use when adding questions

> Here are past-year questions from **{COURSE}**, {which sitting}, worth
> {marks} each.
>
> Follow `docs/ANSWER-SPEC.md` in this repo. Answer from **{book}**, using its
> notation and staying inside the syllabus limits. For each question give me
> the complete JSON object — `answerPoints` as the full-marks checklist,
> `answer` in markdown at the length the marks justify, `source` naming the
> book and chapter, `topics` from the existing vocabulary, and `repeats` if it
> has appeared before.
>
> Work in priority order: highest frequency first.

Then run:

```bash
python tools/validate.py
```

which checks cross-references, the answer-length band, and that every answer
carries both a checklist and a source.

---

## 9. Before you call an answer finished

- [ ] Opens by answering, not by announcing
- [ ] Every technical term defined once, plainly
- [ ] Derivations proceed in numbered steps, each justified
- [ ] Diagram instructions name axes, curves and shaded areas
- [ ] At least one analytical sentence if 10+ marks
- [ ] Length matches the marks
- [ ] `answerPoints` accounts for the full mark total
- [ ] `source` names the book and chapter
- [ ] Topics drawn from the existing vocabulary
- [ ] Stays inside the syllabus's stated page and section limits
