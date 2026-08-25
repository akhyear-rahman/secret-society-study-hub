#!/usr/bin/env python3
"""Inspect the topic vocabulary used across the question banks.

The frequency ranking groups questions by topic, so the same idea filed under
two labels reads as half as important as it really is. Run this before adding
a topic string, and reuse an existing label wherever one fits.

    python tools/topics.py                 # every label, with counts
    python tools/topics.py --near          # labels that look like duplicates
    python tools/topics.py --course 409    # limit to one course
"""

from __future__ import annotations

import argparse
import difflib
import glob
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def load(course_filter: str | None):
    out = []
    for f in sorted(glob.glob(str(ROOT / "content/courses/*.json"))):
        if "_template" in f:
            continue
        d = json.loads(Path(f).read_text(encoding="utf-8"))
        code = d.get("code", "")
        if course_filter and course_filter.lower() not in (code + d.get("id", "")).lower():
            continue
        out.append(d)
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--near", action="store_true", help="flag possible duplicates")
    ap.add_argument("--course", help="filter by course code or id, e.g. 409")
    args = ap.parse_args()

    courses = load(args.course)
    if not courses:
        print("No matching course.")
        return 1

    counts: Counter[str] = Counter()
    for d in courses:
        for q in d.get("questions", []):
            # practice items are not sat papers, so they should not sway the
            # vocabulary the ranking is built on
            if q.get("examType") == "practice":
                continue
            counts.update(q.get("topics", []))

    if not counts:
        print("No topics recorded yet.")
        return 0

    total = sum(counts.values())
    print(f"{len(counts)} distinct labels across {total} taggings\n")
    width = max(len(t) for t in counts)
    for t, n in counts.most_common():
        bar = "#" * min(n, 40)
        print(f"  {t:<{width}}  {n:>3}  {bar}")

    singles = [t for t, n in counts.items() if n == 1]
    print(f"\n  used once: {len(singles)} of {len(counts)}")

    if args.near:
        names = sorted(counts)
        pairs = []
        for i, a in enumerate(names):
            for b in names[i + 1:]:
                al, bl = a.lower(), b.lower()
                ratio = difflib.SequenceMatcher(None, al, bl).ratio()
                contained = al in bl or bl in al
                if contained or ratio > 0.72:
                    pairs.append((round(ratio, 2), contained, a, counts[a], b, counts[b]))
        pairs.sort(key=lambda x: (-x[1], -x[0]))
        print(f"\nPossible duplicates ({len(pairs)}) — merge where they mean the same thing:")
        for ratio, contained, a, na, b, nb in pairs:
            flag = "contains" if contained else f"sim {ratio}"
            print(f"  {a!r} ({na})  <->  {b!r} ({nb})   [{flag}]")
        if not pairs:
            print("  none — vocabulary looks clean")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
