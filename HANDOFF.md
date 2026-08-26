# Handoff

Everything needed to pick this project up in a fresh conversation, with no
prior context. Current at commit `cdd3e81`, 25 August 2026.

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
| Topic vocabulary | `python tools/topics.py --near` |
| Publish | `git push` — the Pages workflow validates, then deploys |

**Stack: none.** Vanilla ES modules, one stylesheet, no build step, no
dependencies, no npm. A deliberate choice — Node.js is not installed on the
machine, and a zero-dependency static app deploys to GitHub Pages as-is and
cannot rot. Python 3.13 is used only for the local server and the tooling.

---

## 2. Current content state

| Course | Chapters | Theories | Questions | Answered | Notes | Recall cards |
|---|---|---|---|---|---|---|
| **ECON 401** Advanced Microeconomics-I | 5 | 6 | 26 | 26 | 1 | 28 |
| **ECON 403** Advanced Macroeconomics-I | 8 | 0 | 0 | 0 | 5 | 0 |
| **ECON 405** Advanced Econometrics-I | 7 | 0 | 0 | 0 | 0 | 0 |
| **ECON 409** Environmental Economics | 21 | 10 | **108** | 19 | 16 | 43 |
| **ECON 412** Research Methodology | 13 | 0 | 0 | 0 | 0 | 0 |
| Improvement ×2 | — | — | — | — | — | — |
| **Total** | **54** | **16** | **134** | **45** | **22** | **71** |

All 45 answers carry a `source` naming the book and chapter they follow.

**ECON 401 is now built from 31 real papers, 2010–2025** — 15 finals, 10
in-course tests and 6 midterms. The `sampleContent` flag is gone. The four
originally-seeded questions had real topics but invented years, so they were
re-anchored to the sittings they actually come from rather than discarded.

**ECON 401 answers use LaTeX and generated figures.** See §5a. Every algebraic
result they assert is machine-checked — `python tools/verify_micro.py`, 29
checks, currently all passing.

**ECON 409's 17 environmental-accounting items** are `examType: "practice"`
with no year or marks — from a compiled "likely questions" list, not a sat
paper. They filter out cleanly when you want real past questions only.

---

## 3. What is left to do, in priority order

1. **Model answers for ECON 409.** 89 of 108 have none. **Follow
   `docs/ANSWER-SPEC.md`** — it fixes the textbook per course, the answer
   structure, the length calibration, the JSON shape, and the prompt to paste.
2. **Normalise the topic vocabulary first.** 116 distinct labels across 91 real
   questions, **74 used exactly once**. The frequency ranking groups by topic,
   so a split idea reads as half as important as it is — *Marketable permits*
   (3) + *Ambient permits* (1) + *Marketable ambient permits* (1) is five
   appearances showing as three. `python tools/topics.py --near` lists 23
   probable duplicates. Doing this before writing 94 answers means the priority
   order you work in is the right one.
3. **Confirm Perman is actually the ECON 409 textbook** before writing answers
   in its notation. It was inferred, not stated — see §4.
4. **ECON 401: 26 of ~56 canonical question groups are answered**, covering
   every group appearing on 4 or more of the 31 papers. All six theories now
   have bilingual bodies and recall cards (28 authored, plus one per answered
   question = a 54-card deck). What is left is the long tail appearing once or
   twice: the `f(x)=20x-x^2` problem, the firm's substitution matrix,
   Hotelling as a standalone, conditional factor demands, SAC/LAC via the
   envelope theorem, integrability, offer curves, and the two numeric
   indirect-utility questions. Run `python tools/build/frequency_micro.py` to
   regenerate the ranking.
5. **ECON 403, 405, 412 have a syllabus but no theories or questions.** No past
   papers sourced for any of them. The single biggest gap.
6. **The two improvement courses** are registered placeholders.
7. **Exam dates** are not set. `#/plan` shows a countdown once they are;
   `setExamDate(courseId, iso)` in `store.js` backs it.

