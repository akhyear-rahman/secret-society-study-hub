#!/usr/bin/env python3
"""Create a course content file from the template and register it.

    python tools/new_course.py env-econ "ECON 407" "Environmental Economics"

Safe to re-run: it will refuse to overwrite an existing content file.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PALETTE = ["#7c8cff", "#3ddc97", "#f0b429", "#ff6b81", "#5ac8fa", "#c084fc", "#fb923c", "#34d399"]


def main() -> int:
    if len(sys.argv) < 4:
        print(__doc__)
        return 2
    cid, code, title = sys.argv[1], sys.argv[2], sys.argv[3]

    dest = ROOT / "content" / "courses" / f"{cid}.json"
    if dest.exists():
        print(f"{dest.relative_to(ROOT)} already exists — not overwriting.")
        return 1

    template = json.loads((ROOT / "content" / "courses" / "_template.json").read_text(encoding="utf-8"))
    index_path = ROOT / "content" / "index.json"
    index = json.loads(index_path.read_text(encoding="utf-8"))
    color = PALETTE[len(index.get("courses", [])) % len(PALETTE)]

    template.update({"id": cid, "code": code, "title": title, "color": color})
    dest.write_text(json.dumps(template, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    if not any(c.get("id") == cid for c in index.get("courses", [])):
        index.setdefault("courses", []).append({
            "id": cid, "code": code, "short": title[:18], "title": title,
            "color": color, "credits": 4, "semester": 7, "current": True,
        })
        index_path.write_text(json.dumps(index, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"Registered {cid} in content/index.json")

    print(f"Created {dest.relative_to(ROOT)} — edit it, then run python tools/validate.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
