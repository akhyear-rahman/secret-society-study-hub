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
    """Record a result. `cond` may be a bool, a SymPy Boolean, or an
    expression that should be zero.

    The Boolean case has to come first: SymPy's BooleanTrue inherits an
    `is_zero` attribute from Basic, so an attribute test alone sends a
    perfectly true comparison down the "simplify to zero" branch and reports
    it as a failure.
    """
    if cond is True or cond is False:
        ok = bool(cond)
    elif isinstance(cond, sp.logic.boolalg.Boolean):
        ok = bool(cond)
    elif hasattr(cond, "is_zero"):
        ok = sp.simplify(cond) == 0
    else:
        ok = bool(cond)
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


# ---------------------------------------------------------- second band ---

def value_function_curvature():
    print("\nCurvature of the value functions")
    p1, p2, u, al, p, w, aa = sp.symbols("p1 p2 u alpha p w a", positive=True)

    e = u * (p1 / al) ** al * (p2 / (1 - al)) ** (1 - al)
    H = sp.hessian(e, (p1, p2))
    at = {al: sp.Rational(1, 2), p1: 3, p2: 5, u: 2}
    check("e(p,u): own second derivative <= 0 (concave in p)",
          sp.N(H[0, 0].subs(at)) <= 0)
    # e is homogeneous of degree one in p, so Euler makes the Hessian singular:
    # negative SEMIdefinite, never negative definite.
    check("e(p,u): Hessian is singular (homogeneity of degree 1 in p)",
          sp.simplify(H.det()) == 0)

    pi = (1 - aa) * p ** (1 / (1 - aa)) * (aa / w) ** (aa / (1 - aa))
    check("pi(p,w): second derivative in p >= 0 (convex in p)",
          sp.N(sp.diff(pi, p, 2).subs({aa: sp.Rational(1, 2), w: 1, p: 3})) >= 0)


def leontief_and_returns():
    print("\nLeontief cost, and DRS as restricted CRS")
    w1, w2, y, a, b, t, x1, x2, z = sp.symbols("w1 w2 y a b t x1 x2 z", positive=True)

    c = w1 * (y / a) + w2 * (y / b)          # corner: ax1 = bx2 = y
    check("Leontief cost c(w,y) = y(w1/a + w2/b)", eq(c, y * (w1 / a + w2 / b)))
    check("Leontief cost homogeneous of degree 1 in w",
          eq(c.subs({w1: 2 * w1, w2: 2 * w2}), 2 * c))
    check("Leontief cost linear in y (constant returns)", sp.diff(c, y, 2) == 0)

    F = x1 ** sp.Rational(1, 3) * x2 ** sp.Rational(1, 3) * z ** sp.Rational(1, 3)
    check("F(x1,x2,z) is CRS in all three inputs",
          eq(F.subs({x1: t * x1, x2: t * x2, z: t * z}), t * F))
    f = F.subs(z, 1)                          # hold the third input fixed
    check("holding z fixed gives DRS: f(tx) = t^(2/3) f(x)",
          eq(f.subs({x1: t * x1, x2: t * x2}), t ** sp.Rational(2, 3) * f))


def wacm_table():
    """The two-observation table set in 2016 Q4(B) and 2023 Q6(B)."""
    print("\nWACM on the exam's own table")
    A = dict(y=100, w=(2, 1), x=(10, 20))
    B = dict(y=110, w=(1, 2), x=(14, 10))
    dot = lambda w, x: w[0] * x[0] + w[1] * x[1]
    # y_B > y_A, so under monotonicity x_B also produces at least y_A: it was
    # an available way of reaching 100, and at A's prices it was cheaper.
    check("table VIOLATES WACM at A's prices (40 > 38)",
          dot(A["w"], A["x"]) > dot(A["w"], B["x"]))
    check("table satisfies the inequality at B's prices (34 <= 50)",
          dot(B["w"], B["x"]) <= dot(B["w"], A["x"]))


