"""Helpers for building and persisting Gaia Explorer output payloads."""
from __future__ import annotations

import gzip
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict

from .config import GridConfig, QueryConfig


def build_output(
    cubes: Dict[str, Dict[str, object]],
    grid: GridConfig,
    query: QueryConfig,
    retrieved: int,
    retained: int,
) -> Dict[str, object]:
    metadata = {
        "cube_edge_ly": grid.grid_size,
        "range_half_extent_ly": grid.half_extent,
        "query_radius_ly": query.radius_ly,
        "retrieved_rows": retrieved,
        "retained_stars": retained,
        "cubes_nonempty": len(cubes),
        "generated_utc": datetime.now(timezone.utc).isoformat(),
    }

    selection = {
        "parallax_min_mas": query.parallax_min_mas,
        "parallax_over_error_min": query.parallax_over_error_min,
        "ruwe_max": query.ruwe_max,
    }
    if query.temperature_min is not None:
        selection["temperature_min_K"] = query.temperature_min
    if query.limit is not None:
        selection["row_limit"] = query.limit

    return {
        "metadata": metadata,
        "selection": selection,
        "cubes": cubes,
    }


def dump_outputs(payload: Dict[str, object], json_path: Path, binary_path: Path) -> None:
    json_text = json.dumps(payload, separators=(",", ":"), ensure_ascii=False)
    json_path.write_text(json_text, encoding="utf-8")

    with gzip.open(binary_path, "wb") as handle:
        handle.write(json_text.encode("utf-8"))
