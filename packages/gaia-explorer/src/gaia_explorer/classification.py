"""Classify stellar nature from SIMBAD metadata."""
from __future__ import annotations

from typing import Optional

from .metadata import SimbadMetadata


def classify_star(metadata: Optional[SimbadMetadata], temperature: Optional[float]) -> str:
    """
    Return a coarse stellar nature for export.

    Categories: main-sequence, white-dwarf, neutron-star, black-hole.
    """
    if metadata is None:
        return "main-sequence"

    otype = (metadata.object_type or "").upper()
    sptype = (metadata.spectral_type or "").upper()

    if _is_white_dwarf(otype, sptype):
        return "white-dwarf"
    if _is_neutron_star(otype, sptype):
        return "neutron-star"
    if _is_black_hole(otype):
        return "black-hole"

    return "main-sequence"


def _is_white_dwarf(otype: str, sptype: str) -> bool:
    if "WD" in otype:
        return True
    if sptype.startswith("D"):
        return True
    return False


def _is_neutron_star(otype: str, sptype: str) -> bool:
    if "NS" in otype or "XNS" in otype:
        return True
    if "PSR" in otype:
        return True
    if sptype.startswith("NS"):
        return True
    return False


def _is_black_hole(otype: str) -> bool:
    if "BH" in otype:
        return True
    if "XRB" in otype or "XB?" in otype:
        return True
    return False
