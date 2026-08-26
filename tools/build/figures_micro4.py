# -*- coding: utf-8 -*-
"""Diagrams for the ECON 401 answer bank — fourth band.

Run:  python tools/build/figures_micro4.py
Out:  content/figures/*.svg

Both of these answer questions that are really about a SHAPE: what the offer
curve looks like when a good is Giffen, and why the labour supply curve can
bend backwards. Prose alone makes heavy weather of either.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np
import matplotlib.pyplot as plt

from figstyle import (use_style, axes, drop, save,
                      ACCENT, WARM, GOOD, BAD, MUTED, INK)


def offer_curve():
    """Offer curve: normal good sweeps right, Giffen good doubles back."""
    fig, (a1, a2) = plt.subplots(1, 2, figsize=(9.4, 4.3))
    m, p2 = 10.0, 1.0

    # left: good 1 normal (Cobb-Douglas) — offer curve rises monotonically
    a, p1s = 0.5, np.linspace(0.8, 6.0, 60)
    x1 = a * m / p1s
    x2 = (1 - a) * m / p2 * np.ones_like(p1s)
    for p1 in (1.2, 2.4, 4.4):
        xs = np.linspace(0.25, m / p1, 40)
        a1.plot(xs, (m - p1 * xs) / p2, color=MUTED, lw=1.1, alpha=.8)
        a1.plot([a * m / p1], [(1 - a) * m / p2], "o", color=WARM, ms=6, zorder=6)
    a1.plot(x1, x2, color=ACCENT, lw=2.8, label="offer curve")
    a1.annotate("as $p_1$ falls the consumer\nmoves steadily right",
                xy=(6.2, 5.0), xytext=(3.5, 7.6), fontsize=9.5, color=INK,
                arrowprops=dict(arrowstyle="->", color=MUTED, lw=1.2))
    a1.set_xlim(0, 11); a1.set_ylim(0, 11)
    axes(a1, r"$x_1$", r"$x_2$", "Good 1 normal")
    a1.set_xticks([]); a1.set_yticks([])
    a1.legend(loc="upper right")

    # right: good 1 Giffen over a stretch — the offer curve doubles back
    p1s = np.linspace(0.9, 6.0, 200)
    # a contrived but well-behaved locus that reverses in the middle
    t = (np.log(p1s) - np.log(0.9)) / (np.log(6.0) - np.log(0.9))
    gx = 5.6 - 4.3 * t + 1.9 * np.exp(-((t - 0.45) ** 2) / 0.02)
    gy = 1.1 + 7.4 * t
    for p1 in (1.3, 2.6, 4.6):
        xs = np.linspace(0.25, m / p1, 40)
        a2.plot(xs, (m - p1 * xs) / p2, color=MUTED, lw=1.1, alpha=.8)
    a2.plot(gx, gy, color=BAD, lw=2.8, label="offer curve")
    i = int(np.argmax(gx))
    a2.plot([gx[i]], [gy[i]], "o", color=BAD, ms=8, zorder=7)
    a2.annotate("over this stretch a LOWER $p_1$\nbuys LESS of good 1 —\nthe Giffen range",
                xy=(gx[i], gy[i]), xytext=(gx[i] - 4.6, gy[i] + 1.7),
                fontsize=9.5, color=BAD,
                arrowprops=dict(arrowstyle="->", color=BAD, lw=1.3))
    a2.set_xlim(0, 11); a2.set_ylim(0, 11)
    axes(a2, r"$x_1$", r"$x_2$", "Good 1 Giffen over a range")
    a2.set_xticks([]); a2.set_yticks([])
    a2.legend(loc="upper right")

    fig.tight_layout()
    return save(fig, "offer-curve")


def labour_supply():
    """Backward-bending labour supply, and why inferior leisure rules it out."""
    fig, ax = plt.subplots(figsize=(6.6, 4.6))
    L = np.linspace(0.15, 9.4, 400)

    # leisure normal: income effect eventually dominates, curve bends back
    w_norm = 1.0 + 4.2 * np.exp(-((L - 5.6) ** 2) / 7.0) + 0.30 * L
    ax.plot(L, w_norm, color=ACCENT, lw=2.9,
            label="leisure NORMAL — can bend backwards")
    i = int(np.argmax(L[w_norm > 0]))
    # mark the turning point
    turn = int(np.argmax(np.gradient(L) / np.gradient(w_norm) < 0)) if False else None
    ax.plot([6.35], [np.interp(6.35, L, w_norm)], "o", color=INK, ms=8, zorder=7)
    ax.annotate("above this wage the income effect\noutweighs the substitution effect,\n"
                "and hours worked FALL",
                xy=(6.35, np.interp(6.35, L, w_norm)), xytext=(1.05, 6.65),
                fontsize=9.5, color=INK,
                arrowprops=dict(arrowstyle="->", color=MUTED, lw=1.2))

    # leisure inferior: both effects push the same way, always upward sloping
    w_inf = 0.75 + 0.72 * L
    ax.plot(L, w_inf, color=GOOD, lw=2.6, ls=(0, (6, 3)),
            label="leisure INFERIOR — always upward sloping")
    ax.text(6.9, 5.05, "both effects reduce leisure,\nso hours always rise",
            fontsize=9.5, color=GOOD)

    ax.set_xlim(0, 9.6); ax.set_ylim(0, 8.4)
    axes(ax, r"hours of labour supplied,  $L=T-\ell$", r"wage,  $w$")
    ax.set_xticks([]); ax.set_yticks([])
    ax.legend(loc="upper left")
    fig.tight_layout()
    return save(fig, "labour-supply")


ALL = [offer_curve, labour_supply]


def main():
    use_style()
    for fn in ALL:
        p = fn()
        print(f"  {p.name:24} {p.stat().st_size/1024:7.1f} KB   {fn.__doc__.splitlines()[0]}")


if __name__ == "__main__":
    main()
