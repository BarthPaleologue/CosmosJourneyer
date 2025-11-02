"""Resolve human-readable star names using SIMBAD."""
from __future__ import annotations

import re
from typing import Dict, List, Optional, Sequence, Tuple

from astroquery.simbad import Simbad
from astropy.table import Table

from .records import extract_row_value, safe_str

# Three-letter Greek -> full name
_GREEK_3_TO_FULL = {
    "alf": "Alpha", "bet": "Beta", "gam": "Gamma", "del": "Delta", "eps": "Epsilon",
    "zet": "Zeta", "eta": "Eta", "the": "Theta", "iot": "Iota", "kap": "Kappa",
    "lam": "Lambda", "mu": "Mu", "nu": "Nu", "xi": "Xi", "omi": "Omicron",
    "pi": "Pi", "rho": "Rho", "sig": "Sigma", "tau": "Tau", "ups": "Upsilon",
    "phi": "Phi", "chi": "Chi", "psi": "Psi", "ome": "Omega",
}

# IAU 3-letter constellation abbreviations -> Latin genitive
_CONST_GENITIVE = {
    "And": "Andromedae", "Ant": "Antliae", "Aps": "Apodis", "Aql": "Aquilae",
    "Aqr": "Aquarii", "Ara": "Arae", "Ari": "Arietis", "Aur": "Aurigae",
    "Boo": "Bootis", "CMa": "Canis Majoris", "CMi": "Canis Minoris",
    "CVn": "Canum Venaticorum", "Cae": "Caeli", "Cam": "Camelopardalis",
    "Cap": "Capricorni", "Car": "Carinae", "Cas": "Cassiopeiae", "Cen": "Centauri",
    "Cep": "Cephei", "Cet": "Ceti", "Cha": "Chamaeleontis", "Cir": "Circini",
    "Col": "Columbae", "Com": "Comae Berenices", "CrA": "Coronae Australis",
    "CrB": "Coronae Borealis", "Crt": "Crateris", "Cru": "Crucis", "Crv": "Corvi",
    "Cyg": "Cygni", "Del": "Delphini", "Dor": "Doradus", "Dra": "Draconis",
    "Equ": "Equulei", "Eri": "Eridani", "For": "Fornacis", "Gem": "Geminorum",
    "Gru": "Gruis", "Her": "Herculis", "Hor": "Horologii", "Hya": "Hydrae",
    "Hyi": "Hydri", "Ind": "Indi", "Lac": "Lacertae", "Leo": "Leonis",
    "LMi": "Leonis Minoris", "Lep": "Leporis", "Lib": "Librae",
    "Lup": "Lupi", "Lyn": "Lyncis", "Lyr": "Lyrae", "Men": "Mensae",
    "Mic": "Microscopii", "Mon": "Monocerotis", "Mus": "Muscae",
    "Nor": "Normae", "Oct": "Octantis", "Oph": "Ophiuchi", "Ori": "Orionis",
    "Pav": "Pavonis", "Peg": "Pegasi", "Per": "Persei", "Phe": "Phoenicis",
    "Pic": "Pictoris", "PsA": "Piscis Austrini", "Psc": "Piscium", "Pup": "Puppis",
    "Pyx": "Pyxidis", "Ret": "Reticuli", "Scl": "Sculptoris", "Sco": "Scorpii",
    "Sct": "Scuti", "Ser": "Serpentis", "Sex": "Sextantis", "Sge": "Sagittae",
    "Sgr": "Sagittarii", "Tau": "Tauri", "Tel": "Telescopii", "TrA": "Trianguli Australis",
    "Tri": "Trianguli", "Tuc": "Tucanae", "UMa": "Ursae Majoris", "UMi": "Ursae Minoris",
    "Vel": "Velorum", "Vir": "Virginis", "Vol": "Volantis", "Vul": "Vulpeculae",
    "Cnc": "Cancri",
}

# Strip classification prefixes like "* alf CMa" or "V* bet Ori" and collapse spaces
_BAD_PREFIX = re.compile(r"^(?:\*|V\*|\*\*|Cl\*)\s*")