**Coase theorem is done** — all 8 are answered as of `7ada69b`. The next
band down is untouched: market failure, sustainable development and WTP vs
WTA are the highest-yield topics with answers still missing.

### Highest-yield ECON 409 topics (from the 91 real past-paper questions)

| Topic | Appearances | Marks in archive |
|---|---|---|
| Coase theorem | 8 | 91 |
| Market failure | 6 | 70 |
| Sustainable development | 6 | 75 |
| WTP vs WTA | 6 | 78.5 |
| Total economic value | 5 | 62.5 |
| Contingent valuation | 5 | 60 |
| Thermodynamics / entropy | 5 | 53.5 |
| Travel cost method | 4 | 50 |

Two individual questions have appeared **six times each** — the
WTP-vs-WTA/compensating-variation question, and the
revealed-vs-stated-preference/travel-cost question.

### On the senior's question analysis

There is a question analysis in an older Drive of a senior's. The advice given
was **do not rebuild from scratch — cross-check**. This repo's analysis is
already built from the primary sources (all 15 papers), with marks, topics and
difficulty on 91/91. Redoing the transcription gains nothing.

What is genuinely uncertain is the *judgement*: which questions count as "the
same" (`repeats` is recorded on 74/91 and those calls were made by Claude, not
verified), and how topics are named. An independent analyst is exactly the
right check on both. Where he flags a recurrence this repo does not, review and
probably add it; where this repo flags one he does not, check for over-merging.

He may also know which topics *the lecturer* emphasises, which frequency data
structurally cannot see. Worth extracting even if his numbers are weaker.

---

## 4. Sources

Course structures came from **`7th Semester (FINAL SYLLABUS).pdf`** in the
shared "Economix 7.0" Drive folder, prepared with the assistance of Siratul
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
instead. Expect the same and use the browser.

### Inferred, not stated — verify before relying on them

- **Varian for ECON 401 is CONFIRMED, no longer inferred.** Read from the
  student's Drive: *Varian Microeconomic Analysis(Selected Chapters).pdf*
  (folder `1CEY77vMwnl7qeVl9BZ1GNQZxUdAEGfq4`). **That PDF holds only ch. 1, 2,
  7 and 8.** Cost minimisation, the cost function, Shephard, Hotelling and WAPM
  are examined but are in ch. 3–6 and are *not* in the file — three answers say
  so on their face. Sections present: 1.1–1.9, 2.1–2.2, 7.1–7.5, 8.1, 8.3–8.9.
- **Perman, Ma, McGilvray & Common** as the ECON 409 textbook, matched from the
  syllabus's own *"Chapter 5: Welfare Economics and environment"* and
  *"Pollution Control: Targets (up to 6.11)"*. **All 14 ECON 409 answers cite
  it. Confirm before writing 94 more.**
- **Lune & Berg** for ECON 412 — the syllabus prints *"Luna Berg"*.
- **Angrist & Pischke** for ECON 412 topic 8 — title not given; assumed
  *Mostly Harmless Econometrics*, could be *Mastering 'Metrics*.
- All `examPattern` blocks except ECON 409's are **placeholders**. ECON 409's
  is real: 50 marks, 3 hours, any four of six or seven at 12.5 each, stable
  2011–2021, with 2010 and 2020 as documented departures.

---

## 5. Architecture

```
index.html               app shell, splash overlay, topbar, drawer
sw.js                    service worker (stale-while-revalidate shell,
                         network-first content)
assets/css/app.css       one stylesheet, layered and labelled
assets/js/
  main.js                bootstrap, theme, drawer, routes, palette, shortcuts
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
docs/
  AUTHORING.md           content guide, also rendered in-app at #/help
  ANSWER-SPEC.md         how a question becomes a full-marks answer
tools/
  serve.py               local server (threaded, no-cache)
  validate.py            content + answer-quality validator
  topics.py              topic vocabulary audit
  new_course.py          scaffold a course
  build/                 the one-shot generators that produced the content
```

### Design decisions and why

- **Hash routing** so the app works from any sub-path on GitHub Pages with no
  configuration, and from the file system.
