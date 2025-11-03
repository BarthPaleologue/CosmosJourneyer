"""Fallback temperature resolution helpers."""
from __future__ import annotations

import math
from typing import Dict, List, Optional, Sequence, Set, Tuple

from astroquery.simbad import Simbad
from astropy.table import Row, Table

from .records import extract_row_value, safe_float, safe_str

# Constants for the Ballesteros (2012) colour-temperature approximation.
_BV_CONVERSION_OFFSET = 0.020
_BV_CONVERSION_SCALE = 1.289
_BALLASTEROS_MIN_BV = -0.4
_BALLASTEROS_MAX_BV = 2.0


def resolve_temperature_overrides(
    rows: Table,
    name_overrides: Optional[Dict[int, str]] = None,
    batch_size: int = 400,
) -> Dict[int, float]:
    """
    Build a map of {source_id: temperature} for stars lacking Gaia teff_gspphot.

    Resolution strategy:
      1. Query SIMBAD for physical parameters (temperatures).
      2. Retry unresolved stars using human-friendly names when available.
      3. Fall back to a colour-based estimate using Gaia BP-RP.
    """
    missing: List[Tuple[int, str]] = []
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

        designation = safe_str(row, "designation")
        query_id = designation or f"Gaia DR3 {sid}"
        missing.append((sid, query_id))

    if not missing:
        return {}

    print(f"[temperature] attempting fallback for {len(missing)} stars with missing Gaia Teff.")
    overrides: Dict[int, float] = {}

    # Pass 1: query SIMBAD using Gaia DR3 designations.
    overrides.update(_resolve_temperatures_from_simbad(missing, batch_size=batch_size))

    # Pass 2: for any still unresolved, try proper names provided by SIMBAD name resolver.
    if name_overrides:
        unresolved_with_names = [
            (sid, name_overrides[sid])
            for sid, _ in missing
            if sid not in overrides and sid in name_overrides
        ]
        if unresolved_with_names:
            overrides.update(
                _resolve_temperatures_from_simbad(unresolved_with_names, batch_size=batch_size)
            )

    # Pass 3: estimate temperatures from Gaia colours.
    unresolved_ids: Set[int] = {sid for sid, _ in missing if sid not in overrides}
    if unresolved_ids:
        overrides.update(_estimate_temperatures_from_color(rows, unresolved_ids))

    return overrides


def _resolve_temperatures_from_simbad(
    entries: Sequence[Tuple[int, str]],
    batch_size: int = 400,
) -> Dict[int, float]:
    """Query SIMBAD for effective temperatures using the provided identifiers."""
    query_ids: List[str] = []
    source_ids: List[int] = []
    seen: Set[Tuple[int, str]] = set()
    for sid, identifier in entries:
        key = (sid, identifier.strip() if identifier else "")
        if not key[1] or key in seen:
            continue
        seen.add(key)
        query_ids.append(key[1])
        source_ids.append(sid)

    if not query_ids:
        return {}

    sim = Simbad()
    try:
        sim.add_votable_fields("mesFe_h")
    except Exception:
        # Fall back to default columns if the table cannot be added (older SIMBAD versions).
        pass
    overrides: Dict[int, float] = {}

    for start in range(0, len(query_ids), batch_size):
        chunk_ids = query_ids[start : start + batch_size]
        chunk_sids = source_ids[start : start + batch_size]
        id_map = {identifier: sid for identifier, sid in zip(chunk_ids, chunk_sids)}
        try:
            table = sim.query_objects(chunk_ids)
        except Exception:
            continue
        if table is None or len(table) == 0:
            continue

        temp_columns = _temperature_column_names(table)
        if not temp_columns:
            continue

        index_column = None
        for candidate in ("SCRIPT_NUMBER_ID", "OBJECT_NUMBER_ID"):
            if candidate in table.colnames:
                index_column = candidate
                break
            lower = candidate.lower()
            if lower in table.colnames:
                index_column = lower
                break

        identifier_column = _choose_table_column(table, ["user_specified_id", "typed_id"])

        for row_index, row in enumerate(table):
            temp = _extract_first_temperature(row, temp_columns)
            if temp is None:
                continue

            sid: Optional[int] = None

            if identifier_column:
                identifier_value = extract_row_value(row, identifier_column)
                if identifier_value is not None:
                    sid = id_map.get(str(identifier_value).strip())

            if sid is None and index_column:
                try:
                    chunk_index = int(row[index_column]) - 1
                except Exception:
                    chunk_index = None
            else:
                chunk_index = row_index

            if sid is None:
                if chunk_index is None or not (0 <= chunk_index < len(chunk_sids)):
                    continue
                sid = chunk_sids[chunk_index]

            overrides.setdefault(sid, temp)

    if overrides:
        print(f"[temperature] SIMBAD provided temperatures for {len(overrides)} stars.")

    return overrides


def _choose_table_column(table: Table, candidates: Sequence[str]) -> Optional[str]:
    """Return the first matching column name from candidates (case-insensitive)."""
    if not table or not table.colnames:
        return None
    existing = set(table.colnames)
    lower_map = {name.lower(): name for name in table.colnames}
    for candidate in candidates:
        if candidate in existing:
            return candidate
    for candidate in candidates:
        lowered = candidate.lower()
        if lowered in lower_map:
            return lower_map[lowered]
    return None


def _temperature_column_names(table: Table) -> List[str]:
    """Return the column names that carry effective temperature values."""
    matches: List[str] = []
    for name in table.colnames:
        column = table[name]
        ucd = str(column.meta.get("ucd", "")).lower()
        if "phys.temperature.effective" in ucd:
            matches.append(name)
            continue
        if "teff" in name.lower():
            matches.append(name)
    return matches


def _extract_first_temperature(row: Row, columns: Sequence[str]) -> Optional[float]:
    """Extract the first numeric temperature from the provided row."""
    for column in columns:
        value = extract_row_value(row, column)
        if value is None:
            continue
        try:
            temp = float(value)
        except (TypeError, ValueError):
            continue
        if math.isfinite(temp) and temp > 0:
            return temp
    return None


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
    Results are clamped to a conservative 2400 K – 15000 K range.
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
    temperature = min(max(temperature, 2400.0), 15000.0)
    return temperature
