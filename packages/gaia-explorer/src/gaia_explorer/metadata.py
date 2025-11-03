"""Metadata structures shared across SIMBAD helpers."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(slots=True)
class SimbadMetadata:
    """Captured SIMBAD metadata for a Gaia source."""

    name: str
    spectral_type: Optional[str]
    object_type: Optional[str]
    effective_temperature: Optional[float]
