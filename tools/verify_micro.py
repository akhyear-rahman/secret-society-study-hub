#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Machine-check the algebra behind the ECON 401 model answers.

    python tools/verify_micro.py

Every result asserted in an ECON 401 answer that can be checked symbolically
is checked here. The point is that "the answer is correct" should be a fact
the repository can re-establish on demand, not a claim resting on whoever
typed it having been careful that day.

One recurring trap, worth knowing before editing: writing `1-a` inside an
exponent makes SymPy reason about a base it cannot sign, and simplification
then stalls. Carry `b` as its own positive symbol and substitute `b -> 1-a`
at the very end.
"""

from __future__ import annotations
import random
import sys
import sympy as sp

PASS, FAIL = [], []


def check(name: str, cond) -> None:
    ok = bool(cond) if not hasattr(cond, "is_zero") else (sp.simplify(cond) == 0)
    (PASS if ok else FAIL).append(name)
    print(f"  {'OK  ' if ok else 'FAIL'}  {name}")


def _numeric(lhs, rhs, trials: int = 40, tol: float = 1e-10) -> bool:
    """Fallback: agree at many random positive points?

    SymPy's powsimp routinely gives up on nested fractional powers such as
    (y/A)^(1/(a+b)) * (w1/a)^(a/(a+b)) — it reports "not equal" when it really
    means "cannot decide". Sampling settles those honestly. Six results in this
    file are true and only provable this way; treating them as failures would
    be as wrong as asserting them without any check at all.
    """
    free = sorted(lhs.free_symbols | rhs.free_symbols, key=str)
    if not free:
        return sp.simplify(lhs - rhs) == 0
    rng = random.Random(20260401)          # fixed seed: reproducible runs
    for _ in range(trials):
        vals = {v: sp.Rational(rng.randint(11, 400), rng.randint(7, 90)) for v in free}
        try:
            a_, b_ = complex(sp.N(lhs.subs(vals), 30)), complex(sp.N(rhs.subs(vals), 30))
        except Exception:
            return False
        if abs(b_) > 0 and abs(a_ - b_) / abs(b_) > tol:
            return False
    return True


def eq(lhs, rhs) -> bool:
    """True when two expressions agree. Symbolic first, then sampled."""
    if sp.simplify(sp.powsimp(sp.expand_power_exp(lhs - rhs), force=True)) == 0:
        return True
    return _numeric(sp.sympify(lhs), sp.sympify(rhs))


def ratio1(lhs, rhs) -> bool:
    if sp.simplify(sp.powsimp(lhs / rhs, force=True)) == 1:
        return True
    return _numeric(sp.sympify(lhs), sp.sympify(rhs))


# ---------------------------------------------------------------- ch7 -----

def consumer():
    print("\nCobb-Douglas consumer:  u = x1^a x2^(1-a),  p1x1+p2x2 = m")
    x1, x2, p1, p2, m, a, b, u, lam = sp.symbols(
        "x1 x2 p1 p2 m a b u lambda", positive=True)

    L = x1**a * x2**(1 - a) - lam * (p1 * x1 + p2 * x2 - m)
    s = sp.solve([sp.diff(L, x1), sp.diff(L, x2), sp.diff(L, lam)],
                 [x1, x2, lam], dict=True)[0]
    check("Marshallian  x1 = a m / p1", eq(s[x1], a * m / p1))
    check("Marshallian  x2 = (1-a) m / p2", eq(s[x2], (1 - a) * m / p2))

    # b stands in for 1-a throughout the power algebra
    X1, X2 = a * m / p1, b * m / p2
    v = m * a**a * b**b / (p1**a * p2**b)
    # a + b = 1 is what makes m^(a+b) collapse to m, so impose it here.
    check("indirect utility v = m a^a b^b / (p1^a p2^b)",
          ratio1(sp.powsimp((X1**a * X2**b).subs(b, 1 - a), force=True),
                 v.subs(b, 1 - a)))

    e = u * (p1 / a)**a * (p2 / b)**b
    check("expenditure e inverts v  (e(p,v(p,m)) = m)", ratio1(e.subs(u, v), m))

    h1, h2 = sp.diff(e, p1), sp.diff(e, p2)
    check("Shephard  h1 = de/dp1", ratio1(h1, u * a**(1 - a) * p1**(a - 1) * (p2 / b)**b))
    check("duality   h1(p,u) = x1(p, e(p,u))", ratio1(h1, a * e / p1))
    check("duality   h2(p,u) = x2(p, e(p,u))", ratio1(h2, b * e / p2))

    roy = -sp.diff(v, p1) / sp.diff(v, m)
    check("Roy's identity returns x1", eq(roy, a * m / p1))

    slut = sp.powsimp(sp.expand_power_exp(
        sp.diff(h1, p1).subs(u, v) - X1 * sp.diff(X1, m)), force=True)
    check("Slutsky   dx1/dp1 = dh1/dp1 - x1 dx1/dm",
          sp.simplify(sp.powsimp(sp.expand(slut - sp.diff(X1, p1)).subs(b, 1 - a),
                                 force=True)) == 0)

    se = sp.simplify(sp.diff(h1, p1).subs(u, v).subs(b, 1 - a))
    ie = sp.simplify(-X1 * sp.diff(X1, m))
    check("SE is the (1-a) share of the total effect",
          eq(se, -(1 - a) * a * m / p1**2))
    check("IE is the a share of the total effect", eq(ie, -a**2 * m / p1**2))

    check("expenditure is homogeneous of degree 1 in p",
          ratio1(e.subs({p1: 2 * p1, p2: 2 * p2}).subs(b, 1 - a),
                 (2 * e).subs(b, 1 - a)))
    check("Marshallian demand is homogeneous of degree 0",
          eq((a * (2 * m) / (2 * p1)), a * m / p1))


# ---------------------------------------------------------------- ch1 -----

def technology():
    print("\nTechnology:  Cobb-Douglas and CES")
    x1, x2, a, r, A, t = sp.symbols("x1 x2 a rho A t", positive=True)

    f = x1**a * x2**(1 - a)
    trs = -sp.diff(f, x1) / sp.diff(f, x2)
    check("Cobb-Douglas TRS = -(a/(1-a)) x2/x1",
          eq(sp.simplify(trs), -(a / (1 - a)) * x2 / x1))

    # elasticity of substitution via sigma = dln(x2/x1) / dln|TRS|
    # sigma = dln(x2/x1) / dln|TRS|.  Put L = ln(x2/x1) and differentiate in L:
    # you cannot differentiate with respect to an expression in SymPy.
    L = sp.symbols("L", real=True)
    ln_trs_cd = sp.log(a / (1 - a)) + L           # |TRS| = (a/(1-a)) e^L
    check("Cobb-Douglas elasticity of substitution = 1",
          eq(sp.simplify(1 / sp.diff(ln_trs_cd, L)), 1))

    check("Cobb-Douglas is CRS  (f(tx) = t f(x))",
          ratio1(f.subs({x1: t * x1, x2: t * x2}), t * f))
    check("output elasticity of x1 equals a",
          eq(sp.simplify(sp.diff(f, x1) * x1 / f), a))

    g = (x1**r + x2**r)**(1 / r)
    trs_ces = sp.simplify(-sp.diff(g, x1) / sp.diff(g, x2))
    check("CES TRS = -(x1/x2)^(rho-1)", eq(trs_ces, -(x1 / x2)**(r - 1)))
    ln_trs_ces = (1 - r) * L                       # |TRS| = (x1/x2)^(rho-1) = e^{(1-rho)L}
    check("CES elasticity of substitution = 1/(1-rho)",
          eq(sp.simplify(1 / sp.diff(ln_trs_ces, L)), 1 / (1 - r)))
    check("CES is CRS", ratio1(g.subs({x1: t * x1, x2: t * x2}), t * g))

    # rho -> 0 limit is Cobb-Douglas (unit weights => sqrt(x1 x2))
    lim = sp.limit((sp.Rational(1, 2) * x1**r + sp.Rational(1, 2) * x2**r)**(1 / r), r, 0)
    check("CES -> Cobb-Douglas as rho -> 0", eq(sp.simplify(lim), sp.sqrt(x1 * x2)))


# ---------------------------------------------------------------- ch2/4 ---

def firm():
    print("\nFirm:  f(x) = x^a  profit, and Cobb-Douglas cost")
    x, p, w, a, y, A, b = sp.symbols("x p w a y A b", positive=True)

    foc = sp.Eq(p * sp.diff(x**a, x), w)
    xstar = sp.solve(foc, x)[0]
    check("factor demand  x(p,w) = (a p / w)^(1/(1-a))",
          ratio1(xstar, (a * p / w)**(1 / (1 - a))))
    ystar = sp.simplify(xstar**a)
    check("supply  y = (a p / w)^(a/(1-a))", ratio1(ystar, (a * p / w)**(a / (1 - a))))
    pi = sp.simplify(p * ystar - w * xstar)
    # x* and y* depend on p and w only through the ratio p/w, so doubling both
    # leaves quantities alone and scales profit by exactly two.
    pi2 = sp.simplify((2 * p) * ystar.subs({p: 2 * p, w: 2 * w})
                      - (2 * w) * xstar.subs({p: 2 * p, w: 2 * w}))
    check("profit function is homogeneous of degree 1 in (p,w)", ratio1(pi2, 2 * pi))
    check("Hotelling  d(pi)/dp = y", eq(sp.simplify(sp.diff(pi, p)), ystar))
    check("Hotelling  -d(pi)/dw = x", eq(sp.simplify(-sp.diff(pi, w)), xstar))

    # cost minimisation for y = A x1^a x2^b
    x1, x2, w1, w2, lm = sp.symbols("x1 x2 w1 w2 lm", positive=True)
    Lc = w1 * x1 + w2 * x2 - lm * (A * x1**a * x2**b - y)
    sc = sp.solve([sp.diff(Lc, x1), sp.diff(Lc, x2), sp.diff(Lc, lm)],
                  [x1, x2, lm], dict=True)[0]
    cost = sp.simplify(w1 * sc[x1] + w2 * sc[x2])
    claim = ((a + b) * (y / A)**(1 / (a + b))
             * (w1 / a)**(a / (a + b)) * (w2 / b)**(b / (a + b)))
    check("Cobb-Douglas cost function c(w,y)", ratio1(cost, claim))
    check("cost is homogeneous of degree 1 in w",
          ratio1(claim.subs({w1: 2 * w1, w2: 2 * w2}), 2 * claim))
    check("Shephard  dc/dw1 = x1*", ratio1(sp.simplify(sp.diff(claim, w1)),
                                           sp.simplify(sc[x1])))


def main() -> int:
    print("Verifying the algebra behind the ECON 401 answers")
    consumer(); technology(); firm()
    print(f"\n{len(PASS)} passed, {len(FAIL)} failed")
    for f in FAIL:
        print(f"  ! {f}")
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
