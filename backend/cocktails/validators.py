from decimal import Decimal, InvalidOperation

from django.core.exceptions import ValidationError


def validate_half_star_rating(value):
    """Allow 1.0–5.0 in steps of 0.5."""
    try:
        d = Decimal(str(value)).quantize(Decimal("0.1"))
    except (InvalidOperation, ValueError) as exc:
        raise ValidationError("Invalid rating.") from exc
    if d < 1 or d > 5:
        raise ValidationError("Rating must be between 1 and 5.")
    if (d * 2) % Decimal("1") != 0:
        raise ValidationError("Use half-star steps only (e.g. 4 or 4.5).")


def validate_half_star_rating_serializer(value):
    """DRF DecimalField passes Decimal; reuse model rules."""
    validate_half_star_rating(value)
    return value
