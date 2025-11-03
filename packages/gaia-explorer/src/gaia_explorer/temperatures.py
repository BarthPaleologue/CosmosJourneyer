"""Fallback temperature helpers."""
from __future__ import annotations

import math
from typing import Dict, Optional, Set

from astropy.table import Table

from .metadata import SimbadMetadata
from .records import extract_row_value, safe_float

# Constants for the Ballesteros (2012) colour-temperature approximation.
_BV_CONVERSION_OFFSET = 0.020
_BV_CONVERSION_SCALE = 1.289
_BALLASTEROS_MIN_BV = -0.4
_BALLASTEROS_MAX_BV = 2.0

_DEFAULT_FALLBACK_TEMPERATURE = 3500.0
_WHITE_DWARF_FALLBACK = 12000.0
_NEUTRON_STAR_FALLBACK = 600000.0
_BLACK_HOLE_FALLBACK = 100000.0


def resolve_temperature_overrides(
    rows: Table,
    metadata_map: Dict[int, SimbadMetadata],
) -> Dict[int, float]:
    """
    Build a map of {source_id: temperature} for stars lacking Gaia teff_gspphot.

    Resolution strategy:
      1. Use SIMBAD-provided effective temperatures when available.
      2. Fall back to colour-based estimation from Gaia BP-RP.
      3. Estimate from spectral type / object type heuristics.
      4. Default to a cool dwarf temperature as a last resort.
    """
    missing_ids = _collect_missing_temperature_ids(rows)
    if not missing_ids:
        return {}

    print(f"[temperature] attempting fallback for {len(missing_ids)} stars with missing Gaia Teff.")

    overrides: Dict[int, float] = {}

    # Pass 1 – direct SIMBAD Teff.
    for sid in missing_ids:
        meta = metadata_map.get(sid)
        if meta and meta.effective_temperature is not None:
            overrides[sid] = meta.effective_temperature
    if overrides:
        print(f"[temperature] SIMBAD provided temperatures for {len(overrides)} stars.")

    # Pass 2 – Gaia colour-based estimate.
    unresolved: Set[int] = set(missing_ids) - set(overrides)
    if unresolved:
        colour_overrides = _estimate_temperatures_from_color(rows, unresolved)
        overrides.update(colour_overrides)

    # Pass 3 – spectral type / object type heuristics.
    unresolved = set(missing_ids) - set(overrides)
    heuristic_overrides: Dict[int, float] = {}
    for sid in unresolved:
        meta = metadata_map.get(sid)
        if not meta:
            continue
        temp = estimate_temperature_from_spectral_type(meta.spectral_type)
        if temp is None:
            temp = _default_temp_for_object_type(meta.object_type)
        if temp is not None:
            heuristic_overrides[sid] = temp
    if heuristic_overrides:
        print(f"[temperature] Spectral heuristics supplied temperatures for {len(heuristic_overrides)} stars.")
        overrides.update(heuristic_overrides)

    # Pass 4 – last resort default.
    unresolved = set(missing_ids) - set(overrides)
    if unresolved:
        for sid in unresolved:
            overrides[sid] = _DEFAULT_FALLBACK_TEMPERATURE
        print(f"[temperature] Assigned default dwarf temperature to {len(unresolved)} stars.")

    return overrides


def _collect_missing_temperature_ids(rows: Table) -> Set[int]:
    missing_ids: Set[int] = set()
    for row in rows:
        if safe_float(row, "teff_k") is not None:
            continue
        sid_raw = extract_row_value(row, "source_id")
        if sid_raw is None:
            continue
        try:
            sid = int(sid_raw)
        except Exception:
            continue
        missing_ids.add(sid)
    return missing_ids


def _estimate_temperatures_from_color(rows: Table, unresolved_ids: Set[int]) -> Dict[int, float]:
    """Fill in temperatures using BP-RP colour for any unresolved stars."""
    overrides: Dict[int, float] = {}
    for row in rows:
        sid_raw = extract_row_value(row, "source_id")
        if sid_raw is None:
            continue
        try:
            sid = int(sid_raw)
        except Exception:
            continue
        if sid not in unresolved_ids:
            continue

        bp_rp = safe_float(row, "bp_rp")
        temp = estimate_temperature_from_bp_rp(bp_rp)
        if temp is not None:
            overrides[sid] = temp

    if overrides:
        print(f"[temperature] Colour fallback supplied temperatures for {len(overrides)} stars.")
    return overrides


