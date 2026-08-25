# Secret Society Study Hub

> *Sub rosa* — under the rose. What is said beneath it stays there.

One offline-capable web app holding every course of the semester: the theories
that actually recur in past papers, the past-year questions themselves with
model answers written to score full marks, lecture notes, textbook exercises,
spaced-repetition drilling, and gamified mock exams generated from the real
exam pattern.

Bilingual by design — every theory can be read as fluent Bangla prose with the
economic and theoretical terminology kept in English, or as straight English,
switched with one key.

Opening it shows the seal while the content loads; click or press any key to
skip straight through.

## Running it

There is no build step and no dependencies. You need a static server only
because ES modules refuse to load over `file://`.

```bash
python tools/serve.py
```

That opens <http://localhost:8000>. Any static server works —
`npx serve`, VS Code Live Server, whatever you already have.

## Publishing to GitHub Pages

Create an empty repo at <https://github.com/new> named **`secret-society-study-hub`**,
public, with **no** README, .gitignore or licence (this repo already has its
own history). Then:

```bash
git remote add origin https://github.com/<your-username>/secret-society-study-hub.git
git push -u origin main
```

Then in the repository: **Settings → Pages → Source → GitHub Actions**. The
workflow in `.github/workflows/pages.yml` runs `tools/validate.py` first and
only deploys if the content passes, so a typo in a JSON file can never take
the live site down. First deploy takes a minute or two; after that every push
to `main` republishes.

The site lands at:

```
https://<your-username>.github.io/secret-society-study-hub/
```

Everything is relative-path and hash-routed, so it works from that sub-path
with no configuration, and `.nojekyll` stops Pages from touching the asset
folders. Verified by serving the app from a sub-directory before publishing.

**Pages needs a public repo on a free plan.** If you would rather keep it
private, the app still runs perfectly with `python tools/serve.py` — you just
do not get a shareable URL.

## Credits and sources

This repository contains material that is not mine, reproduced here for
private study and credited in place:

- **ECON 403 class notes** — handwritten notes by *Musa Ahmed Aqib* (EconDu
  101), transcribed from the shared course Drive. Each note records the source.
- **ECON 409 past papers** — 15 University of Dhaka examination papers,
  2010–2022, transcribed from scans in a shared student Drive.
- **ECON 409 lecture sheets** — linked, not reproduced; they remain in the
  original Drive folder.
- **Syllabus** — *7th Semester (FINAL SYLLABUS)*, prepared with the assistance
  of Siratul Mustaquim.

Textbook references point at the books; no textbook content is reproduced.
If you are one of the authors above and would rather this were not published,
open an issue and I will take it down.

## What is in it

| Section | What it does |
|---|---|
| **Home** | Deliberately bare — the greeting, your streak/XP/due counters, the single highest-priority chapter as a *Next up* card, and the courses. Nothing else. |
| **How this works** (`#/about`) | The method, a walkthrough of one study session, an honest coverage table generated from the files, the shortcut reference, and where your data lives |
| **The Path** | A quest map. Every chapter is a step on a winding track; missions punctuate it — **in-course** as the small mission, **midterm** as the medium one, and the **final** as the flagship. Chapter steps earn up to three crowns as you read and retain them; missions clear when you sit that paper and score half. Nothing is locked shut. |
| **Study Plan** | Ranks every chapter by *expected exam marks still on the table* — archive yield weighted for recurrence and recency, minus how ready you already are — and gives each one a single next action. Plus a frequency ranking of the questions most likely to reappear, and an exam countdown |
| **Course** | Theories filtered by chapter, difficulty, or free text |
| **Theory reader** | Bangla ⇄ English toggle, key-terminology panel, formula sheet, and the related past-year questions with model answers in a side rail — or hidden, for theory-only reading. **Reading mode** (`F`) strips the app down to a single serif column on a warm page, with adjustable type and a progress bar |
| **Question bank** | Every past question, grouped topic-wise, chapter-wise, exam-type-wise, batch-wise, year-wise or by difficulty; sortable by recency, marks, difficulty, or how often it has repeated |
| **Active recall** | Spaced repetition over recall cards and past questions, with four-way self-grading (SM-2 style scheduling) |
| **Mock exam** | Generates a fresh paper following the course's real section structure, weighted toward questions that recur; timed, with a question navigator, then self-marking against the model answers and marking schemes |
| **Notes** | Lecture notes cross-linked to the theories they explain |
| **Textbooks** | Prescribed and reference books, with their exercises indexed against theories |
| **Progress** | XP, streak, 12-week activity map, per-course mastery, weakest chapters, badges, exam history, and JSON export/import |

Works on phones and tablets: the layout is fluid, touch targets are sized for
fingers, form controls are 16px so iOS does not zoom on focus, and a search
button replaces the `/` shortcut where there is no keyboard. Verified at 375,
768 and 1280 with no horizontal overflow on any screen.

Navigation lives in a slide-out drawer at every width — the hamburger, top left — so the reading column stays centred and uncluttered.

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
| `g` then `h p m q r e n b s` | Go to home, plan, map, questions, recall, exam, notes, books, progress |
| `a` | How this works |
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
  motion.js              splash, count-ups, scroll reveals, view transitions
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
