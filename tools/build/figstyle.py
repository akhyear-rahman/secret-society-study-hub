# -*- coding: utf-8 -*-
"""Shared figure style for the ECON 401 diagrams.

Two problems this solves.

**Theme.** The app has a dark and a light theme. A figure with a baked-in
black axis is unreadable on one of them. So every structural colour — axes,
ticks, label text, neutral lines — is drawn in a sentinel colour and swapped
for `currentColor` in the saved SVG, which makes the figure inherit the
page's own text colour. Meaningful colours (the accent used to pick out the
answer, the shading on a surplus area) stay fixed, because they carry
information rather than decoration.

**Reading load.** These are revision diagrams for someone who finds dense
pages hard to read, so the defaults here are deliberately spare: no grid, two
visible spines, generous type, and at most a handful of labels. Every figure
should survive being glanced at for three seconds.

Text is rendered as paths (`svg.fonttype='path'`) so a figure looks identical
on a machine that does not have the font, at the cost of a slightly larger
file. Those paths carry a `fill`, which the sentinel swap catches too.
"""

from __future__ import annotations

import re
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

# Swapped for currentColor after saving. Must not occur naturally in output.
INK = "#123456"

# Information-bearing colours. These match the app's own accents and are
# chosen to stay legible on both dark and light backgrounds.
ACCENT = "#5ac8fa"   # the thing being derived / the answer
WARM   = "#e8a33d"   # the comparison case, or the second curve
GOOD   = "#4ec9a0"   # a surplus / gain region
BAD    = "#e2606b"   # a loss / deadweight region
MUTED  = "#8b93a7"   # construction lines, drop-lines

ROOT = Path(__file__).resolve().parent.parent.parent
OUT = ROOT / "content" / "figures"


def use_style() -> None:
    """Apply the house style to every subsequent figure."""
    plt.rcdefaults()
    plt.rcParams.update({
        "svg.fonttype": "path",
        "figure.facecolor": "none",
        "axes.facecolor": "none",
        "savefig.facecolor": "none",
        "savefig.transparent": True,
        "font.family": "DejaVu Sans",
        "font.size": 11.5,
        "axes.labelsize": 12.5,
        "axes.titlesize": 13.5,
        "axes.titleweight": "bold",
        "axes.labelcolor": INK,
        "axes.edgecolor": INK,
        "axes.linewidth": 1.3,
        "text.color": INK,
        "xtick.color": INK,
        "ytick.color": INK,
        "xtick.labelsize": 11,
        "ytick.labelsize": 11,
        "axes.grid": False,
        "axes.spines.top": False,
        "axes.spines.right": False,
        "legend.frameon": False,
        "legend.fontsize": 11,
        "lines.linewidth": 2.4,
        "lines.solid_capstyle": "round",
    })


def axes(ax, xlabel: str, ylabel: str, title: str | None = None) -> None:
    """Label a panel and strip it back to the two spines that carry meaning."""
    ax.set_xlabel(xlabel)
    ax.set_ylabel(ylabel)
    if title:
        ax.set_title(title, pad=12)
    ax.spines["left"].set_position(("outward", 4))
    ax.spines["bottom"].set_position(("outward", 4))
    ax.tick_params(length=4, width=1.1)


def arrow(ax, xy_from, xy_to, color=MUTED, lw=1.4, style="->", ls="-"):
    ax.annotate("", xy=xy_to, xytext=xy_from,
                arrowprops=dict(arrowstyle=style, color=color, lw=lw,
                                linestyle=ls, shrinkA=0, shrinkB=0))


def drop(ax, x, y, color=MUTED, lw=1.1):
    """Dashed construction lines from a point to both axes."""
    ax.plot([x, x], [0, y], ls=(0, (4, 3)), color=color, lw=lw, zorder=1)
    ax.plot([0, x], [y, y], ls=(0, (4, 3)), color=color, lw=lw, zorder=1)


def save(fig, name: str) -> Path:
    """Write `name`.svg into content/figures with the theme swap applied."""
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{name}.svg"
    fig.savefig(path, format="svg", bbox_inches="tight", pad_inches=0.16,
                transparent=True)
    plt.close(fig)

    svg = path.read_text(encoding="utf-8")
    # Sentinel -> currentColor, in every form matplotlib emits it.
    svg = re.sub(re.escape(INK), "currentColor", svg, flags=re.I)
    svg = re.sub(r"(fill|stroke):\s*none\s*;\s*", r"\1:none;", svg)
    # Drop the opaque backdrop matplotlib writes even when transparent.
    svg = re.sub(r'<rect[^>]*?style="fill:\s*#ffffff[^"]*"[^>]*/>', "", svg)
    # Trim the metadata block; it is a third of the file and renders nothing.
    svg = re.sub(r"<metadata>.*?</metadata>", "", svg, flags=re.S)
    svg = re.sub(r"<!--.*?-->", "", svg, flags=re.S)
    svg = re.sub(r"\n\s*\n", "\n", svg)
    # Drop the intrinsic pt size so the figure scales from viewBox + CSS alone.
    # Left in, a 731pt width fights `max-width:100%` on narrow screens.
    svg = re.sub(r'(<svg\b[^>]*?)\s+width="[\d.]+pt"', r"\1", svg, count=1)
    svg = re.sub(r'(<svg\b[^>]*?)\s+height="[\d.]+pt"', r"\1", svg, count=1)
    path.write_text(svg, encoding="utf-8")
    return path
