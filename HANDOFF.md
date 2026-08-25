# Handoff

Everything needed to pick this project up in a fresh conversation, with no
prior context. Written 25 August 2026, at commit `378a522`.

---

## 1. What this is

**Secret Society Study Hub** — an offline-capable study web app for Semester 7,
BSS Economics, University of Dhaka. Built around past-year exam papers rather
than around chapter order.

| | |
|---|---|
| Live site | <https://akhyear-rahman.github.io/secret-society-study-hub/> |
| Repository | <https://github.com/akhyear-rahman/secret-society-study-hub> |
| Local path | `C:\Users\JB PLC\Desktop\New folder (2)\Claude` |
| Run locally | `python tools/serve.py` → <http://localhost:8000> |
| Validate content | `python tools/validate.py` |
| Publish | `git push` — the Pages workflow validates then deploys |

**Stack: none.** Vanilla ES modules, one stylesheet, no build step, no
dependencies, no npm. This was a deliberate choice — Node.js is not installed
on the machine, and a zero-dependency static app deploys to GitHub Pages as-is
and cannot rot. Python 3.13 is available and is used only for the local server
and the content validator.

---

## 2. Current content state

Generated from the files themselves; the app shows the same table at `#/about`.

| Course | Chapters | Theories | Questions | Answered | Notes | Recall cards |
|---|---|---|---|---|---|---|
| **ECON 401** Advanced Microeconomics-I | 5 | 2 | 4 *(seeded, not real)* | 4 | 1 | 8 |
| **ECON 403** Advanced Macroeconomics-I | 8 | 0 | 0 | 0 | 5 | 0 |
| **ECON 405** Advanced Econometrics-I | 7 | 0 | 0 | 0 | 0 | 0 |
| **ECON 409** Environmental Economics | 21 | 10 | **108** | 14 | 16 | 43 |
| **ECON 412** Research Methodology | 13 | 0 | 0 | 0 | 0 | 0 |
| Improvement ×2 | — | — | — | — | — | — |
| **Total** | **54** | **12** | **112** | **18** | **22** | **51** |

**ECON 401's four questions are invented examples, not real past papers.** The
years and batches on them are fabricated. The course carries
`"sampleContent": true`, which shows a warning banner in the app. Delete that
flag once real papers replace them.

**ECON 409's 17 environmental-accounting items** are `examType: "practice"`
with no year or marks — they came from a compiled "likely questions" list, not
a sat paper. They filter out cleanly when you want real past questions only.

---

## 3. What is left to do, in priority order

1. **Model answers for ECON 409.** 94 of 108 questions still have none. The 14
   written cover the highest-frequency topics. Work down the frequency ranking
   at `#/plan` — Coase theorem is 8 appearances and 91 marks of the archive.
   **Follow `docs/ANSWER-SPEC.md`** — it carries the textbook per course, the
   answer structure, the length calibration, the JSON shape and the prompt to
   paste. `python tools/topics.py --near` before adding topic labels.
2. **ECON 403, 405, 412 have syllabus but no theories or questions.** No past
   papers have been sourced for any of them. That is the single biggest gap.
3. **ECON 401 needs real past papers** to replace the seeded four.
4. **The two improvement courses** are registered placeholders — no details
   supplied yet.
5. **Exam dates** are not set. `#/plan` shows a countdown once they are;
   `setExamDate(courseId, iso)` in `store.js` backs it.

### Highest-yield ECON 409 topics (from the 82 real final-exam questions)

| Topic | Appearances | Marks in archive |
|---|---|---|
| Coase theorem | 8 | 91 |
| WTP vs WTA | 6 | 78.5 |
| Sustainable development | 6 | 75 |
| Total economic value | 5 | 62.5 |
| Contingent valuation | 5 | 60 |
| Thermodynamics / entropy | 5 | 53.5 |
| Travel cost method | 4 | 50 |

Two individual questions have appeared **six times each** — the
WTP-vs-WTA/compensating-variation question and the revealed-vs-stated-
preference/travel-cost question.

---

## 4. Sources

All course structures came from **`7th Semester (FINAL SYLLABUS).pdf`** in the
shared "Economix 7.0" Drive folder
(`16uB2yBsfIN3p7fgrMG9cLj1ZZHHJvyir`), prepared with the assistance of Siratul
Mustaquim.

