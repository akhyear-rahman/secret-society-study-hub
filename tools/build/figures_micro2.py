# -*- coding: utf-8 -*-
"""Diagrams for the ECON 401 answer bank — second band.

Run:  python tools/build/figures_micro2.py
Out:  content/figures/*.svg

The concavity and convexity panels are the ones worth drawing carefully.
Both properties are proved the same way — the value function lies on one side
of the straight line traced by holding the plan fixed — and seeing that once
makes four separate exam questions collapse into one idea.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np
import matplotlib.pyplot as plt

from figstyle import (use_style, axes, drop, save,
                      ACCENT, WARM, GOOD, BAD, MUTED, INK)


def expenditure_concave():
    """e(p,u) lies below the cost of any fixed bundle — hence concave in p."""
    fig, ax = plt.subplots(figsize=(6.6, 4.5))
    p1 = np.linspace(0.6, 5.4, 300)
    u, p2, a = 1.0, 2.0, 0.5
    e = u * (p1 / a) ** a * (p2 / (1 - a)) ** (1 - a)

    p_star = 2.4
    e_star = u * (p_star / a) ** a * (p2 / (1 - a)) ** (1 - a)
    x1_star = a * e_star / p_star
    x2_star = (1 - a) * e_star / p2
    pseudo = p1 * x1_star + p2 * x2_star          # cost of the FIXED bundle

    ax.plot(p1, pseudo, color=WARM, lw=2.2, ls=(0, (5, 3)),
            label=r"cost of the fixed bundle $x^{*}$  (a straight line)")
    ax.plot(p1, e, color=ACCENT, lw=2.8, label=r"$e(p_1,u)$  (concave)")
    ax.plot([p_star], [e_star], "o", color=INK, ms=8, zorder=6)
    drop(ax, p_star, e_star)
    ax.annotate(r"they touch at $p_1^{*}$" "\n" r"($x^{*}$ is optimal there)",
                xy=(p_star, e_star), xytext=(p_star + 0.5, e_star - 1.15),
                fontsize=9.5, color=INK,
                arrowprops=dict(arrowstyle="->", color=MUTED, lw=1.2))
    ax.fill_between(p1, e, pseudo, where=(pseudo >= e), color=GOOD, alpha=0.12, lw=0)
    ax.text(4.1, 3.05, "elsewhere the fixed bundle\ncosts more than the minimum",
            fontsize=9.5, color=GOOD, ha="center")

    ax.set_xlim(0.6, 5.4); ax.set_ylim(0, 5.6)
    axes(ax, r"price of good 1,  $p_1$", "expenditure")
    ax.legend(loc="upper left")
    fig.tight_layout()
    return save(fig, "expenditure-concave")


def profit_convex():
    """pi(p) lies above the profit of any fixed plan — hence convex in p."""
    fig, ax = plt.subplots(figsize=(6.6, 4.5))
    p = np.linspace(0.6, 5.0, 300)
    w, a = 1.0, 0.5
    pi = (1 - a) * p ** (1 / (1 - a)) * (a / w) ** (a / (1 - a))

    p_star = 2.6
    x_star = (a * p_star / w) ** (1 / (1 - a))
    y_star = x_star ** a
    fixed = p * y_star - w * x_star               # profit from the FIXED plan

    ax.plot(p, fixed, color=WARM, lw=2.2, ls=(0, (5, 3)),
            label=r"profit from the fixed plan $(x^{*},y^{*})$")
    ax.plot(p, pi, color=ACCENT, lw=2.8, label=r"$\pi(p,w)$  (convex)")
    pi_star = (1 - a) * p_star ** (1 / (1 - a)) * (a / w) ** (a / (1 - a))
    ax.plot([p_star], [pi_star], "o", color=INK, ms=8, zorder=6)
    drop(ax, p_star, pi_star)
    ax.annotate(r"tangent at $p^{*}$;  slope $=y^{*}$" "\n" "(Hotelling's lemma)",
                xy=(p_star, pi_star), xytext=(p_star - 1.75, pi_star + 2.6),
                fontsize=9.5, color=INK,
                arrowprops=dict(arrowstyle="->", color=MUTED, lw=1.2))
    ax.fill_between(p, pi, fixed, where=(pi >= fixed), color=GOOD, alpha=0.12, lw=0)
    ax.text(4.15, 2.1, "elsewhere the firm re-optimises\nand does strictly better",
            fontsize=9.5, color=GOOD, ha="center")

    ax.set_xlim(0.6, 5.0); ax.set_ylim(-1.5, 7.0)
    axes(ax, r"output price,  $p$", "profit")
    ax.legend(loc="upper left")
    fig.tight_layout()
    return save(fig, "profit-convex")


def quasiconvex_v():
    """{p : v(p,m) <= k} is a convex set, though v itself is not convex."""
    fig, ax = plt.subplots(figsize=(5.9, 4.5))
    m, a, k = 1.0, 0.5, 0.62
    # v = m a^a (1-a)^(1-a) / (p1^a p2^(1-a)) <= k  <=>  p1^a p2^(1-a) >= const
    c = (m * a ** a * (1 - a) ** (1 - a) / k)
    p1 = np.linspace(0.16, 4.0, 400)
    p2 = (c / p1 ** a) ** (1 / (1 - a))

    ax.fill_between(p1, p2, 4.2, color=ACCENT, alpha=0.14, lw=0)
    ax.plot(p1, p2, color=ACCENT, lw=2.6)
    ax.text(2.15, 2.55, r"$\{p:\ v(p,m)\leq k\}$", fontsize=14, color=ACCENT)
    ax.text(2.15, 2.15, "convex — the set is\nbowed away from the origin",
            fontsize=9.5, color=INK)

    # a chord between two points of the set stays inside it
    pa, pb = 0.55, 3.1
    qa = (c / pa ** a) ** (1 / (1 - a))
    qb = (c / pb ** a) ** (1 / (1 - a))
    ax.plot([pa, pb], [qa, qb], color=WARM, lw=2.0, ls=(0, (4, 3)))
    ax.plot([pa, pb], [qa, qb], "o", color=WARM, ms=7)
    ax.text(1.35, (qa + qb) / 2 + 0.22, "the chord lies inside", fontsize=9.5, color=WARM)

    ax.text(0.42, 0.34, "higher utility\n(cheaper prices)", fontsize=9, color=MUTED)
    ax.set_xlim(0, 4.2); ax.set_ylim(0, 4.2)
    axes(ax, r"$p_1$", r"$p_2$")
    ax.set_xticks([]); ax.set_yticks([])
    fig.tight_layout()
    return save(fig, "quasiconvex-v")


def leontief():
    """Leontief: the isoquant is a corner, V(y) the quadrant above it."""
    fig, (a1, a2) = plt.subplots(1, 2, figsize=(9.2, 4.1))
    A, B, y = 1.0, 1.5, 1.2
    xa, xb = y / A, y / B                       # corner at (y/a, y/b)

    # left: isoquant and input requirement set
    a1.fill_between([xa, 3.6], [xb, xb], 3.6, color=ACCENT, alpha=0.13, lw=0)
    a1.fill_between([xa, 3.6], [xb, xb], [xb, xb], color=ACCENT, alpha=0.0, lw=0)
    a1.plot([xa, xa], [xb, 3.6], color=ACCENT, lw=2.8)
    a1.plot([xa, 3.6], [xb, xb], color=ACCENT, lw=2.8)
    a1.plot([xa], [xb], "o", color=ACCENT, ms=8, zorder=5)
    a1.plot([0, 3.2], [0, 3.2 * (A / B)], color=MUTED, lw=1.4, ls=(0, (4, 3)))
    a1.text(2.55, 2.0, r"$V(y)$", fontsize=15, color=ACCENT)
    a1.text(1.28, 0.55, r"expansion path" "\n" r"$ax_1=bx_2$", fontsize=9, color=MUTED)
    a1.annotate(r"corner $\left(\frac{y}{a},\frac{y}{b}\right)$", xy=(xa, xb),
                xytext=(xa + 0.30, xb - 0.62), fontsize=10, color=INK,
                arrowprops=dict(arrowstyle="->", color=MUTED, lw=1.1))
    a1.set_xlim(0, 3.6); a1.set_ylim(0, 3.6)
    axes(a1, r"$x_1$", r"$x_2$", r"$f=\min\{ax_1,bx_2\}$")
    a1.set_xticks([]); a1.set_yticks([])

    # right: why there is no TRS at the corner
    a2.plot([xa, xa], [xb, 3.2], color=ACCENT, lw=2.8)
    a2.plot([xa, 3.4], [xb, xb], color=ACCENT, lw=2.8)
    a2.plot([xa], [xb], "o", color=BAD, ms=9, zorder=6)
    a2.annotate("slope undefined here —\nwhich is why the cost\nfunction cannot be found\nby differentiation",
                xy=(xa, xb), xytext=(xa + 0.42, xb + 0.95), fontsize=9.5, color=BAD,
                arrowprops=dict(arrowstyle="->", color=BAD, lw=1.3))
    a2.text(xa + 0.05, 2.75, r"$MP_1=0$", fontsize=10, color=MUTED, rotation=90)
    a2.text(2.35, xb + 0.10, r"$MP_2=0$", fontsize=10, color=MUTED)
    a2.set_xlim(0, 3.6); a2.set_ylim(0, 3.6)
    axes(a2, r"$x_1$", r"$x_2$", "No substitution at all")
    a2.set_xticks([]); a2.set_yticks([])

    fig.tight_layout()
    return save(fig, "leontief")


def profit_max_graph():
    """Isoprofit lines and the short-run production set: tangency is the FOC."""
    fig, ax = plt.subplots(figsize=(6.5, 4.6))
    x = np.linspace(0, 8.4, 300)
    a = 0.5
    f = 2.6 * x ** a
    ax.fill_between(x, 0, f, color=MUTED, alpha=0.10, lw=0)
    ax.plot(x, f, color=ACCENT, lw=2.8, label=r"$y=f(x)$")

    p, w = 1.0, 0.62                              # slope of isoprofit = w/p
    xs = (a * 2.6 * p / w) ** (1 / (1 - a))
    ys = 2.6 * xs ** a
    pi = p * ys - w * xs
    for c, style in ((pi, "-"), (pi - 1.5, (0, (5, 3))), (pi + 1.5, (0, (5, 3)))):
        ax.plot(x, (c + w * x) / p, color=WARM, lw=1.9 if style == "-" else 1.3, ls=style)
    ax.plot([xs], [ys], "o", color=INK, ms=8, zorder=6)
    drop(ax, xs, ys)
    ax.annotate(r"tangency:  $p\,f'(x)=w$", xy=(xs, ys), xytext=(xs - 3.3, ys + 1.9),
                fontsize=11, color=INK,
                arrowprops=dict(arrowstyle="->", color=MUTED, lw=1.2))
    ax.text(6.6, 2.05, "higher isoprofit\nlines are infeasible", fontsize=9.5, color=WARM)
    ax.text(0.35, 6.3, r"slope of isoprofit $=\dfrac{w}{p}$", fontsize=10.5, color=WARM)

    ax.set_xlim(0, 8.4); ax.set_ylim(0, 7.4)
    axes(ax, r"input  $x$", r"output  $y$")
    fig.tight_layout()
    return save(fig, "profit-max")


def cost_min_soc():
    """Tangency, and why a second-order movement lowers output."""
    fig, ax = plt.subplots(figsize=(6.4, 4.6))
    a = 0.5
    x1 = np.linspace(0.4, 5.2, 400)
    y = 1.55
    iso = (y / x1 ** a) ** (1 / (1 - a))
    ax.plot(x1, iso, color=ACCENT, lw=2.8, label=r"isoquant  $f(x)=y$")

    w1, w2 = 1.0, 1.0
    xs = y ** 2 * (w2 * a / (w1 * (1 - a))) ** (1 - a)
    xs = 1.55; ys = (y / xs ** a) ** (1 / (1 - a))
    c = w1 * xs + w2 * ys
    ax.plot(x1, (c - w1 * x1) / w2, color=WARM, lw=2.2, label=r"isocost  $w\cdot x=c$")
    ax.plot([xs], [ys], "o", color=INK, ms=8, zorder=7)
    drop(ax, xs, ys)

    # first-order move along the isocost, second-order gap down to the isoquant
    dx = 1.05
    x_move = xs + dx
    y_iso_line = (c - w1 * x_move) / w2
    y_isoq = (y / x_move ** a) ** (1 / (1 - a))
    ax.plot([x_move], [y_iso_line], "o", color=GOOD, ms=7, zorder=7)
    ax.annotate("", xy=(x_move, y_iso_line), xytext=(xs, ys),
                arrowprops=dict(arrowstyle="->", color=GOOD, lw=1.8))
    ax.annotate("", xy=(x_move, y_isoq), xytext=(x_move, y_iso_line),
                arrowprops=dict(arrowstyle="<->", color=BAD, lw=1.8))
    ax.text(x_move + 0.12, (y_iso_line + y_isoq) / 2, "output\nfalls", fontsize=9.5, color=BAD)
    ax.text(xs + 0.20, ys + 0.42, "first-order move:\ncost unchanged", fontsize=9.5, color=GOOD)

    ax.text(0.55, 0.35, r"$|TRS| = \dfrac{w_1}{w_2}$ at the optimum", fontsize=11, color=INK)
    ax.set_xlim(0, 5.2); ax.set_ylim(0, 5.2)
    axes(ax, r"$x_1$", r"$x_2$")
    ax.set_xticks([]); ax.set_yticks([])
    ax.legend(loc="upper right")
    fig.tight_layout()
    return save(fig, "cost-min")


def consumer_equilibrium():
    """Budget line, indifference curves, and the tangency that picks the bundle."""
    fig, ax = plt.subplots(figsize=(6.4, 4.6))
    m, p1, p2, a = 10.0, 1.4, 1.0, 0.5
    x1 = np.linspace(0.35, 8.4, 400)
    ax.plot(x1, (m - p1 * x1) / p2, color=WARM, lw=2.4, label=r"budget  $p\cdot x=m$")

    xs, ys = a * m / p1, (1 - a) * m / p2
    for u, col, lw in ((xs ** a * ys ** (1 - a), ACCENT, 2.7),
                       (xs ** a * ys ** (1 - a) * 0.78, MUTED, 1.5),
                       (xs ** a * ys ** (1 - a) * 1.22, MUTED, 1.5)):
        ax.plot(x1, (u / x1 ** a) ** (1 / (1 - a)), color=col, lw=lw)
    ax.plot([xs], [ys], "o", color=INK, ms=9, zorder=7)
    drop(ax, xs, ys)
    ax.annotate(r"$MRS=\dfrac{p_1}{p_2}$", xy=(xs, ys), xytext=(xs + 1.15, ys + 2.0),
                fontsize=12.5, color=INK,
                arrowprops=dict(arrowstyle="->", color=MUTED, lw=1.2))
    ax.text(1.05, 1.05, "affordable but\nnot best", fontsize=9.5, color=MUTED)
    ax.text(5.7, 7.0, "better, but\nunaffordable", fontsize=9.5, color=MUTED)

    ax.set_xlim(0, 8.4); ax.set_ylim(0, 11.2)
    axes(ax, r"$x_1$", r"$x_2$")
    ax.set_xticks([]); ax.set_yticks([])
    fig.tight_layout()
    return save(fig, "consumer-equilibrium")


def monotonicity():
    """Free disposal: V(y) extends up and to the right without bound."""
    fig, (a1, a2) = plt.subplots(1, 2, figsize=(9.2, 4.0))
    a = 0.5
    x1 = np.linspace(0.32, 4.2, 400)
    iso = (1.25 / x1 ** a) ** (1 / (1 - a))

    a1.fill_between(x1, iso, 4.4, color=ACCENT, alpha=0.13, lw=0)
    a1.plot(x1, iso, color=ACCENT, lw=2.6)
    px, py = 1.55, (1.25 / 1.55 ** a) ** (1 / (1 - a))
    a1.plot([px], [py], "o", color=INK, ms=8, zorder=6)
    for dx, dy in ((0.85, 0.0), (0.0, 0.85), (0.62, 0.62)):
        a1.annotate("", xy=(px + dx, py + dy), xytext=(px, py),
                    arrowprops=dict(arrowstyle="->", color=GOOD, lw=1.7))
    a1.text(2.55, 2.85, "more of either input\nstill produces $y$", fontsize=9.5, color=GOOD)
    a1.set_xlim(0, 4.4); a1.set_ylim(0, 4.4)
    axes(a1, r"$x_1$", r"$x_2$", "Monotonic: free disposal")
    a1.set_xticks([]); a1.set_yticks([])

    # right: what monotonicity rules out — a bounded, closed blob
    th = np.linspace(0, 2 * np.pi, 200)
    a2.fill(1.9 + 0.85 * np.cos(th), 2.1 + 0.62 * np.sin(th), color=BAD, alpha=0.15, lw=0)
    a2.plot(1.9 + 0.85 * np.cos(th), 2.1 + 0.62 * np.sin(th), color=BAD, lw=2.2)
    a2.annotate("", xy=(3.35, 2.1), xytext=(2.6, 2.1),
                arrowprops=dict(arrowstyle="->", color=BAD, lw=1.7))
    a2.text(2.05, 3.25, "adding inputs would take\nyou OUT of $V(y)$ —\nruled out by monotonicity",
            fontsize=9.5, color=BAD, ha="center")
    a2.set_xlim(0, 4.4); a2.set_ylim(0, 4.4)
    axes(a2, r"$x_1$", r"$x_2$", "Not monotonic")
    a2.set_xticks([]); a2.set_yticks([])

    fig.tight_layout()
    return save(fig, "monotonicity")


ALL = [expenditure_concave, profit_convex, quasiconvex_v, leontief,
       profit_max_graph, cost_min_soc, consumer_equilibrium, monotonicity]


def main():
    use_style()
    for fn in ALL:
        p = fn()
        print(f"  {p.name:30} {p.stat().st_size/1024:7.1f} KB   {fn.__doc__.splitlines()[0]}")


if __name__ == "__main__":
    main()
