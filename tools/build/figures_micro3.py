# -*- coding: utf-8 -*-
"""Diagrams for the ECON 401 answer bank — third band.

Run:  python tools/build/figures_micro3.py
Out:  content/figures/*.svg

Three questions in this band are almost impossible to answer well in prose
alone: recovering an indifference curve from revealed preference, the excise
vs income tax comparison, and the envelope theorem. Each is a picture with a
sentence attached, not the other way round.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np
import matplotlib.pyplot as plt

from figstyle import (use_style, axes, drop, save,
                      ACCENT, WARM, GOOD, BAD, MUTED, INK)


def revealed_recovery():
    """Revealed preference brackets the indifference curve from both sides."""
    fig, ax = plt.subplots(figsize=(6.5, 4.7))

    # the bundle whose indifference curve we are trying to recover
    x0 = np.array([4.0, 4.0])
    ax.plot(*x0, "o", color=INK, ms=10, zorder=8)
    ax.annotate(r"$x^{0}$", xy=x0, xytext=(x0[0] + 0.18, x0[1] + 0.30),
                fontsize=13, color=INK)

    # budget lines under which x0 was chosen -> everything below is WORSE
    for (p1, p2), lab in (((1.0, 1.0), None), ((1.9, 0.62), None), ((0.55, 2.0), None)):
        m = p1 * x0[0] + p2 * x0[1]
        xs = np.linspace(0, m / p1, 50)
        ax.plot(xs, (m - p1 * xs) / p2, color=WARM, lw=1.7, alpha=.9)

    # the union of those budget sets: all revealed WORSE than x0
    grid = np.linspace(0, 9.5, 400)
    X, Y = np.meshgrid(grid, grid)
    worse = np.zeros_like(X, dtype=bool)
    for p1, p2 in ((1.0, 1.0), (1.9, 0.62), (0.55, 2.0)):
        m = p1 * x0[0] + p2 * x0[1]
        worse |= (p1 * X + p2 * Y <= m)
    ax.contourf(X, Y, worse.astype(float), levels=[.5, 1.5], colors=[BAD], alpha=.13)

    # bundles with more of BOTH goods are revealed BETTER (monotonicity)
    ax.fill_between([x0[0], 9.5], [x0[1], x0[1]], 9.5, color=GOOD, alpha=.15, lw=0)

    ax.text(1.15, 0.95, "revealed WORSE\nthan $x^{0}$", fontsize=10, color=BAD)
    ax.text(6.4, 7.1, "revealed BETTER\n(more of both)", fontsize=10, color=GOOD)
    ax.text(6.15, 2.05, "the true indifference\ncurve lies in this gap",
            fontsize=10.5, color=INK, ha="center")
    ax.annotate("", xy=(5.5, 3.0), xytext=(6.2, 2.55),
                arrowprops=dict(arrowstyle="->", color=MUTED, lw=1.3))

    # a plausible IC threaded through the untested region
    t = np.linspace(0.35, 9.4, 300)
    ax.plot(t, 16.0 / t, color=ACCENT, lw=2.4, ls=(0, (6, 3)))

    ax.set_xlim(0, 9.5); ax.set_ylim(0, 9.5)
    axes(ax, r"$x_1$", r"$x_2$")
    ax.set_xticks([]); ax.set_yticks([])
    fig.tight_layout()
    return save(fig, "revealed-recovery")


def excise_vs_income_tax():
    """Same revenue, but the excise tax leaves the consumer on a lower curve."""
    fig, ax = plt.subplots(figsize=(6.6, 4.8))
    m, p1, p2, a = 12.0, 1.0, 1.0, 0.5
    t = 1.0                                   # excise tax on good 1

    x1 = np.linspace(0.35, 12.6, 400)
    ic = lambda u: (u ** 2) / x1              # Cobb-Douglas a=1/2 -> x2 = u^2/x1

    # 1. no tax
    ax.plot(x1, (m - p1 * x1) / p2, color=MUTED, lw=1.6, ls=(0, (5, 3)))
    # 2. excise tax on good 1: budget pivots
    xe1, xe2 = a * m / (p1 + t), (1 - a) * m / p2
    ax.plot(x1, (m - (p1 + t) * x1) / p2, color=BAD, lw=2.4, label="after an excise tax")
    ax.plot([xe1], [xe2], "o", color=BAD, ms=9, zorder=7)

    revenue = t * xe1                          # tax actually collected
    # 3. income tax raising the SAME revenue: budget shifts in, parallel
    mi = m - revenue
    xi1, xi2 = a * mi / p1, (1 - a) * mi / p2
    ax.plot(x1, (mi - p1 * x1) / p2, color=GOOD, lw=2.4, label="after an income tax")
    ax.plot([xi1], [xi2], "o", color=GOOD, ms=9, zorder=7)

    ax.plot(x1, ic(np.sqrt(xe1 * xe2)), color=BAD, lw=1.7, alpha=.85)
    ax.plot(x1, ic(np.sqrt(xi1 * xi2)), color=GOOD, lw=1.7, alpha=.85)

    ax.annotate("", xy=(xi1, xi2), xytext=(xe1, xe2),
                arrowprops=dict(arrowstyle="->", color=INK, lw=1.9))
    ax.text(4.35, 4.55, "same revenue,\nhigher indifference curve",
            fontsize=10, color=INK)
    ax.text(0.55, 1.15, f"revenue raised\nis equal: {revenue:.0f}", fontsize=9.5, color=MUTED)

    ax.set_xlim(0, 12.6); ax.set_ylim(0, 12.6)
    axes(ax, r"$x_1$  (the taxed good)", r"$x_2$")
    ax.set_xticks([]); ax.set_yticks([])
    ax.legend(loc="upper right")
    fig.tight_layout()
    return save(fig, "excise-vs-income-tax")


def envelope_theorem():
    """The value function is the upper envelope of the fixed-choice curves."""
    fig, ax = plt.subplots(figsize=(6.6, 4.5))
    a = np.linspace(0.2, 4.4, 300)

    # a family of "hold the choice fixed" curves, and their upper envelope
    for x in (0.6, 1.1, 1.6, 2.1, 2.6, 3.1):
        ax.plot(a, 2 * x * a - x ** 2 - 0.4, color=MUTED, lw=1.15, alpha=.75)
    env = a ** 2 - 0.4                        # max over x of (2xa - x^2)
    ax.plot(a, env, color=ACCENT, lw=3.0, zorder=5,
            label=r"value function $V(\alpha)=\max_x f(x,\alpha)$")

    a0, x0 = 2.4, 2.4
    ax.plot(a, 2 * x0 * a - x0 ** 2 - 0.4, color=WARM, lw=2.3, ls=(0, (5, 3)),
            zorder=4, label=r"$f(x^{*},\alpha)$ with $x^{*}$ held fixed")
    ax.plot([a0], [a0 ** 2 - 0.4], "o", color=INK, ms=9, zorder=8)
    drop(ax, a0, a0 ** 2 - 0.4)
    ax.annotate(r"they are tangent here:" "\n" r"$\dfrac{dV}{d\alpha}=\dfrac{\partial f}{\partial\alpha}$",
                xy=(a0, a0 ** 2 - 0.4), xytext=(a0 - 1.95, a0 ** 2 + 1.15),
                fontsize=10.5, color=INK,
                arrowprops=dict(arrowstyle="->", color=MUTED, lw=1.2))
    ax.text(3.35, 1.35, "each thin line holds\none choice fixed",
            fontsize=9.5, color=MUTED, ha="center")

    ax.set_xlim(0.2, 4.4); ax.set_ylim(-2.0, 18.5)
    axes(ax, r"parameter  $\alpha$", "value")
    ax.legend(loc="upper left")
    fig.tight_layout()
    return save(fig, "envelope-theorem")


ALL = [revealed_recovery, excise_vs_income_tax, envelope_theorem]


def main():
    use_style()
    for fn in ALL:
        p = fn()
        print(f"  {p.name:28} {p.stat().st_size/1024:7.1f} KB   {fn.__doc__.splitlines()[0]}")


if __name__ == "__main__":
    main()
