from __future__ import annotations

import re
from fractions import Fraction

from cocktails.models import RecipeIngredient

_UNIT_SUFFIXES: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"^\s*(.+?)\s*(oz|ounce|ounces)\.?\s*$", re.I), RecipeIngredient.Unit.OZ),
    (re.compile(r"^\s*(.+?)\s*(ml|milliliters?|millilitres?)\.?\s*$", re.I), RecipeIngredient.Unit.ML),
    (re.compile(r"^\s*(.+?)\s*(cl|centiliters?|centilitres?)\.?\s*$", re.I), RecipeIngredient.Unit.CL),
    (re.compile(r"^\s*(.+?)\s*(dash|dashes)\.?\s*$", re.I), RecipeIngredient.Unit.DASH),
    (re.compile(r"^\s*(.+?)\s*(drop|drops)\.?\s*$", re.I), RecipeIngredient.Unit.DROP),
    (re.compile(r"^\s*(.+?)\s*(tsp|teaspoon|teaspoons)\.?\s*$", re.I), RecipeIngredient.Unit.TSP),
    (re.compile(r"^\s*(.+?)\s*(tbsp|tblsp|tablespoon|tablespoons)\.?\s*$", re.I), RecipeIngredient.Unit.TBSP),
    (re.compile(r"^\s*(.+?)\s*(cup|cups)\.?\s*$", re.I), RecipeIngredient.Unit.CUP),
    (re.compile(r"^\s*(.+?)\s*(bar\s*spoon|barspoon|barspoons)\.?\s*$", re.I), RecipeIngredient.Unit.BARSPOON),
    (re.compile(r"^\s*(.+?)\s*(slice|slices)\.?\s*$", re.I), RecipeIngredient.Unit.SLICE),
    (re.compile(r"^\s*(.+?)\s*(wedge|wedges)\.?\s*$", re.I), RecipeIngredient.Unit.WEDGE),
    (re.compile(r"^\s*(.+?)\s*(sprig|sprigs)\.?\s*$", re.I), RecipeIngredient.Unit.SPRIG),
    (re.compile(r"^\s*(.+?)\s*(piece|pieces|pc|pcs)\.?\s*$", re.I), RecipeIngredient.Unit.PIECE),
    (re.compile(r"^\s*(.+?)\s*(whole)\.?\s*$", re.I), RecipeIngredient.Unit.WHOLE),
    (re.compile(r"^\s*(.+?)\s*(top)\.?\s*$", re.I), RecipeIngredient.Unit.TOP),
    (re.compile(r"^\s*(.+?)\s*(rinse)\.?\s*$", re.I), RecipeIngredient.Unit.RINSE),
    (re.compile(r"^\s*(.+?)\s*(shot|shots)\.?\s*$", re.I), RecipeIngredient.Unit.PIECE),
    (re.compile(r"^\s*(.+?)\s*(g|gram|grams|gr)\.?\s*$", re.I), RecipeIngredient.Unit.PIECE),
]

_RE_NUMBER = re.compile(r"^\s*((?:\d+\s+)?(?:\d+/\d+|\d+\.?\d*))\s*$")
_RE_SPLIT = re.compile(r"^\s*((?:[\d.]+\s+)?(?:\d+/\d+|\d+\.?\d*)?)\s+(.+?)\s*$")


def _compress_qty_str(s: str) -> str:
    t = s.strip()
    if len(t) > 20:
        return t[:20]
    return t


def _normalize_quantity_token(token: str) -> str:
    t = token.strip()
    if not t:
        return ""

    parts = t.split()
    total: Fraction | None = None

    def add_fr(f: Fraction) -> None:
        nonlocal total
        total = f if total is None else total + f

    for part in parts:
        if "/" in part:
            try:
                num, den = part.split("/", 1)
                add_fr(Fraction(int(num), int(den)))
            except (ValueError, ZeroDivisionError):
                return t
        else:
            try:
                add_fr(Fraction(float(part)) if "." in part else Fraction(int(part), 1))
            except (ValueError, ZeroDivisionError):
                return t

    if total is None:
        return t
    if total.denominator == 1:
        return str(total.numerator)
    q = f"{float(total):g}"
    return q[:20]


def parse_measure(raw: str | None) -> tuple[str, str, str]:
    """
    Parse a CocktailDB-style measure into (quantity, unit_choice, notes).
    Unknown formats go to notes so nothing is silently dropped.
    """
    if not raw:
        return "", "", ""

    original = raw.strip()
    if not original:
        return "", "", ""

    low = original.lower()

    if any(
        x in low
        for x in (
            "fill with",
            "fill up",
            "top with",
            "top up",
            "garnish",
            "twist of",
            "glass of",
        )
    ):
        return "", "", original[:200]

    for rx, unit in _UNIT_SUFFIXES:
        m = rx.match(original)
        if not m:
            continue
        qty_raw = m.group(1).strip()
        qty = _normalize_quantity_token(qty_raw)
        q = _compress_qty_str(qty or qty_raw)
        return q, unit, ""

    if low in ("top", "top off", "fill"):
        return "", RecipeIngredient.Unit.TOP, ""

    if _RE_NUMBER.match(original):
        return _compress_qty_str(original.strip()), "", ""

    m2 = _RE_SPLIT.match(original)
    if m2:
        q, rest = m2.group(1), m2.group(2).strip()
        qn = _normalize_quantity_token(q)
        qf = _compress_qty_str(qn or q)
        sub_qty, sub_unit, sub_notes = parse_measure(rest)
        if sub_unit:
            combined = " ".join(x for x in (qf, sub_qty) if x).strip()
            return (combined or qf), sub_unit, sub_notes

    return "", "", original[:200]