def _clean_spaces(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


# Known proper names we prefer over Bayer for everyday readability
_WELL_KNOWN_PROPER = {
    "Sirius", "Canopus", "Arcturus", "Vega", "Capella", "Rigel", "Procyon",
    "Betelgeuse", "Aldebaran", "Altair", "Spica", "Antares", "Pollux", "Fomalhaut",
    "Deneb", "Regulus", "Castor", "Achernar", "Hadar", "Mimosa", "Bellatrix",
    "Elnath", "Alnitak", "Alnilam", "Mintaka", "Proxima Centauri", "Barnard's Star",
    # Prefer full Bayer for these nearby targets
    "Alpha Centauri", "Tau Ceti", "Epsilon Indi",
}

# Catalog ranking, higher is better (after proper name and Bayer/Flamsteed)
_CATALOG_RANKS = [
    (re.compile(r"^\s*GJ\s*\d+\w*$", re.I), 88, lambda s: re.sub(r"\s+", " ", s.upper().replace("GLIESE", "GJ").replace("GL", "GJ"))),
    (re.compile(r"^\s*GLIESE\s*\d+\w*$", re.I), 88, lambda s: re.sub(r"\s+", " ", "GJ " + re.sub(r"(?i)gliese\s*", "", s))),
    (re.compile(r"^\s*HR\s*\d+\s*$", re.I), 84, None),
    (re.compile(r"^\s*HD\s*\d+\s*$", re.I), 82, None),
    (re.compile(r"^\s*HIP\s*\d+\s*$", re.I), 80, None),
    (re.compile(r"^\s*(BD|CD|CPD)\s*[+-]?\s*\d+\s*\d+\s*$", re.I), 70, None),
    (re.compile(r"^\s*(LHS|LP|LTT|L|Wolf|Ross|G)\s+[-\d ]+\w*$", re.I), 68, None),
    (re.compile(r"^\s*TYC\s*\d+-\d+-\d+\s*$", re.I), 60, None),
    (re.compile(r"^\s*2MASS\s+", re.I), 30, None),
]

_BAYER_TOKEN = re.compile(r"^([A-Za-z]{3})(\d{0,2})$")


def _expand_bayer_flamsteed(text: str) -> Optional[str]:
    """
    Expand SIMBAD-style abbreviations like:
      'alf Cen' -> 'Alpha Centauri'
      'tau Cet' -> 'Tau Ceti'
      '61 Cyg'  -> '61 Cygni'
      'alf1 Cen A' -> 'Alpha1 Centauri A'
    Returns None if pattern not recognized.
    """
    s = _clean_spaces(_BAD_PREFIX.sub("", text))
    parts = s.split()
    if len(parts) < 2:
        return None

    first, const = parts[0], parts[1]
    comp = " ".join(parts[2:]) if len(parts) > 2 else ""

    # Flamsteed number?
    if first.isdigit() and const in _CONST_GENITIVE:
        name = f"{first} {_CONST_GENITIVE[const]}"
        return f"{name} {comp}".strip()

    # Bayer: three-letter greek + optional superscript digits
    m = _BAYER_TOKEN.fullmatch(first)
    if m and const in _CONST_GENITIVE:
        greek3 = m.group(1).lower()
        sup = m.group(2)
        greek_full = _GREEK_3_TO_FULL.get(greek3)
        if greek_full:
            name = f"{greek_full}{sup} {_CONST_GENITIVE[const]}"
            return f"{name} {comp}".strip()

    return None


def _choose_col(tbl: Table, candidates: Sequence[str]) -> Optional[str]:
    """Pick the first existing column, case-insensitive."""
    if not tbl.colnames:
        return None
    name_set = set(tbl.colnames)
    lower_map = {c.lower(): c for c in tbl.colnames}
    for c in candidates:
        if c in name_set:
            return c
    for c in candidates:
        lc = c.lower()
        if lc in lower_map:
            return lower_map[lc]
    return None


def _score_identifier(raw: str) -> Tuple[int, str]:
    """
    Assign a score and normalized label to an identifier. Higher is better.
    Proper names and Bayer/Flamsteed outrank catalogs. Removes bad prefixes.
    """
    s = _clean_spaces(_BAD_PREFIX.sub("", raw))
    if not s:
        return (0, "")

    # Prefer well-known proper names found as aliases
    if s in _WELL_KNOWN_PROPER:
        return (120, s)

    # Bayer/Flamsteed expansion
    expanded = _expand_bayer_flamsteed(s)
    if expanded:
        return (110, expanded)

    # Catalogs by preference
    for rx, score, norm in _CATALOG_RANKS:
        if rx.match(s):
            return (score, _clean_spaces(norm(s) if norm else s))

    # Fallback to whatever is left, but low score
    return (40, s)


def _pick_best_name(main_id: Optional[str], ids_field: Optional[object], fallback_query_id: str) -> str:
    """
    Build a candidate pool from MAIN_ID + IDS list, then choose highest score.
    Prefer proper names and full Bayer/Flamsteed expansions.
    """
    candidates: List[str] = []

    if main_id:
        candidates.append(main_id.strip())

    if ids_field is not None:
        try:
            for ident in str(ids_field).split("|"):
                ident = ident.strip()
                if not ident:
                    continue
                if ident.startswith("NAME "):
                    candidates.append(ident[5:].strip())
                else:
                    candidates.append(ident)
        except Exception:
            pass

    candidates.append(fallback_query_id)

    best_score = -1
    best_label = fallback_query_id
    for c in candidates:
        score, label = _score_identifier(c)
        if label and score > best_score:
            best_score, best_label = score, label
    return best_label


def resolve_simbad_names(rows: Table, batch_size: int = 400) -> Dict[int, str]:
    """
    Resolve human-readable names by querying SIMBAD **by identifier**.
    Uses row['designation'] ('Gaia DR3 <source_id>'); if missing, builds it.
    Returns {source_id: resolved_name}.
    """
    query_ids: List[str] = []
    sids: List[int] = []
    for r in rows:
        sid = extract_row_value(r, "source_id")
        if sid is None:
            continue
        sid = int(sid)
        desig = safe_str(r, "designation")
        if not desig:
            desig = f"Gaia DR3 {sid}"
        query_ids.append(desig)
        sids.append(sid)

    if not query_ids:
        return {}

    sim = Simbad()
    sim.add_votable_fields("ids")  # MAIN_ID typically included by default

    result: Dict[int, str] = {}
    for start in range(0, len(query_ids), batch_size):
        sub_ids = query_ids[start : start + batch_size]
        sub_sids = sids[start : start + batch_size]
        try:
            tbl = sim.query_objects(sub_ids)
        except Exception:
            continue
        if tbl is None or len(tbl) == 0:
            continue

        idx_col = _choose_col(tbl, ["SCRIPT_NUMBER_ID", "OBJECT_NUMBER_ID"])
        main_col = _choose_col(tbl, ["MAIN_ID", "Main_id", "main_id"])
        ids_col = _choose_col(tbl, ["IDS", "ids"])

        if idx_col:
            for row in tbl:
                try:
                    idx = int(row[idx_col]) - 1  # SIMBAD uses 1-based indexing
                    sid = sub_sids[idx]
                    main_id = str(row[main_col]).strip() if main_col else None
                    ids_field = row[ids_col] if ids_col else None
                    name = _pick_best_name(main_id, ids_field, sub_ids[idx])
                    result[sid] = name
                except Exception:
                    continue
        else:
            for i, row in enumerate(tbl):
                if i >= len(sub_sids):
                    break
                sid = sub_sids[i]
                main_id = str(row[main_col]).strip() if main_col else None
                ids_field = row[ids_col] if ids_col else None
                name = _pick_best_name(main_id, ids_field, sub_ids[i])
                result[sid] = name

    print(f"[name-resolve] SIMBAD resolved {len(result)} of {len(sids)} objects.")
    return result
