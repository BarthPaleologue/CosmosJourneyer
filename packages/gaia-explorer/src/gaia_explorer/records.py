"""Conversion helpers from Gaia rows into internal star records."""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Dict, Iterator, List, Optional, Sequence, Tuple

from astropy.table import Row, Table

from .config import LIGHT_YEAR_PER_PARSEC


@dataclass(slots=True)
class StarRecord:
    """Internal representation of a Gaia star."""

    name: str
    x: float
    y: float
    z: float
    temperature: Optional[float]


def iter_star_records(
    rows: Table, name_overrides: Optional[Dict[int, str]] = None
) -> Iterator[StarRecord]:
    for row in rows:
        override_name: Optional[str] = None
        if name_overrides is not None:
            sid = extract_row_value(row, "source_id")
            if sid is not None:
                try:
                    override_name = name_overrides.get(int(sid))
                except Exception:
                    override_name = None
        star = row_to_star(row, override_name=override_name)
        if star is not None:
            yield star


def row_to_star(row: Row, override_name: Optional[str] = None) -> Optional[StarRecord]:
    parallax = safe_float(row, "parallax")
    ra = safe_float(row, "ra")
    dec = safe_float(row, "dec")
    temperature = safe_float(row, "teff_k")
    name = (
        override_name
        or safe_str(row, "designation")
        or safe_str(row, "source_id")
    )

    if (
        parallax is None
        or parallax <= 0.0
        or ra is None
        or dec is None
        or name is None
    ):
        return None

    distance_pc = 1000.0 / parallax
    distance_ly = distance_pc * LIGHT_YEAR_PER_PARSEC
    x, y, z = to_cartesian(ra, dec, distance_ly)

    return StarRecord(name=name, x=x, y=y, z=z, temperature=temperature)


def safe_float(row: Row, key: str) -> Optional[float]:
    value = extract_row_value(row, key)
    if value is None:
        return None
    try:
        result = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(result):
        return None
    return result


def safe_str(row: Row, key: str) -> Optional[str]:
    value = extract_row_value(row, key)
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def extract_row_value(row: Row, key: str) -> Optional[object]:
    value = row[key]
    if value is None:
        return None

    mask = getattr(value, "mask", None)
    if mask is not None:
        try:
            if bool(mask):
                return None
        except TypeError:
            if getattr(mask, "any", None) and mask.any():
                return None
        value = getattr(value, "data", value)

    if hasattr(value, "item"):
        try:
            return value.item()
        except Exception:
            pass
    return value


def to_cartesian(ra_deg: float, dec_deg: float, distance_ly: float) -> Tuple[float, float, float]:
    ra_rad = math.radians(ra_deg)
    dec_rad = math.radians(dec_deg)

    cos_dec = math.cos(dec_rad)
    x = distance_ly * cos_dec * math.cos(ra_rad)
    y = distance_ly * cos_dec * math.sin(ra_rad)
    z = distance_ly * math.sin(dec_rad)
    return x, y, z
