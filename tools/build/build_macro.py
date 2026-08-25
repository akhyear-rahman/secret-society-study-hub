"""Build ECON 403 from the syllabus, importing the class note as lecture notes."""
import json
import re
from pathlib import Path

ROOT = Path(r"C:\Users\JB PLC\Desktop\New folder (2)\Claude")
NOTE = Path(r"C:\Users\JB PLC\.claude\projects\C--Users-JB-PLC-Desktop-New-folder--2--Claude"
            r"\94c2b6f6-192b-4bba-a35c-b77ec8b92878\tool-results"
            r"\mcp-5abd85e3-02f1-4d37-9388-609dfeafe063-read_file_content-1787599697660.txt")

raw = json.loads(NOTE.read_text(encoding="utf-8"))["fileContent"]

chapters = [
    {"id": "m10", "no": 10, "title": "Introduction to Economic Fluctuations",
     "titleBn": "অর্থনৈতিক ওঠানামার সূচনা", "ref": "Mankiw 9e · Ch. 10, §10.1–10.5",
     "summary": "Business cycles, Okun's law, the AD/AS framework and the role of stabilisation policy."},
    {"id": "m11", "no": 11, "title": "Aggregate Demand I: Building the IS–LM Model",
     "titleBn": "সমষ্টিগত চাহিদা ১: IS–LM মডেল গঠন", "ref": "Mankiw 9e · Ch. 11, §11.1–11.3",
     "summary": "The Keynesian cross, the IS curve, the theory of liquidity preference and the LM curve."},
    {"id": "m12", "no": 12, "title": "Aggregate Demand II: Applying the IS–LM Model",
     "titleBn": "সমষ্টিগত চাহিদা ২: IS–LM মডেলের প্রয়োগ", "ref": "Mankiw 9e · Ch. 12, §12.1–12.2",
     "summary": "Shocks and policy in IS–LM, and the link from IS–LM to the aggregate demand curve."},
    {"id": "m13", "no": 13, "title": "The Open Economy Revisited: Mundell–Fleming",
     "titleBn": "উন্মুক্ত অর্থনীতি: মুন্ডেল–ফ্লেমিং মডেল", "ref": "Mankiw 9e · Ch. 13, §13.1–13.5",
     "summary": "The small open economy under floating and fixed exchange rates, and the impossible trinity."},
    {"id": "r11", "no": 11, "title": "Unemployment",
     "titleBn": "বেকারত্ব", "ref": "Romer 5e · Ch. 11, §11.1 (to Eq. 11.11 inclusive) and §11.2",
     "summary": "Theories of the natural rate: efficiency wages and the Shapiro–Stiglitz shirking model."},
    {"id": "m8", "no": 8, "title": "Economic Growth I: Capital Accumulation",
     "titleBn": "অর্থনৈতিক প্রবৃদ্ধি ১", "ref": "Mankiw 9e · Ch. 8, §8.1–8.3",
     "summary": "The Solow model, the steady state and the Golden Rule. The numerical example is optional reading."},
    {"id": "m9", "no": 9, "title": "Economic Growth II: Technology and Empirics",
     "titleBn": "অর্থনৈতিক প্রবৃদ্ধি ২", "ref": "Mankiw 9e · Ch. 9, §9.1 + Appendix",
     "summary": "Technological progress in the Solow model, plus the Growth Accounting appendix — "
                "increases in the factors of production, in capital and labour, and technological progress."},
    {"id": "m14", "no": 14, "title": "Aggregate Supply and the Short-Run Trade-off",
     "titleBn": "সমষ্টিগত যোগান ও স্বল্পমেয়াদি বিনিময়", "ref": "Mankiw 9e · Ch. 14, §14.1–14.2",
     "summary": "Sticky-price and imperfect-information models of aggregate supply, and the "
                "Phillips curve — up to the end of the explanation of Figure 14.5."},
]

# ---- split the class note into one entry per chapter it covers -------------
# Boundaries are the note's own "Chapter N …" headings.
BOUNDS = [
    ("m10", r"Chapter 10 Introduction to Economic Fluctuations", "Chapter 10 — Introduction to Economic Fluctuations"),
    ("m11", r"Chapter 11 Aggregate Demand I", "Chapter 11 — Aggregate Demand I: Building the IS–LM Model"),
    ("m12", r"Chapter 12 Aggregate Demand II", "Chapter 12 — Aggregate Demand II: Applying the IS–LM Model"),
    ("m13", r"Chapter 13 The Open Economy Revisited", "Chapter 13 — The Open Economy Revisited: Mundell–Fleming"),
    ("r11", r"Chapter 10 UNEMPLOYMENT", "Romer Ch. 11 — Unemployment"),
]

starts = []
for cid, pattern, title in BOUNDS:
    m = re.search(pattern, raw)
    if not m:
        raise SystemExit(f"boundary not found: {pattern}")
    starts.append((m.start(), cid, title))
starts.sort()