# ----------------------------------------------------------- third band ---

def tax_comparison():
    """Excise vs income tax raising identical revenue."""
    print("\nExcise tax vs income tax")
    al = sp.Rational(1, 2)
    m, p, tax = 12, 1, 1

    x1e, x2e = al * m / (p + tax), (1 - al) * m          # excise on good 1
    u_ex = x1e ** al * x2e ** (1 - al)
    revenue = tax * x1e
    mi = m - revenue                                      # same revenue, lump sum
    x1i, x2i = al * mi / p, (1 - al) * mi
    u_in = x1i ** al * x2i ** (1 - al)

    check("both taxes raise the same revenue", eq(revenue, m - mi))
    check("income tax leaves higher utility", sp.N(u_in) > sp.N(u_ex))
    # The sharp argument: the excise bundle is still affordable after the
    # income tax, so that consumer can copy it and then do strictly better by
    # re-optimising. No indifference curves needed.
    check("excise bundle affordable at pre-tax prices on the reduced income",
          sp.N(p * x1e + x2e) <= sp.N(mi))


def mrs_invariance():
    """MRS survives any monotonic transformation of utility."""
    print("\nMRS under monotonic transformation")
    x1, x2, a = sp.symbols("x1 x2 a", positive=True)
    u = x1 ** a * x2 ** (1 - a)
    base = sp.diff(u, x1) / sp.diff(u, x2)
    for g, name in ((sp.log(u), "ln u"), (u ** 3, "u^3"), (2 * u + 5, "2u+5")):
        check(f"MRS unchanged under {name}",
              eq(base, sp.diff(g, x1) / sp.diff(g, x2)))


def sigma_from_definition():
    """sigma = d ln(x2/x1) / d ln|TRS|, worked from the definition."""
    print("\nElasticity of substitution from its definition")
    L, a, r = sp.symbols("L a r", positive=True)
    # Write everything in L = ln(x2/x1); differentiating logs is then trivial.
    check("Cobb-Douglas: ln|TRS| = ln(a/(1-a)) + L gives sigma = 1",
          eq(1 / sp.diff(sp.log(a / (1 - a)) + L, L), 1))
    check("CES: ln|TRS| = (1-r)L gives sigma = 1/(1-r)",
          eq(1 / sp.diff((1 - r) * L, L), 1 / (1 - r)))


def hotelling():
    """Differentiating the profit function returns the optimal plan."""
    print("\nHotelling's lemma")
    w, p, a = sp.symbols("w p a", positive=True)
    x = (a * p / w) ** (1 / (1 - a))
    y = x ** a
    pi = p * y - w * x
    at = {a: sp.Rational(1, 2), p: 3, w: 2}
    check("d(pi)/dp = y*", abs(sp.N((sp.diff(pi, p) - y).subs(at))) < 1e-9)
    check("-d(pi)/dw = x*", abs(sp.N((-sp.diff(pi, w) - x).subs(at))) < 1e-9)


def ump_emp_consistency():
    """At the optimum the two problems agree: e(p, v(p,m)) = m."""
    print("\nUtility maximisation and expenditure minimisation")
    al = sp.Rational(1, 2)
    m, p1, p2 = 12, 1, 2
    x1, x2 = al * m / p1, (1 - al) * m / p2
    u = x1 ** al * x2 ** (1 - al)
    e = u * (p1 / al) ** al * (p2 / (1 - al)) ** (1 - al)
    check("e(p, v(p,m)) = m", eq(e, m))


def main() -> int:
    print("Verifying the algebra behind the ECON 401 answers")
    consumer(); technology(); firm()
    value_function_curvature(); leontief_and_returns(); wacm_table()
    tax_comparison(); mrs_invariance(); sigma_from_definition()
    hotelling(); ump_emp_consistency()
    print(f"\n{len(PASS)} passed, {len(FAIL)} failed")
    for f in FAIL:
        print(f"  ! {f}")
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