| Source | Drive id | Used for |
|---|---|---|
| Economix 7.0 (root) | `16uB2yBsfIN3p7fgrMG9cLj1ZZHHJvyir` | Syllabus for 401, 403, 405, 412 |
| ECON 403 full class note | `1rb_8Zb-PtPZPSyMQLJU8645b9ef89YHM` | Imported as 5 chapter notes (~77k chars, lectures 1–13) |
| 409 Environmental Economics | `1Aevcq2-fAQDH5cnqgEmtGht5FCxtGxxb` | Everything for ECON 409 |
| 409 · Previous Years/Questions | `1klUGoumOcM06aXP9SwjjQCz_G8xTjk_j` | 15 past papers, 2010–2022 |
| 409 · Lecturesheets/98th | `1-1KVvGYIYIgZgZK32WCNTcV_T6GAGvTb` | 12 lecture sheets, linked not copied |
| 409 · 97th syllabus screenshot | `1HMBl0Fpse5PGjbgXatvCtnIeM4epizW4` | The 21-chapter spine |
| ECON 412 Lecture Materials | `1mANqmFCSHcEbZDr3DGQWxGh5juIXc-YY` | **Not readable** from the session |
| ECON 412 Reading Materials | `1Bk9PlJGvVBknAZHi5PbgVmYlPX3jJPbW` | **Not readable** from the session |

The 409 folder is owned by another account and is link-shared, so the Drive
search API could not enumerate it — the file list was read through the browser
instead. If a future session needs it, expect the same and use the browser.

### Things inferred, not stated — verify before relying on them

- **Perman, Ma, McGilvray & Common** identified as the ECON 409 textbook by
  matching the syllabus's *"Chapter 5: Welfare Economics and environment"* and
  *"Pollution Control: Targets (up to 6.11)"* against its numbering.
- **Lune & Berg** for ECON 412 — the syllabus prints *"Luna Berg"*.
- **Angrist & Pischke** for ECON 412 topic 8 — the title is not given; assumed
  *Mostly Harmless Econometrics*, but it could be *Mastering 'Metrics*.
- All four `examPattern` blocks except ECON 409's are **placeholders**. ECON
  409's is real: 50 marks, 3 hours, any four of six or seven at 12.5 each,
  stable 2011–2021, with 2010 and 2020 as documented departures.

---

## 5. Architecture

```
index.html               app shell, splash overlay, topbar, drawer
sw.js                    service worker (offline; stale-while-revalidate shell,
                         network-first content)
assets/css/app.css       ~1100 lines, one file, layered and labelled
assets/js/
  main.js                bootstrap, theme, drawer, router table, palette,
                         keyboard shortcuts
  router.js              hash router
  store.js               localStorage: settings, SRS, XP, badges, exams
  content.js             loads and hydrates course JSON, search index
  priority.js            exam-yield engine behind the Study Plan
  reading.js             distraction-free reading mode
  motion.js              splash, count-ups, scroll reveals, view transitions
  markdown.js            markdown renderer + the {{English Term}} extension
  ui.js                  shared render helpers
  views/                 one module per screen, lazily imported
content/
  index.json             course registry + site config
  courses/*.json         one file per course — all the material
docs/AUTHORING.md        content guide, also rendered in-app at #/help
tools/
  serve.py               local server (threaded, no-cache)
  validate.py            content validator
  new_course.py          scaffold a course
  build/                 the one-shot generators that produced the content
```

### Key design decisions and why

- **Hash routing** (`#/plan`) so the app works from any sub-path on GitHub
  Pages with no configuration, and from the file system.
- **All paths relative.** Verified by serving from a parent directory before
  publishing — this is the usual way a Pages deploy breaks.
- **Ids are the glue.** A theory lists its `questionIds`, a question lists its
  `theoryIds`; `hydrate()` merges both directions, so a link only needs
  recording once.
- **`{{English Term}}`** in Bangla prose renders gold and upright. This is the
  point of the bilingual design: reason in Bangla, keep the exam vocabulary in
  English in front of you.
- **Nothing is hard-locked** on The Path. A future node still opens. This is
  revision, not a game you can lose.
- **Everything is local.** No account, no server, no analytics. Progress lives
  in `localStorage`; export a backup from `#/progress` before switching device.

### Content schema

Fully documented in `docs/AUTHORING.md`. The parts that carry more weight than
they look:

- **`repeats`** on a question — the other years it appeared. Drives the
  `↻ repeated ×3` badge, the *Most repeated* sort, the Study Plan ranking and
  the mock-exam weighting. Recording these is the highest-value ten minutes
  available.
