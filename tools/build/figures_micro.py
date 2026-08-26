# -*- coding: utf-8 -*-
"""Diagrams for the ECON 401 answer bank.

Run:  python tools/build/figures_micro.py
Out:  content/figures/*.svg

Each function draws exactly one idea. The figure is there to make one claim
in the answer visible — not to decorate it — so if a diagram needs a
paragraph of explanation to parse, it is the wrong diagram.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

from figstyle import (use_style, axes, drop, arrow, save,
                      ACCENT, WARM, GOOD, BAD, MUTED, INK)


# --------------------------------------------------------------- ch7 ------

def duality_map():
    """The four objects of consumer theory and the operations between them.

    This is the single highest-value diagram in the course: the Cobb-Douglas
    'derive x, v, e, h' question is on 15 of 31 papers, and it is really a
    question about knowing which arrow to walk.
    """
    fig, ax = plt.subplots(figsize=(8.6, 5.4))
    ax.set_xlim(0, 10); ax.set_ylim(0, 6.4); ax.axis("off")

    nodes = {
        "x": (2.0, 4.6, r"$x(p,m)$", "Marshallian demand", ACCENT),
        "v": (8.0, 4.6, r"$v(p,m)$", "indirect utility", ACCENT),
        "h": (2.0, 1.5, r"$h(p,u)$", "Hicksian demand", WARM),
        "e": (8.0, 1.5, r"$e(p,u)$", "expenditure", WARM),
    }
    for key, (x, y, tex, sub, col) in nodes.items():
        box = FancyBboxPatch((x - 1.28, y - 0.62), 2.56, 1.24,
                             boxstyle="round,pad=0.02,rounding_size=0.16",
                             linewidth=1.8, edgecolor=col, facecolor="none",
                             zorder=3)
        ax.add_patch(box)
        ax.text(x, y + 0.19, tex, ha="center", va="center", fontsize=15, color=col, zorder=4)
        ax.text(x, y - 0.31, sub, ha="center", va="center", fontsize=10, color=INK, zorder=4)

    def link(a, b, label, note, dx=0.0, dy=0.0, style="->"):
        x1, y1 = nodes[a][0], nodes[a][1]
        x2, y2 = nodes[b][0], nodes[b][1]
        if abs(y1 - y2) < 0.1:                       # horizontal
            x1s, x2s = x1 + 1.32, x2 - 1.32
            ax.annotate("", xy=(x2s, y2), xytext=(x1s, y1),
                        arrowprops=dict(arrowstyle=style, color=MUTED, lw=1.6))
            mx, my = (x1s + x2s) / 2, y1
            ax.text(mx + dx, my + 0.42 + dy, label, ha="center", fontsize=11.5, color=INK)
            ax.text(mx + dx, my + 0.10 + dy, note, ha="center", fontsize=9.5, color=MUTED)
        else:                                        # vertical
            y1s, y2s = y1 - 0.66, y2 + 0.66
            ax.annotate("", xy=(x2, y2s), xytext=(x1, y1s),
                        arrowprops=dict(arrowstyle=style, color=MUTED, lw=1.6))
            my = (y1s + y2s) / 2
            ax.text(x1 + dx, my + 0.16, label, ha="center", fontsize=11.5, color=INK)
            ax.text(x1 + dx, my - 0.16, note, ha="center", fontsize=9.5, color=MUTED)

    link("x", "v", "substitute back", r"$v=u(x(p,m))$")
    link("h", "e", "substitute back", r"$e=p\cdot h(p,u)$")
    link("v", "e", "invert in  $m$", r"$e(p,v(p,m))=m$", style="<->")
    link("x", "h", "Slutsky", r"$x(p,e(p,u))=h(p,u)$", style="<->")

    ax.annotate("", xy=(3.1, 4.05), xytext=(6.9, 4.05),
                arrowprops=dict(arrowstyle="->", color=GOOD, lw=1.6,
                                connectionstyle="arc3,rad=0.30"))
    ax.text(5.0, 3.28, "Roy's identity", ha="center", fontsize=11.5, color=GOOD)
    ax.text(5.0, 2.98, r"$x_i=-\dfrac{\partial v/\partial p_i}{\partial v/\partial m}$",
            ha="center", fontsize=12, color=GOOD)

    ax.annotate("", xy=(6.9, 2.05), xytext=(3.1, 2.05),
                arrowprops=dict(arrowstyle="->", color=WARM, lw=1.6,
                                connectionstyle="arc3,rad=0.30"))
    ax.text(5.0, 0.86, "Shephard's lemma", ha="center", fontsize=11.5, color=WARM)
    ax.text(5.0, 0.52, r"$h_i=\dfrac{\partial e}{\partial p_i}$",
            ha="center", fontsize=12, color=WARM)

    ax.text(0.15, 6.15, "UTILITY MAXIMISATION", fontsize=9.5, color=ACCENT, weight="bold")
    ax.text(0.15, 0.10, "EXPENDITURE MINIMISATION", fontsize=9.5, color=WARM, weight="bold")
    return save(fig, "duality-map")


def local_nonsatiation():
    """Why a thick indifference band cannot survive local nonsatiation."""
    fig, (a1, a2) = plt.subplots(1, 2, figsize=(9.2, 4.1))

    # left: the thick band, with the ball that breaks it
    t = np.linspace(0.55, 3.6, 300)
    inner, outer = 1.5 / t, 2.15 / t
    a1.fill_between(t, inner, outer, color=BAD, alpha=0.16, lw=0)
    a1.plot(t, inner, color=BAD, lw=2.0)
    a1.plot(t, outer, color=BAD, lw=2.0)
    px, py = 1.55, (1.5 / 1.55 + 2.15 / 1.55) / 2
    circ = plt.Circle((px, py), 0.30, fill=False, color=ACCENT, lw=2.0, ls=(0, (3, 2)))
    a1.add_patch(circ)
    a1.plot([px], [py], "o", color=ACCENT, ms=7, zorder=5)
    a1.text(px + 0.40, py + 0.30, r"$x$", fontsize=13, color=ACCENT)
    a1.text(px + 0.36, py - 0.46, r"every $y$ in the ball" "\n" r"is indifferent to $x$",
            fontsize=9.5, color=INK)
    a1.set_xlim(0.4, 3.8); a1.set_ylim(0.3, 3.4)
    axes(a1, r"$x_1$", r"$x_2$", "Thick band — ruled out")
    a1.set_xticks([]); a1.set_yticks([])

    # right: the thin curve that survives
    a2.plot(t, 2.0 / t, color=GOOD, lw=2.4)
    px2, py2 = 1.55, 2.0 / 1.55
    circ2 = plt.Circle((px2, py2), 0.30, fill=False, color=ACCENT, lw=2.0, ls=(0, (3, 2)))
    a2.add_patch(circ2)
    a2.plot([px2], [py2], "o", color=ACCENT, ms=7, zorder=5)
    bx, by = px2 + 0.20, py2 + 0.20
    a2.plot([bx], [by], "o", color=GOOD, ms=7, zorder=5)
    a2.text(bx + 0.16, by + 0.12, r"$y \succ x$", fontsize=12, color=GOOD)
    a2.text(px2 + 0.34, py2 - 0.52, "a strictly better $y$\nexists in every ball",
            fontsize=9.5, color=INK)
    a2.set_xlim(0.4, 3.8); a2.set_ylim(0.3, 3.4)
    axes(a2, r"$x_1$", r"$x_2$", "Thin curve — consistent")
    a2.set_xticks([]); a2.set_yticks([])

    fig.tight_layout()
    return save(fig, "local-nonsatiation")


def marshallian_vs_hicksian():
    """For a normal good the Marshallian curve is the flatter of the two."""
    fig, ax = plt.subplots(figsize=(6.6, 4.6))
    p = np.linspace(1.0, 3.0, 200)
    p0 = 2.0
    hicks = 6.0 / p ** 0.55           # steeper: substitution effect only
    marsh = 6.0 / p ** 1.00           # flatter: substitution + income

    ax.plot(marsh, p, color=ACCENT, lw=2.6, label=r"Marshallian  $x(p,m)$")
    ax.plot(hicks, p, color=WARM, lw=2.6, label=r"Hicksian  $h(p,u^0)$")

    x0 = 6.0 / p0
    ax.plot([x0], [p0], "o", color=INK, ms=7, zorder=6)
    ax.text(x0 + 0.12, p0 + 0.10, "they cross at $p^0$\n(same bundle)", fontsize=9.5, color=INK)
    ax.axhline(p0, color=MUTED, ls=(0, (4, 3)), lw=1.1)

    pl = 1.35
    ax.plot([6.0 / pl ** 1.0], [pl], "o", color=ACCENT, ms=6)
    ax.plot([6.0 / pl ** 0.55], [pl], "o", color=WARM, ms=6)
    ax.annotate("", xy=(6.0 / pl ** 1.0, pl), xytext=(6.0 / pl ** 0.55, pl),
                arrowprops=dict(arrowstyle="<->", color=GOOD, lw=1.5))
    ax.text(4.55, pl - 0.20, "income effect\nreinforces", fontsize=9.5, color=GOOD, ha="center")

    ax.set_xlim(1.4, 5.6); ax.set_ylim(1.0, 3.05)
    axes(ax, r"quantity  $x_1$", r"price  $p_1$")
    ax.legend(loc="upper right")
    fig.tight_layout()
    return save(fig, "marshallian-vs-hicksian")


def slutsky_decomposition():
    """TE = SE + IE for a fall in p1, normal good."""
    fig, ax = plt.subplots(figsize=(6.9, 5.0))
    m, p2 = 100.0, 4.0
    p1a, p1b = 5.0, 2.5
    a = 0.5

    def budget(p1, mm):
        x = np.linspace(0.6, mm / p1, 200)
        return x, (mm - p1 * x) / p2

    def ic(u, xs):
        return (u / xs ** a) ** (1 / (1 - a))

    xA = a * m / p1a
    xC = a * m / p1b
    uA = xA ** a * ((1 - a) * m / p2) ** (1 - a)
    uC = xC ** a * ((1 - a) * m / p2) ** (1 - a)
    m_comp = uA / (a / p1b) ** a / ((1 - a) / p2) ** (1 - a)   # Hicks compensation
    xB = a * m_comp / p1b

    for p1, mm, col, lab in ((p1a, m, MUTED, "original budget"),
                             (p1b, m, ACCENT, r"new budget ($p_1\downarrow$)"),
                             (p1b, m_comp, WARM, "compensated budget")):
        x, y = budget(p1, mm)
        ax.plot(x, y, color=col, lw=2.0,
                ls="-" if col != WARM else (0, (5, 3)), label=lab)

    xs = np.linspace(2.0, 34, 300)
    ax.plot(xs, ic(uA, xs), color=MUTED, lw=1.8)
    ax.plot(xs, ic(uC, xs), color=GOOD, lw=1.8)

    for xv, uu, col, name in ((xA, uA, MUTED, "A"), (xB, uA, WARM, "B"), (xC, uC, GOOD, "C")):
        yv = ic(uu, np.array([xv]))[0]
        ax.plot([xv], [yv], "o", color=col, ms=8, zorder=6)
        ax.text(xv + 0.5, yv + 0.7, name, fontsize=13, color=col, weight="bold")
        ax.plot([xv, xv], [0, yv], ls=(0, (3, 3)), color=col, lw=1.0, zorder=1)

    y0 = -1.9
    for x1, x2, col, lab in ((xA, xB, WARM, "SE"), (xB, xC, GOOD, "IE")):
        ax.annotate("", xy=(x2, y0), xytext=(x1, y0),
                    arrowprops=dict(arrowstyle="<->", color=col, lw=1.7))
        ax.text((x1 + x2) / 2, y0 - 1.5, lab, ha="center", fontsize=11.5, color=col, weight="bold")
    ax.annotate("", xy=(xC, y0 - 3.4), xytext=(xA, y0 - 3.4),
                arrowprops=dict(arrowstyle="<->", color=ACCENT, lw=1.7))
    ax.text((xA + xC) / 2, y0 - 4.9, "TE = SE + IE", ha="center", fontsize=11.5,
            color=ACCENT, weight="bold")

    ax.set_xlim(0, 42); ax.set_ylim(-8.0, 26)
    axes(ax, r"$x_1$", r"$x_2$")
    ax.spines["bottom"].set_bounds(0, 42)
    ax.legend(loc="upper right")
    fig.tight_layout()
    return save(fig, "slutsky-decomposition")


# --------------------------------------------------------------- ch1 ------

def ces_limits():
    """One family, three familiar shapes, as rho moves."""
    fig, axs = plt.subplots(1, 3, figsize=(10.2, 3.6))
    y = 1.0
    x1 = np.linspace(0.06, 3.0, 400)

    # rho = 1 : perfect substitutes
    axs[0].plot(x1, np.clip(y - x1, 0, None), color=ACCENT, lw=2.6)
    axs[0].set_title(r"$\rho = 1$" "\nperfect substitutes", pad=10)

    # rho -> 0 : Cobb-Douglas
    axs[1].plot(x1, np.clip(y / np.maximum(x1, 1e-9), 0, 3.2), color=ACCENT, lw=2.6)
    axs[1].set_title(r"$\rho \to 0$" "\nCobb-Douglas", pad=10)

    # rho -> -inf : Leontief
    axs[2].plot([y, y], [y, 3.2], color=ACCENT, lw=2.6)
    axs[2].plot([y, 3.2], [y, y], color=ACCENT, lw=2.6)
    axs[2].plot([y], [y], "o", color=ACCENT, ms=7)
    axs[2].set_title(r"$\rho \to -\infty$" "\nLeontief", pad=10)

    for a in axs:
        a.set_xlim(0, 2.6); a.set_ylim(0, 2.6)
        a.set_xticks([]); a.set_yticks([])
        axes(a, r"$x_1$", r"$x_2$")
    fig.suptitle(r"$y=[a_1x_1^{\rho}+a_2x_2^{\rho}]^{1/\rho}$   —   one isoquant, three limits",
                 fontsize=12.5, y=1.10)
    fig.tight_layout()
    return save(fig, "ces-limits")


def cobb_douglas_isoquants():
    """Input requirement set, isoquant, and the TRS as the isoquant's slope."""
    fig, (a1, a2) = plt.subplots(1, 2, figsize=(9.4, 4.2))
    a = 0.5
    x1 = np.linspace(0.28, 4.2, 400)

    for yv, col, alpha in ((1.0, MUTED, 0.0), (1.4, ACCENT, 0.14), (1.8, MUTED, 0.0)):
        x2 = (yv / x1 ** a) ** (1 / (1 - a))
        a1.plot(x1, x2, color=col, lw=2.4 if col == ACCENT else 1.6)
        if alpha:
            a1.fill_between(x1, x2, 4.4, color=col, alpha=alpha, lw=0)
    a1.text(2.55, 2.75, r"$V(y)$", fontsize=15, color=ACCENT)
    a1.text(2.55, 2.35, "input requirement set", fontsize=9.5, color=INK)
    a1.text(0.52, 3.55, r"$y=1.8$", fontsize=10, color=MUTED)
    a1.text(1.62, 0.52, r"$y=1.0$", fontsize=10, color=MUTED)
    a1.set_xlim(0, 4.4); a1.set_ylim(0, 4.4)
    axes(a1, r"$x_1$", r"$x_2$", r"Isoquants of $x_1^{a}x_2^{1-a}$")
    a1.set_xticks([]); a1.set_yticks([])

    # TRS panel
    yv = 1.4
    x2 = (yv / x1 ** a) ** (1 / (1 - a))
    a2.plot(x1, x2, color=ACCENT, lw=2.6)
    xt = 1.4
    yt = (yv / xt ** a) ** (1 / (1 - a))
    slope = -(a / (1 - a)) * yt / xt
    tx = np.linspace(xt - 0.95, xt + 0.95, 10)
    a2.plot(tx, yt + slope * (tx - xt), color=WARM, lw=2.0, ls=(0, (5, 3)))
    a2.plot([xt], [yt], "o", color=INK, ms=7, zorder=6)
    drop(a2, xt, yt)
    a2.text(xt + 0.22, yt + 0.95,
            r"slope $=\mathrm{TRS}=-\dfrac{MP_1}{MP_2}=-\dfrac{a}{1-a}\dfrac{x_2}{x_1}$",
            fontsize=11, color=WARM)
    a2.set_xlim(0, 4.4); a2.set_ylim(0, 4.4)
    axes(a2, r"$x_1$", r"$x_2$", "TRS is the isoquant's slope")
    a2.set_xticks([]); a2.set_yticks([])

    fig.tight_layout()
    return save(fig, "cobb-douglas-isoquants")


ALL = [duality_map, local_nonsatiation, marshallian_vs_hicksian,
       slutsky_decomposition, ces_limits, cobb_douglas_isoquants]


def main():
    use_style()
    for fn in ALL:
        p = fn()
        print(f"  {p.name:34} {p.stat().st_size/1024:7.1f} KB   {fn.__doc__.splitlines()[0]}")


if __name__ == "__main__":
    main()
