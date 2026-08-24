# Adding content

Everything in this app comes from JSON files under `content/`. There is no build
step and no database — edit a file, refresh the page, the change is live.

```
content/
  index.json              the course registry + site title
  courses/
    _template.json        copy this to start a new course
    adv-micro.json        one file per course; everything for that course
  textbooks/              drop textbook PDFs here
  files/                  drop lecture slides / scanned papers here
```

## The one rule that matters

**Ids are the glue.** A theory says which questions belong to it by listing
their ids; a question says which theories it tests. Both directions work, and
the app merges them — so you only need to record the link once, on whichever
side is more convenient at the time.

Run the validator whenever you finish a batch of editing:

```bash
python tools/validate.py
```

It fails on broken references and duplicate ids, and warns about the soft gaps
(missing model answer, no Bangla text, no marks recorded).

## Registering a course

`content/index.json` lists the courses. A course listed here with no content
file still appears in the sidebar and reports itself as empty — so register all
six now and fill them in one at a time.

```json
{
  "id": "adv-micro",
  "code": "ECON 401",
  "short": "Advanced Micro",
  "title": "Advanced Microeconomics",
  "titleBn": "উচ্চতর ব্যষ্টিক অর্থনীতি",
  "color": "#7c8cff",
  "credits": 4,
  "semester": 7
}
```

`id` becomes the filename (`content/courses/adv-micro.json`) and the URL
(`#/c/adv-micro`). Pick it once and don't change it.

Or let the helper do both steps:

```bash
python tools/new_course.py env-econ "ECON 407" "Environmental Economics"
```

## Chapters

```json
{
  "id": "ch8", "no": 8,
  "title": "Choice", "titleBn": "নির্বাচন",
  "ref": "Varian Ch. 8 · 8.1–8.4, 8.6–8.11",
  "instructor": "MM",
  "summary": "Excluded: 8.5 The integrability problem. Assignment-1."
}
```

Chapters drive the chapter-wise filters everywhere — theory list, question
bank, recall decks, mock exam scope. Every theory and question should carry a
`chapterId`.

`no` is the number in the **textbook**, not the teaching order — list the
chapters in the order they are taught and the syllabus map keeps that order
while still showing the real chapter number.

`ref`, `instructor` and `summary` are all optional. If any chapter has one, the
course page grows a **Syllabus map** table showing the reading for each chapter,
who teaches it, and how much content you have written against it so far. That
table is the fastest way to see where the gaps are.

Put the syllabus's exclusions in `summary` — "Excluded: 8.5 The integrability
problem" is worth more at 2 a.m. than any note you will write later.

## Marking a course as seeded

```json
"sampleContent": true
```

Set this at the top level of a course file while it still contains example
questions rather than real past papers. The app shows a warning banner on the
course page so you never mistake invented years and batches for the real thing.
Delete the flag once the questions are genuine.

## Theories

```json
{
  "id": "th-slutsky",
  "chapterId": "ch1",
  "title": "The Slutsky Equation",
  "titleBn": "স্লুটস্কি সমীকরণ",
  "difficulty": "advanced",
  "importance": 5,
  "tags": ["slutsky", "demand"],
  "questionIds": ["q-2019-f-3a"],
  "exerciseIds": ["ex-varian-8-2"],
  "keyTerms": [{ "en": "Income effect", "bn": "আয় প্রভাব", "def": "…" }],
  "formulas": ["∂x/∂p = ∂h/∂p − x(∂x/∂m)"],
  "bn": "## বাংলা ব্যাখ্যা …",
  "en": "## English explanation …",
  "recall": [{ "q": "…", "a": "…", "difficulty": "beginner" }]
}
```

| Field | What it drives |
|---|---|
| `difficulty` | `beginner` / `intermediate` / `advanced` filters everywhere |
| `importance` | 1–5 stars, shown as exam importance; also weights mock-exam selection |
| `bn` / `en` | The two explanation versions the language toggle switches between |
| `keyTerms` | The terminology panel in the reading rail |
| `recall` | Cards for the Active Recall deck |
| `questionIds` | The past-year questions shown alongside the theory |
| `exerciseIds` | Textbook exercises shown alongside the theory |

Either `bn` or `en` may be empty — the reader falls back to whichever exists
and shows a small note saying so.

### Writing the Bangla version

Write fluent Bangla prose, but keep economic and theoretical terminology in
English. Wrap those terms in double braces and they render in a distinct
colour and font:

```
প্রতিস্থাপন প্রভাব সর্বদা ঋণাত্মক, কারণ {{Expenditure Function}}
দামে {{Concave}}।
```

This is the point of the whole bilingual design: you reason in Bangla, but the
words you will have to write in the exam script stay in front of you in
English.