- **`answerPoints`** — the marking scheme, shown as a green box above the
  answer and used as the rubric when self-marking a mock exam.
- **`examType: "practice"`** — for anything never actually sat. Leave `year`
  and `marks` empty.
- **`sampleContent: true`** on a course — shows the "seeded, not real papers"
  banner.

---

## 6. Bugs found and fixed — do not reintroduce these

Each one cost real debugging time.

1. **`.palette { display: flex }` defeated the `hidden` attribute.** The UA
   rule for `[hidden]` is element specificity and a class beats it, so the
   search overlay covered the page permanently. Fixed with
   `[hidden]{display:none!important}` at the top of the reset. **Any new class
   that sets `display` on an element that also uses `hidden` will hit this.**

2. **`tools/serve.py` wedged.** It used single-threaded `TCPServer`; the app
   requests a dozen modules in parallel and one stalled connection blocked
   every subsequent request. The port stayed open and nothing was ever served
   again. Now `ThreadingHTTPServer`.

3. **The splash overlay depended on JS to remove itself.** When the server
   wedged, the scripts never ran and an opaque layer sat over the app with no
   way to click past. It now has a CSS keyframe backstop that clears it after
   six seconds regardless. **An overlay must never depend on script to get out
   of the way.**

4. **Animated content starts at `opacity: 0`.** A missed `IntersectionObserver`
   would hide a section permanently. `observeIn()` in `motion.js` reveals
   anything already on screen synchronously and force-reveals the rest after
   two seconds.

5. **The count-up rendered `0` and animated upward**, so a page that never got
   an animation frame showed `0` instead of `112`. It now renders the true
   figure and animates from it.

6. **Duplicate `style` attribute** on the quest-map mission nodes silently
   dropped `--msz`, making all three mission tiers the same size. The browser
   keeps the first attribute and discards the second.

7. **The `\2756` CSS escape** was mis-parsed into `½6`. Replaced with the
   literal `❖` plus `@charset "utf-8"`.

8. **GitHub Pages 404 after a successful deploy.** The Pages source was
   "Deploy from a branch → main → /docs", and `docs/` holds one markdown file
   and no `index.html`. Two builders were running and the classic one won.
   Fixed by switching the source to GitHub Actions — **and note that switching
   the source does not itself rebuild**; an empty commit was needed to force a
   deploy. The workflow now passes `enablement: true` so a fresh clone
   self-configures.

9. **Mobile:** the topbar overran 375px by ~20px, search was unreachable
   without a keyboard, every form control was under 16px (which makes iOS zoom
   and never zoom back), and touch targets were 25–36px. All fixed in the
   `7b phones and tablets` layer at the end of `app.css`.

### Testing note for the next session

The in-app Browser pane **does not composite frames**. `requestAnimationFrame`
never fires and CSS transitions freeze at their start value, so
`getComputedStyle` returns stale values for anything mid-transition. Two
"bugs" were chased that were only this. Verify animation *wiring* (class
applied, attribute present) rather than the animated result, and check the
real browser for how it looks.

The browser also caches ES modules aggressively. If an edit is not taking
effect, serve on a **fresh port** rather than trusting a reload.

---

## 7. Known cosmetic issues

- *(Fixed 25 Aug)* The Path used a CSS `transform: scale()` on narrow screens,
  which shrank the pixels but not the layout box — 629px of dead space below
  the track on a 412px phone — and its 122px vertical step was shorter than a
  node is tall, so five nodes overlapped. Geometry is now computed from the
  viewport in `path.js` and redrawn on rotation.
- **Commit author email** is `yousha128@gmail.com`, the identity configured in
  the repo, but the GitHub account is `akhyear-rahman`. If the commits do not
  show against the profile, add that address under **Settings → Emails** and
  GitHub relinks them retroactively. No history rewrite needed.

---

## 8. Starting the next conversation

Paste this:

> I'm continuing work on my study app. The repo is at
> `C:\Users\JB PLC\Desktop\New folder (2)\Claude` and published at
> https://akhyear-rahman.github.io/secret-society-study-hub/
>
> Read `HANDOFF.md` in the repo root first — it has the full state, what's
> done, what's left, and the bugs already fixed. Then <your task>.

Useful first commands:

```bash
python tools/validate.py
```

```bash
python tools/serve.py
```

```bash
git log --oneline
```