- **All paths relative.** Verified by serving from a parent directory before
  publishing — the usual way a Pages deploy breaks.
- **Ids are the glue.** A theory lists its `questionIds`, a question lists its
  `theoryIds`; `hydrate()` merges both directions, so a link is recorded once.
- **`{{English Term}}`** in Bangla prose renders gold and upright. Reason in
  Bangla, keep the exam vocabulary in English in front of you.
- **Nothing is hard-locked** on The Path. A future node still opens. This is
  revision, not a game you can lose.
- **Everything is local.** No account, no server, no analytics. Progress lives
  in `localStorage`; export a backup from `#/progress`.
- **Quest-map geometry is computed from the viewport**, not fixed and scaled.

### 5a. Maths, figures and machine-checked answers  (added for ECON 401)

- **`vendor/katex/`** — KaTeX 0.16.11 vendored, fonts included, ~600 KB. Not a
  CDN: the app must render formulas offline. Listed in `sw.js` as `MATH`.
- **`assets/js/math.js`** — lazy-loads KaTeX and hydrates `.math` nodes *after*
  render, so `md()` stays synchronous. `wireMath()` renders what is visible and
  defers the inside of a collapsed `<details>` until it opens — a question bank
  holds every answer in the DOM at once, which is thousands of formulas.
- **`markdown.js`** — `$…$` and `$$…$$`, plus `![caption](content/figures/x.svg)`.
  **Math is extracted before HTML-escaping and restored after**; leave that
  ordering alone or `rac{a}{b}` gets eaten by the `_` → `<em>` rule. Math
  inside fenced code and backticks is deliberately untouched.
- **`tools/build/figstyle.py` + `figures_micro.py`** — matplotlib/networkx to
  SVG. Structural colour is drawn in a sentinel and swapped for `currentColor`,
  so figures inherit the page's text colour and read in both themes. Intrinsic
  `pt` sizes are stripped so they scale from `viewBox` + CSS.
- **`tools/verify_micro.py`** — symbolic checks of the algebra. Symbolic first,
  then sampling at 40 random points, because `powsimp` stalls on nested
  fractional powers and reports "not equal" when it means "cannot decide". Six
  true results are only provable the second way.
- **Reading comfort** — `focus` (spotlight one block, key **D**), `readFont`,
  `readSpacing`. The dim rule is *"dim the siblings of the marked block"*,
  guarded by `:has(.focus-on)`, so nothing is hidden when script does not run.

### Schema fields that carry more weight than they look

- **`repeats`** — other years a question appeared. Drives the badge, the
  *Most repeated* sort, the Study Plan ranking and the mock-exam weighting.
- **`answerPoints`** — the full-marks checklist; the rubric for self-marking.
- **`source`** — the book and chapter an answer follows.
- **`examType: "practice"`** — never actually sat. Leave `year`/`marks` empty.
- **Recall card ids are positional** — `courseId:theoryId:r{index}`, built in
  `content.js`. Appending a card to a deck is safe, but **reordering or
  deleting one silently reassigns every later card's SRS history**. Add at the
  end, or accept that review scheduling for that theory resets.
- **`sampleContent: true`** on a course — shows the seeded-questions banner.

---

## 6. Bugs found and fixed — do not reintroduce

1. **`.palette { display: flex }` defeated the `hidden` attribute.** The UA rule
   for `[hidden]` is element specificity; a class beats it. The search overlay
   covered the page permanently. Fixed with `[hidden]{display:none!important}`
   at the top of the reset. **Any new class setting `display` on an element
   that also uses `hidden` hits this.**
2. **`tools/serve.py` wedged.** Single-threaded `TCPServer`; the app requests a
   dozen modules in parallel and one stalled connection blocked everything
   after. Port stayed open, nothing served. Now `ThreadingHTTPServer`.
3. **The splash depended on JS to remove itself.** When the server wedged, an
   opaque layer sat over the app with no way past. Now has a CSS keyframe
   backstop at six seconds. **An overlay must never depend on script to get out
   of the way.**