# UTF-8 bytes that were re-decoded as Latin-1 somewhere in the PDF pipeline.
# The bytes survived intact, so encoding back to Latin-1 and decoding as UTF-8
# restores the original characters (math italics, en dashes, emoji).
MOJIBAKE = re.compile(r"[Â-ô][-¿]{1,3}")


def unmojibake(text: str) -> str:
    def fix(m):
        try:
            return m.group(0).encode("latin-1").decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            return m.group(0)
    return MOJIBAKE.sub(fix, text)


def tidy(text: str) -> str:
    """Turn the flat PDF extraction into readable Markdown."""
    # The extractor emits blank-line-separated blocks; keep them as paragraphs.
    text = unmojibake(text.replace("\r\n", "\n"))
    # Drop the PDF's page numbers, which land as bare numeric lines.
    text = re.sub(r"\n\s*\d{1,3}\s*(?=\n)", "\n", text)
    # Promote the note's own lecture markers to sub-headings. The date sits
    # just before the marker and is written inconsistently (19.8. 2025,
    # 26.8.205, 3.9.25), so match it loosely and keep it verbatim.
    text = re.sub(
        r"\n\s*(?:Date:\s*)?(\d{1,2}\.\s?\d{1,2}\.\s?\d{2,4})?\s*Lecture\s*NO[:.]?\s*0?(\d+)\s*",
        lambda m: f"\n\n### Lecture {int(m.group(2))}"
                  + (f" · {m.group(1).strip()}" if m.group(1) else "") + "\n\n",
        text)
    text = re.sub(r"\(?Chapter \d+ ends here\)?", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

notes = []
for i, (pos, cid, title) in enumerate(starts):
    end = starts[i + 1][0] if i + 1 < len(starts) else len(raw)
    body = tidy(raw[pos:end])
    notes.append({
        "id": f"n-{cid}",
        "chapterId": cid,
        "title": f"Class note — {title}",
        "date": "2025-08-17",
        "source": "Class note · Musa Ahmed Aqib (EconDu 101)",
        "theoryIds": [],
        "tags": ["class-note"],
        "file": "",
        "body": "> Imported from **403 (Full note).pdf** in your Drive. Text extracted from the "
                "PDF, so check any equation or figure reference against the original.\n\n" + body,
    })

course = {
    "id": "adv-macro",
    "code": "ECON 403",
    "title": "Advanced Macroeconomics-I",
    "titleBn": "উচ্চতর সামষ্টিক অর্থনীতি-১",
    "color": "#3ddc97",
    "credits": 4,
    "semester": 7,
    "description": (
        "Chapter structure taken from **7th Semester (FINAL SYLLABUS)**. Seven chapters from "
        "Mankiw's *Macroeconomics* (9th edition) plus the unemployment chapter from Romer's "
        "*Advanced Macroeconomics* (5th edition).\n\n"
        "> **Case studies are not included** in the syllabus.\n\n"
        "The class notes below were imported from *403 (Full note).pdf* and cover lectures 1–13 "
        "(chapters 10, 11, 12, 13 and Romer's unemployment chapter). Growth (Ch. 8–9) and "
        "aggregate supply (Ch. 14) are not in the note yet."
    ),
    "examPattern": {
        "durationMin": 180,
        "notes": "**Placeholder — confirm before relying on it.** The class note records only that "
                 "the *in-course is held about a month after the mid*. Replace this section once "
                 "you have a real past paper.",
        "sections": [
            {"name": "Section A — Short answer (compulsory)", "answer": 5, "outOf": 5, "marks": 4},
            {"name": "Section B — Long answer (any four)", "answer": 4, "outOf": 6, "marks": 12},
        ],
    },
    "chapters": chapters,
    "textbooks": [
        {"id": "tb-mankiw", "title": "Macroeconomics", "author": "N. Gregory Mankiw",
         "edition": "9th", "year": 2016, "prescribed": True,
         "chaptersCovered": "Ch. 8, 9, 10, 11, 12, 13, 14",
         "notes": "The main text for seven of the eight chapters. Case studies are excluded from "
                  "the syllabus, so skip them on a first pass.",
         "file": "", "url": ""},
        {"id": "tb-romer", "title": "Advanced Macroeconomics", "author": "David Romer",
         "edition": "5th", "year": 2018, "prescribed": True,
         "chaptersCovered": "Ch. 11 — Unemployment (§11.1 to Eq. 11.11, and §11.2)",
         "notes": "Prescribed only for unemployment. Note the syllabus cut-off: §11.1 runs to "
                  "Equation 11.11 inclusive. The class note follows the 4th edition's Ch. 10, "
                  "which is the same material.",
         "file": "", "url": ""},
    ],
    "theories": [],
    "questions": [],
    "exercises": [],
    "notes": notes,
}

dest = ROOT / "content/courses/adv-macro.json"
dest.write_text(json.dumps(course, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
sizes = " · ".join(f"{n['chapterId']}:{len(n['body']):,}c" for n in notes)
print(f"wrote {dest.name}: {len(chapters)} chapters, {len(notes)} imported notes")
print("  ", sizes)