def estimate_temperature_from_bp_rp(bp_rp: Optional[float]) -> Optional[float]:
    """
    Estimate a stellar effective temperature from Gaia BP-RP colour.

    Conversion uses the Jordi et al. (2010) empirical BP-RP to B-V relation for dwarfs
    combined with the Ballesteros (2012) colour-temperature approximation.
    Results are clamped to 600 K – 40 000 K.
    """
    if bp_rp is None or not math.isfinite(bp_rp):
        return None

    # Convert BP-RP to B-V using a linear fit for dwarf stars.
    b_minus_v = (bp_rp + _BV_CONVERSION_OFFSET) / _BV_CONVERSION_SCALE
    b_minus_v = min(max(b_minus_v, _BALLASTEROS_MIN_BV), _BALLASTEROS_MAX_BV)

    denominator1 = 0.92 * b_minus_v + 1.7
    denominator2 = 0.92 * b_minus_v + 0.62
    if denominator1 <= 0 or denominator2 <= 0:
        return None

    temperature = 4600.0 * (1.0 / denominator1 + 1.0 / denominator2)
    temperature = min(max(temperature, 600.0), 40000.0)
    return temperature


_SPECTRAL_SEQUENCE = ["O", "B", "A", "F", "G", "K", "M", "L", "T", "Y"]
_SPECTRAL_BASE_TEMPS = {
    "O": 30000.0,
    "B": 20000.0,
    "A": 8500.0,
    "F": 6500.0,
    "G": 5600.0,
    "K": 4400.0,
    "M": 3300.0,
    "L": 2100.0,
    "T": 1300.0,
    "Y": 600.0,
}


def estimate_temperature_from_spectral_type(spectral_type: Optional[str]) -> Optional[float]:
    """Estimate temperature from a SIMBAD spectral type string."""
    if not spectral_type:
        return None

    s = spectral_type.strip()
    if not s:
        return None

    upper = s.upper()

    # White dwarf notation (DA, DB, DQ, DZ, DO, DC, etc.)
    if upper.startswith("D"):
        digits = _extract_numeric_component(upper)
        if digits is not None:
            return max(5000.0, min(40000.0, digits * 1000.0))
        return _WHITE_DWARF_FALLBACK

    # Handle sd (subdwarf) prefixes.
    if upper.startswith("SD"):
        upper = upper[2:]

    base_letter = None
    for ch in upper:
        if ch in _SPECTRAL_BASE_TEMPS:
            base_letter = ch
            break

    if base_letter is None:
        return None

    base_temp = _SPECTRAL_BASE_TEMPS[base_letter]

    subclass = _extract_numeric_component(upper)
    if subclass is None:
        return base_temp

    try:
        index = _SPECTRAL_SEQUENCE.index(base_letter)
    except ValueError:
        return base_temp

    next_index = min(index + 1, len(_SPECTRAL_SEQUENCE) - 1)
    next_letter = _SPECTRAL_SEQUENCE[next_index]
    next_temp = _SPECTRAL_BASE_TEMPS[next_letter]

    fraction = max(0.0, min(1.0, subclass / 10.0))
    interpolated = base_temp - fraction * (base_temp - next_temp)
    return interpolated


def _default_temp_for_object_type(object_type: Optional[str]) -> Optional[float]:
    if not object_type:
        return None
    upper = object_type.upper()
    if "WD" in upper:
        return _WHITE_DWARF_FALLBACK
    if "NS" in upper or "PSR" in upper:
        return _NEUTRON_STAR_FALLBACK
    if "BH" in upper:
        return _BLACK_HOLE_FALLBACK
    return None


def _extract_numeric_component(text: str) -> Optional[float]:
    digits = []
    for ch in text:
        if ch.isdigit() or ch == ".":
            digits.append(ch)
        elif digits:
            break
    if not digits:
        return None
    try:
        return float("".join(digits))
    except ValueError:
        return None