4. **Animated content starts at `opacity: 0`.** A missed `IntersectionObserver`
   would hide a section permanently. `observeIn()` reveals anything already on
   screen synchronously and force-reveals the rest after two seconds.
5. **The count-up rendered `0` and animated upward**, so a page with no
   animation frame showed `0` instead of `112`. Now renders the true figure.
6. **Duplicate `style` attribute** on quest-map mission nodes silently dropped
   `--msz`. The browser keeps the first attribute and discards the second.
7. **The `\2756` CSS escape** was mis-parsed into `½6`. Now the literal `❖`
   plus `@charset "utf-8"`.
8. **GitHub Pages 404 after a successful deploy.** Source was "Deploy from a
   branch → main → /docs", and `docs/` has no `index.html`. Two builders ran and
   the classic one won. **Switching the source does not itself rebuild** — an
   empty commit was needed. The workflow now passes `enablement: true`.
9. **Mobile chrome.** Topbar overran 375px by ~20px, search was unreachable
   without a keyboard, form controls were under 16px (iOS zooms and never
   zooms back), touch targets were 25–36px. Fixed in the `7b` layer.
10. **The quest map used `transform: scale()` on phones.** That scales painted
    pixels but not the layout box — 629px of dead space below the track on a
    412px screen — and the 122px step was shorter than a node's ~140px height,
    so five pairs overlapped. Geometry now computed from the viewport.
11. **The "Next up" card rendered one character per line.** Its CSS assumed the
    subtitle was nested inside the title; they were loose flex siblings, so the
    subtitle held its content width and squeezed the title to nothing, and
    `overflow-wrap:anywhere` then broke it per character. **Never apply
    anywhere-breaking to a heading.**

### Testing notes

The in-app Browser pane **does not composite frames**. `requestAnimationFrame`
never fires and CSS transitions freeze at their start value, so
`getComputedStyle` returns stale values mid-transition. Two "bugs" were chased
that were only this. Verify animation *wiring* (class applied, attribute
present), not the animated result.

The browser also caches ES modules aggressively. If an edit is not taking
effect, serve on a **fresh port** rather than trusting a reload.

**Measurement cannot catch everything.** Every route measured clean at 320,
375, 412, 768 and desktop while the "Next up" card was rendering vertically —
because a broken layout inside its container produces no overflow. A screenshot
from the actual phone found it in one round trip.

---

## 7. Known cosmetic issues

- **Commit author email** is `yousha128@gmail.com`, the identity configured in
  the repo, but the GitHub account is `akhyear-rahman`. If commits do not show
  against the profile, add that address under **Settings → Emails** and GitHub
  relinks them retroactively. No history rewrite needed.
- **Four answers sit outside the validator's length band** — two ECON 401
  answers run short (229 and 294 words for 12 marks), two low-mark ECON 409
  answers run long. Warnings, not errors; both are worth a look.

---

## 8. Starting the next conversation

Paste this:

> I'm continuing work on my study app. The repo is at
> `C:\Users\JB PLC\Desktop\New folder (2)\Claude` and published at
> https://akhyear-rahman.github.io/secret-society-study-hub/
>
> Read `HANDOFF.md` in the repo root first — full state, what's done, what's
> left, and the bugs already fixed. If the task is writing model answers, read
> `docs/ANSWER-SPEC.md` too. Then <your task>.

For a batch of new questions specifically:

> Here are past-year questions from **{COURSE}**, {sitting}, worth {marks}
> each. Follow `docs/ANSWER-SPEC.md`. Answer from **{book}**, using its
> notation and staying inside the syllabus limits. Give me the complete JSON
> object for each — `answerPoints` as the full-marks checklist, `answer` in
> markdown at the length the marks justify, `source` naming book and chapter,
> `topics` from the existing vocabulary, `repeats` if it has appeared before.
> Work in priority order, highest frequency first.

```bash
python tools/validate.py
```

```bash
python tools/topics.py --near
```

```bash
python tools/serve.py
```
