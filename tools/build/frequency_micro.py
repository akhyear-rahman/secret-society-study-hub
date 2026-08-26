#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Rank ECON 401 question groups by how often they actually appear.

    python tools/build/frequency_micro.py [path/to/adv_micro.txt]

Why this exists: ECON 401 repeats itself to an unusual degree, and the right
order to write answers in is not obvious from reading the papers. Counting
says the Cobb-Douglas duality derivation is on roughly half of them, which is
not something you would guess.

The counting is deliberately crude — one discriminating regex per canonical
question group, matched against each paper's text. It is a ranking device,
not a parser. Two things it gets right that matter more than precision:

  * The compiled question bank inside the source file (the "or" variants
    grouped by chapter) is excluded, since it is not a sat paper.
  * The 2016 paper headed "Course #401(Advanced Macroeconomies 1)" is a
    macroeconomics paper — Solow, IS-LM, Phillips curve, Shapiro-Stiglitz —
    filed under the wrong course code. Counting it would pollute every total.

Update PAPER_STARTS if the source file changes.
"""

from __future__ import annotations

import io
import re
import sys
from pathlib import Path

DEFAULT_SRC = Path(r"C:\Users\JB PLC\Desktop\7th Semester\Advanced Microeconomics\adv_micro.txt")

# 1-based line numbers where each paper starts, then the end sentinel.
PAPER_STARTS = [1, 113, 198, 274, 362, 422, 512, 543, 609, 682, 763, 801, 849,
                929, 982, 1350, 1409, 1466, 1480, 1510, 1532, 1602, 1623, 1633,
                1649, 1663, 1685, 1745, 1771, 1808, 1843, 1869, 1900, 1939]
SKIP = {512, 982}      # macro paper filed as 401; compiled bank, not a sitting

# (chapter, name, discriminating pattern)
GROUPS = [
 ("ch7", "Cobb-Douglas full duality set (x, v, e, h)", r"(Marshallian demand|indirect utility).{0,400}(expenditure function)"),
 ("ch7", "Local nonsatiation rules out thick ICs",     r"local\s*nonsatiation"),
 ("ch7", "Consumer equilibrium FOC/SOC with graph",    r"(consumer equilibrium|utility maximization).{0,200}(F\.?O\.?C|first[- ]order|vector notation)"),
 ("ch7", "Properties of indirect utility / quasiconvex", r"indirect utility function.{0,300}(quasi\s*convex|properties)"),
 ("ch7", "Properties of expenditure fn / concave in p", r"expenditure function.{0,200}(concave|properties)"),
 ("ch7", "Roy's identity",                             r"Roy'?s identity"),
 ("ch7", "MRS = ratio of marginal utilities",          r"marginal rate of substitution|\bMRS\b"),
 ("ch7", "Utility max implies expenditure min",        r"(utility maximization implies expenditure|expenditure minimization implies utility|dual problem)"),
 ("ch7", "Four preference assumptions",                r"completeness,?\s*reflexiv"),
 ("ch7", "Continuity assumption",                      r"assumption of ['\"]?continuity"),
 ("ch7", "Indirect utility m/min{p1,p2}",              r"min\\?\{?p_?\{?1"),
 ("ch7", "Indirect utility m/p1 + m/p2",               r"m/p_?\{?1\}?\s*\+\s*m/p_?\{?2"),
 ("ch7", "Direct utility from v = -a ln p1 - b ln p2", r"-\s*a\s*ln\s*p_?\{?1"),
 ("ch8", "Slutsky equation (state and prove)",         r"Slutsky equation"),
 ("ch8", "Marshallian flatter than Hicksian",          r"(Marshallian demand (curve|function)) is flatter|flatter (compared|than)"),
 ("ch8", "Properties of demand functions",             r"propert(ies|y) of (the )?demand function"),
 ("ch8", "Recover IC from revealed preference",        r"recover.{0,40}indifference curve|indifference curve.{0,40}revealed"),
 ("ch8", "WARP / SARP",                                r"\bWARP\b|Weak Axiom of Revealed"),
 ("ch8", "GARP -> dp dx <= 0",                         r"\bGARP\b|Generalized Axiom of Revealed"),
 ("ch8", "Giffen good, upward sloping demand",         r"Giffen"),
 ("ch8", "Excise tax vs income tax",                   r"excise tax"),
 ("ch8", "Hicks vs Slutsky compensation",              r"Hicks compensation|Slutsky compensation|['\"]compensation['\"]"),
 ("ch8", "Revealed preference numeric (2,4)->(1,2)",   r"\(2,\s*4\)|prices are \(6,\s*3\)"),
 ("ch8", "TE = SE + IE decomposition",                 r"TE\s*=\s*SE|total effect\s*=?\s*substitution"),
 ("ch8", "Shephard's lemma",                           r"Shephard"),
 ("ch8", "Offer / price consumption curve",            r"offer curve|price consumption curve"),
 ("ch1", "Cobb-Douglas TRS / ES / elasticity of scale", r"(Technical [Rr]ate of [Ss]ubstitution|\bTRS\b)"),
 ("ch1", "CES -> linear / C-D / Leontief limits",      r"(CES|constant elasticity).{0,400}(Leontief|Cobb-?Douglas|perfect complements)"),
 ("ch1", "CES has constant elasticity of substitution", r"(CES|constant elasticity).{0,200}(constant (value for )?elasticity|has a constant)"),
 ("ch1", "Convexity property of technology",           r"convexity property of technology|['\"]convex(ity)?['\"] property"),
 ("ch1", "Monotonicity property of technology",        r"monotonicity property"),
 ("ch1", "Convex production set -> convex V(y)",       r"convex production set|production set Y is a convex"),
 ("ch1", "DRS as restricted CRS",                      r"decreasing returns to scale.{0,120}(restricted|constant returns)|DRS"),
 ("ch1", "Input requirement set / isoquant / T(y,x)",  r"input requirement set"),
 ("ch1", "Leontief: PPS, V(y), isoquant, T(y,x)",      r"Leontief"),
 ("ch1", "Elasticity of substitution derivation",      r"d\s*ln\s*\(?x_?\{?2\}?/x_?\{?1|elasticity of substitution['\"]?\s*\(?(ES|\u03c3)"),
 ("ch1", "Output elasticity of a factor",              r"output elasticity"),
 ("ch2", "Profit / factor demand / supply, f(x)=x^a",  r"f\(x\)\s*=\s*x\^?\{?[a3]\}?|y\s*=\s*x\^?\{?a"),
 ("ch2", "WAPM -> dp dy >= 0 / recover technology",    r"\bWAPM\b|Weak Axiom of Profit"),
 ("ch2", "Profit function convex in prices",           r"profit function is convex"),
 ("ch2", "f(x)=20x-x^2 factor demand / supply",        r"20x\s*-\s*x\^?\{?2"),
 ("ch2", "No profit-max plan under CRS/IRS",           r"(constant|increasing) returns to scale as long as"),
 ("ch2", "FOC/SOC profit max, graph + vectors",        r"(first[- ]order|F\.?O\.?C).{0,200}profit max|profit max.{0,200}(vector notation|isoprofit)"),
 ("ch2", "Fluctuating vs stabilized price",            r"fluctuat"),
 ("ch2", "Hotelling's lemma",                          r"Hotelling"),
 ("ch2", "Economic vs accounting profit",              r"accounting profit"),
 ("ch2", "Envelope theorem",                           r"envelope theorem"),
 ("ch2", "Substitution matrix symmetric, neg definite", r"substitution matrix"),
 ("ch2", "Factor demand curve slopes downward",        r"factor demand curve slopes downward"),
 ("ch4", "Cobb-Douglas cost function",                 r"c\(w,\s*y\)|cost function for (this|a firm with).{0,80}(Cobb|technology)"),
 ("ch4", "SOC for cost minimization",                  r"second[- ]order (condition|movement).{0,120}cost min|cost min.{0,120}second[- ]order"),
 ("ch4", "Leontief cost function",                     r"cost function.{0,120}Leontief|Leontief.{0,160}cost function"),
 ("ch4", "WACM -> factor demands slope downward",      r"\bWACM\b|Weak Axiom of Cost"),
 ("ch4", "Cost fn homogeneous deg 1 / concave in w",   r"cost function is (homogenous|homogeneous|concave)"),
 ("ch4", "Conditional factor demand own/cross effects", r"conditional factor demand"),
 ("ch4", "SAC / LAC envelope relationship",            r"short[- ]run (average )?cost.{0,80}long[- ]run|SAC|LAC"),
]


def papers(src: Path) -> list[str]:
    lines = io.open(src, encoding="utf-8").read().split("\n")
    out = []
    for a, b in zip(PAPER_STARTS, PAPER_STARTS[1:]):
        if a in SKIP:
            continue
        out.append("\n".join(lines[a - 1:b - 1]))
    return out


def main() -> int:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SRC
    if not src.exists():
        print(f"source not found: {src}")
        return 1
    docs = papers(src)
    rows = []
    for ch, name, pat in GROUPS:
        rx = re.compile(pat, re.I | re.S)
        rows.append((sum(1 for d in docs if rx.search(d)), ch, name))
    rows.sort(key=lambda r: (-r[0], r[1]))

    print(f"{len(docs)} ECON 401 papers counted "
          f"({len(PAPER_STARTS) - 1 - len(SKIP)} expected)\n")
    print(f"{'HITS':<6}{'CH':<6}QUESTION GROUP")
    print("-" * 78)
    for n, ch, name in rows:
        print(f"{n:<6}{ch:<6}{name[:52]:<54}{'#' * n}")
    print(f"\ngroups: {len(rows)}   taggings: {sum(r[0] for r in rows)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
