# Semester 7 Study Hub

One offline-capable web app holding every course of the semester: the theories
that actually recur in past papers, the past-year questions themselves with
model answers written to score full marks, lecture notes, textbook exercises,
spaced-repetition drilling, and gamified mock exams generated from the real
exam pattern.

Bilingual by design — every theory can be read as fluent Bangla prose with the
economic and theoretical terminology kept in English, or as straight English,
switched with one key.

## Running it

There is no build step and no dependencies. You need a static server only
because ES modules refuse to load over `file://`.

```bash
python tools/serve.py
```

That opens <http://localhost:8000>. Any static server works —
`npx serve`, VS Code Live Server, whatever you already have.

## Publishing to GitHub Pages

```bash
git init
git add .
git commit -m "Semester 7 study hub"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

Then in the repository: **Settings → Pages → Source → GitHub Actions**. The
workflow in `.github/workflows/pages.yml` publishes on every push to `main`,
validating the content first so a broken JSON file never goes live.

The site works from any sub-path (`/<repo>/`) because routing is hash-based,
and `.nojekyll` stops Pages from touching the asset folders.

## What is in it

| Section | What it does |
|---|---|
| **Dashboard** | Every course, progress per course, what is due today |
| **Study Plan** | Ranks every chapter by *expected exam marks still on the table* — archive yield weighted for recurrence and recency, minus how ready you already are — and gives each one a single next action. Plus a frequency ranking of the questions most likely to reappear, and an exam countdown |
| **Course** | Theories filtered by chapter, difficulty, or free text |
| **Theory reader** | Bangla ⇄ English toggle, key-terminology panel, formula sheet, and the related past-year questions with model answers in a side rail — or hidden, for theory-only reading. **Reading mode** (`F`) strips the app down to a single serif column on a warm page, with adjustable type and a progress bar |
| **Question bank** | Every past question, grouped topic-wise, chapter-wise, exam-type-wise, batch-wise, year-wise or by difficulty; sortable by recency, marks, difficulty, or how often it has repeated |
| **Active recall** | Spaced repetition over recall cards and past questions, with four-way self-grading (SM-2 style scheduling) |
| **Mock exam** | Generates a fresh paper following the course's real section structure, weighted toward questions that recur; timed, with a question navigator, then self-marking against the model answers and marking schemes |
| **Notes** | Lecture notes cross-linked to the theories they explain |
| **Textbooks** | Prescribed and reference books, with their exercises indexed against theories |
| **Progress** | XP, streak, 12-week activity map, per-course mastery, weakest chapters, badges, exam history, and JSON export/import |

Everything you do is stored in your browser's `localStorage`. Nothing is sent
anywhere. Export a backup from **Progress → Your data** before switching
devices or clearing site data.

### Keyboard

| Key | Action |
|---|---|
| `/` or `Ctrl/Cmd K` | Search everything |
| `t` | Cycle theme: dark → light → follow system |
| `l` | Toggle Bangla / English |
| `f` | Reading mode on/off |
| `+` / `-` | Reading type size |
| `esc` | Leave reading mode or close search |
| `g` then `h p q r e n b s` | Go to home, plan, questions, recall, exam, notes, books, progress |
| `space` | Reveal a recall card |
| `1`–`4` | Grade a revealed card |

## Adding your content

Everything lives in JSON under `content/`. Read **[docs/AUTHORING.md](docs/AUTHORING.md)**
— it is also rendered inside the app at `#/help`.

The short version:

1. Register a course in `content/index.json` (or run
   `python tools/new_course.py <id> "<CODE>" "<Title>"`).
2. Copy `content/courses/_template.json` to `content/courses/<id>.json`.
3. Fill in chapters, theories, questions, exercises, notes, textbooks.
4. `python tools/validate.py` — catches broken references, duplicate ids, and
   flags questions still missing a model answer.
5. Commit and push; Pages redeploys.

### Where each course stands

| Course | Syllabus | Questions | Notes | Theories |
|---|---|---|---|---|
| **ECON 401** Advanced Micro | 5 chapters (Varian 7, 8, 1, 2, 4) | 4 — **seeded examples, not real papers** | 1 | 2 |
| **ECON 403** Advanced Macro | 8 chapters (Mankiw 9e + Romer 5e) | — | 5 imported class notes, lectures 1–13 | — |
| **ECON 405** Advanced Econometrics | 7 blocks (Wooldridge) | — | — | — |
| **ECON 409** Environmental | 21 chapters | **108**, from 15 papers 2010–2022; **14 with model answers** | 16 — syllabus, 12 lecture sheets, 2 class-note sets, all linked to Drive | **10**, bilingual, 43 recall cards |
| **ECON 412** Research Methodology | 13 topics | — | — | — |
| Improvement ×2 | — | — | — | — |

Advanced Micro is flagged `"sampleContent": true`, which shows a warning banner
in the app — its chapter structure is real but the questions on it are written
examples with invented years. Delete the flag once real papers replace them.

Environmental Economics has the full past-paper archive and model answers for
the fourteen highest-frequency questions; the remaining 94 are still to write. Its 17 environmental-accounting items are tagged
`practice` rather than given a year, because they come from a compiled "likely
questions" list rather than a sat paper.

## Project layout

```
index.html               app shell
sw.js                    service worker (offline)
assets/css/app.css       single stylesheet
assets/js/
  main.js                bootstrap, routing table, command palette, shortcuts
  router.js              hash router
  store.js               localStorage: settings, SRS, XP, badges, exams
  content.js             content loading, indexing, search, filtering
  markdown.js            markdown renderer + the {{English Term}} extension
  priority.js            exam-yield engine behind the Study Plan
  reading.js             distraction-free reading mode
  ui.js                  shared render helpers
  views/                 one module per screen, lazily imported
content/                 all your material
docs/AUTHORING.md        the content guide
tools/                   serve.py, validate.py, new_course.py
```

## Why no framework

No `npm install`, so nothing rots. The app is a dozen small ES modules the browser
loads directly; views are code-split by dynamic `import()`, so a page costs
only what it uses. It will still run in five years, and it runs on a phone with
no signal.
