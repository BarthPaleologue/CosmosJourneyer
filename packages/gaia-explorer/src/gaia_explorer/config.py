"""Configuration dataclasses for Gaia Explorer queries."""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Optional

LIGHT_YEAR_PER_PARSEC = 3.26156


@dataclass(slots=True)
class QueryConfig:
    """Parameters controlling the Gaia query."""

    radius_ly: float
    parallax_over_error_min: float
    ruwe_max: float
    temperature_min: Optional[float]
    limit: Optional[int]

    @property
    def parallax_min_mas(self) -> float:
        """Minimum parallax (mas) that corresponds to the search radius."""
        radius_pc = self.radius_ly / LIGHT_YEAR_PER_PARSEC
        return 1000.0 / radius_pc


@dataclass(slots=True)
class GridConfig:
    """Parameters describing the spatial grid."""

    grid_size: float
    half_extent: float

    def cube_index_for(self, coord: float) -> int:
        return math.floor(coord / self.grid_size)

    def cube_origin(self, index: int) -> float:
        return index * self.grid_size

    def contains(self, coord: float) -> bool:
        return -self.half_extent <= coord <= self.half_extent
