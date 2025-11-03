"""Spatial binning utilities for Gaia Explorer data."""
from __future__ import annotations

from typing import Dict, List

from .config import GridConfig
from .records import StarRecord


def clamp(value: float, lower: float = 0.0, upper: float = 1.0) -> float:
    """Clamp *value* into the [`lower`, `upper`] range."""
    return max(lower, min(upper, value))


class SpatialBinner:
    """Groups stars into spatial cubes."""

    def __init__(self, config: GridConfig) -> None:
        self._config = config
        self._cubes: Dict[str, Dict[str, object]] = {}

    @property
    def cubes(self) -> Dict[str, Dict[str, object]]:
        return self._cubes

    def add_star(self, star: StarRecord) -> bool:
        if not all(
            self._config.contains(coord) for coord in (star.x, star.y, star.z)
        ):
            return False

        ix = self._config.cube_index_for(star.x)
        iy = self._config.cube_index_for(star.y)
        iz = self._config.cube_index_for(star.z)
        cube_id = f"{ix}:{iy}:{iz}"

        origin_x = self._config.cube_origin(ix)
        origin_y = self._config.cube_origin(iy)
        origin_z = self._config.cube_origin(iz)

        norm_x = clamp((star.x - origin_x) / self._config.grid_size)
        norm_y = clamp((star.y - origin_y) / self._config.grid_size)
        norm_z = clamp((star.z - origin_z) / self._config.grid_size)

        cube = self._cubes.setdefault(
            cube_id,
            {
                "index": [ix, iy, iz],
                "origin": [origin_x, origin_y, origin_z],
                "stars": [],
            },
        )

        cube_stars: List[Dict[str, object]] = cube["stars"]  # type: ignore[assignment]
        cube_stars.append(
            {
                "name": star.name,
                "relative_position": [norm_x, norm_y, norm_z],
                "temperature": star.temperature,
                "nature": star.nature,
            }
        )
        return True