### Markdown that works

Headings, **bold**, *italic*, `inline code`, fenced code blocks, links,
bulleted and numbered lists (one level of nesting), block quotes, tables, and
horizontal rules. Headings at level 2 and 3 automatically build the "On this
page" outline.

Inside JSON, a newline is `\n`. A code block is
`"```\nline one\nline two\n```"`.

## Questions

```json
{
  "id": "q-2019-f-3a",
  "chapterId": "ch1",
  "examType": "final",
  "year": 2019,
  "batch": "2015-16",
  "qNo": "3(a)",
  "marks": 12,
  "difficulty": "advanced",
  "topics": ["Duality", "Slutsky equation"],
  "repeats": [2014, 2011],
  "theoryIds": ["th-slutsky"],
  "text": "The question exactly as printed.",
  "answerPoints": ["What the first 3 marks are for", "…"],
  "answer": "The model answer in Markdown.",
  "answerBn": ""
}
```

`examType` must be one of `incourse`, `midterm`, `final`, `tutorial`, `viva`,
`assignment`.

Two fields carry more weight than they look:

- **`repeats`** — other years the same question appeared. This drives the
  "↻ repeated ×3" badge, the *Most repeated* sort, and the weighting the mock
  exam generator uses. A question that has come three times is the single most
  valuable thing in your bank; record it.
- **`answerPoints`** — the marking scheme, rendered as a green box above the
  answer. When you self-mark a mock exam this is what you grade against.

`answerBn` is optional; when present, each answer gets a বাংলায় দেখুন toggle.

### Getting model answers written

Point Claude at the question and the marking pattern. What works:

> Here is a past-year question from ECON 401 final 2019, worth 12 marks.
> Write a model answer that would score all 12. Structure it in numbered
> steps, derive rather than assert, and end with the conclusion the examiner
> is looking for. Then give me the `answerPoints` marking scheme as a list.
> Return it as the JSON object for my question bank.

Then paste the object into the `questions` array. The sample course
(`content/courses/adv-micro.json`) shows the standard this is aiming at.

## Exercises

Textbook exercises live in their own array and attach to a theory through
that theory's `exerciseIds`. They then appear both on the theory page,
underneath the explanation, and in the Textbooks tab.

```json
{
  "id": "ex-varian-8-2",
  "textbookId": "tb-varian",
  "chapterId": "ch1",
  "ref": "Varian, Ch. 8, Q2",
  "difficulty": "advanced",
  "text": "The exercise as printed.",
  "solution": "Worked solution in Markdown."
}
```

## Notes

```json
{
  "id": "n-lec3",
  "chapterId": "ch1",
  "title": "Lecture 3 — Duality",
  "date": "2026-08-18",
  "source": "Lecture",
  "theoryIds": ["th-duality"],
  "file": "content/files/lecture-03.pdf",
  "body": "## Markdown …"
}
```

`theoryIds` makes the note show up as a link on those theory pages, and vice
versa. `file` adds an "Open original file" button — put the PDF in
`content/files/`.

## Textbooks

```json
{
  "id": "tb-varian",
  "title": "Microeconomic Analysis",
  "author": "Hal R. Varian",
  "edition": "3rd",
  "year": 1992,
  "prescribed": true,
  "chaptersCovered": "Ch. 7–10",
  "notes": "Why this book matters, in Markdown.",
  "file": "content/textbooks/varian.pdf"
}
```

Note that `.gitignore` excludes `content/textbooks/*.pdf` by default, so large
scans don't bloat the repository. Delete those two lines if you do want the
PDFs committed — but check the file sizes and the copyright position first.

## Exam pattern

This is what makes generated mock papers resemble the real thing.

```json
"examPattern": {
  "durationMin": 180,
  "notes": "Markdown describing the paper.",
  "sections": [
    { "name": "Section A — Short answer", "answer": 5, "outOf": 5, "marks": 4 },
    { "name": "Section B — Long answer",  "answer": 4, "outOf": 6, "marks": 12 }
  ]
}
```

The generator fills each section with questions whose marks are close to that
section's `marks`, weighting by how often each question has recurred. Without
an `examPattern` it falls back to a flat sample of N questions.

## Workflow that works

1. Type the past-year questions in first — text, year, marks, exam type,
   chapter, topics. Even with no answers, that alone makes the question bank
   useful, and it tells you which theories matter.
2. Add `repeats` as you spot the same question twice. This is the highest-value
   ten minutes you will spend.
3. Write the theories for the topics that recur most.
4. Get the model answers written, in batches, from the questions you already
   typed.
5. Add `recall` cards last — they are quick once the theory exists, and every
   answered question becomes a card automatically anyway.

Run `python tools/validate.py` at the end of each session, then commit.
