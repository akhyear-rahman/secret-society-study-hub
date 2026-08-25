# Content generators

These are the one-shot scripts that produced the course JSON in
`content/courses/`. They are kept because they are the record of **where the
content came from and how it was transformed** — not because they need to be
run again. The JSON they produced is the live artefact and is edited directly
from here on.

Run any of them and it will overwrite the corresponding course file.

| Script | Produced | Source it drew on |
|---|---|---|
| `build_micro.py` | `adv-micro.json` | Remapped the original seeded course onto the real Varian chapter order from the syllabus PDF. Dropped the off-syllabus game-theory material. |
| `build_macro.py` | `adv-macro.json` | Mankiw/Romer chapter spine from the syllabus, plus the ECON 403 class note split into five chapter notes. |
| `build_env.py` | `env-econ.json` (structure) | 21-chapter spine from the 97th-batch syllabus screenshot; 108 questions transcribed from 15 past papers. |
| `env_theories_a.py` | 5 theories | Coase, WTP/WTA, sustainability, TEV, CVM. |
| `env_theories_b.py` | 5 theories | Externalities, thermodynamics, travel cost, instruments, commons. |
| `env_answers.py` | 14 model answers | The highest-frequency questions in the ECON 409 archive. |
| `merge_env.py` | merges the three above into `env-econ.json` | Also builds the theory ↔ question cross-links. |

## Two transformations worth remembering

**Mojibake repair** (`build_macro.py`). The PDF text extraction returned UTF-8
bytes that had been re-decoded as Latin-1, so every mathematical italic came
out as `ð¶(ð − ð)`. The bytes survived intact, so encoding back to Latin-1 and
decoding as UTF-8 restores them — `𝐶(𝑌 − 𝑇)`. The `unmojibake()` helper there
is reusable if you import more PDF text.

**Scanned-PDF extraction** (no script; done ad hoc). The 2010–2014 papers were
CamScanner scans with no text layer. Rather than OCR them, the embedded JPEG
was pulled straight out of each PDF by scanning for the `/DCTDecode` stream
and writing the bytes between `stream` and `endstream` to a `.jpg`, which
could then be read as an image. Worth reusing for any other scanned paper:

```python
import re, pathlib
for pdf in pathlib.Path('.').glob('*.pdf'):
    data = pdf.read_bytes()
    best = None
    for m in re.finditer(rb'/DCTDecode', data):
        s = data.find(b'stream', m.end()) + len(b'stream')
        while data[s:s+1] in (b'\r', b'\n'):
            s += 1
        blob = data[s:data.find(b'endstream', s)].rstrip(b'\r\n')
        if blob[:2] == b'\xff\xd8' and (best is None or len(blob) > len(best)):
            best = blob
    if best:
        pdf.with_suffix('.jpg').write_bytes(best)
```
