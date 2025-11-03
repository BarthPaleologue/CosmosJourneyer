"""Command line interface for GaiaExplorer using the live Gaia archive."""
from __future__ import annotations

import argparse
from pathlib import Path
from typing import Optional, Sequence

from .config import GridConfig, QueryConfig
from .naming import resolve_simbad_names
from .output import build_output, dump_outputs
from .query import query_gaia
from .records import iter_star_records
from .temperatures import resolve_temperature_overrides
from .spatial import SpatialBinner


def parse_arguments(argv: Optional[Sequence[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Query the Gaia archive and voxelize the returned stars."
    )
    parser.add_argument(
        "--output-json",
        required=True,
        help="Path for the JSON summary output.",
    )
    parser.add_argument(
        "--binary-output",
        help="Optional path for the gzip-compressed JSON stored alongside the JSON output.",
    )
    parser.add_argument(
        "--cube-ly",
        type=float,
        required=True,
        help="Edge length of each spatial cube in light years.",
    )
    parser.add_argument(
        "--rmax-ly",
        type=float,
        required=True,
        help="Heliocentric radius for the Gaia query in light years.",
    )
    parser.add_argument(
        "--range-ly",
        type=float,
        help="Half-extent of the explored volume in light years. Defaults to --rmax-ly.",
    )
    parser.add_argument(
        "--parallax-over-error-min",
        type=float,
        default=10.0,
        help="Minimum parallax signal-to-noise ratio (Gaia parallax_over_error).",
    )
    parser.add_argument(
        "--ruwe-max",
        type=float,
        default=10.0,  # relaxed to include bright multiples like Alpha Centauri
        help="Maximum RUWE used to filter out problematic astrometric solutions.",
    )
    parser.add_argument(
        "--temperature-min",
        type=float,
        help="Discard stars cooler than this effective temperature in Kelvin.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        help="Optional maximum number of rows to request from Gaia.",
    )
    return parser.parse_args(argv)


def resolve_output_paths(
    output_json: str, binary_output: Optional[str]
) -> tuple[Path, Path]:
    """Return filesystem paths for JSON and binary outputs, respecting user inputs."""
    json_path = Path(output_json).expanduser()
    if not json_path.is_absolute():
        json_path = Path.cwd() / json_path

    if binary_output:
        binary_path = Path(binary_output).expanduser()
        if not binary_path.is_absolute():
            binary_path = Path.cwd() / binary_path
    else:
        binary_path = json_path.with_suffix(json_path.suffix + ".gz")

    return json_path, binary_path


def main(argv: Optional[Sequence[str]] = None) -> None:
    args = parse_arguments(argv)

    json_path, binary_path = resolve_output_paths(
        args.output_json, args.binary_output
    )

    grid = GridConfig(
        grid_size=args.cube_ly,
        half_extent=args.range_ly if args.range_ly is not None else args.rmax_ly,
    )
    query = QueryConfig(
        radius_ly=args.rmax_ly,
        parallax_over_error_min=args.parallax_over_error_min,
        ruwe_max=args.ruwe_max,
        temperature_min=args.temperature_min,
        limit=args.limit,
    )

    rows = query_gaia(query)

    # Resolve human-readable names once
    name_map = resolve_simbad_names(rows)
    temperature_overrides = resolve_temperature_overrides(
        rows, name_overrides=name_map
    )

    binner = SpatialBinner(grid)
    retained = 0
    for star in iter_star_records(
        rows,
        name_overrides=name_map,
        temperature_overrides=temperature_overrides,
    ):
        if binner.add_star(star):
            retained += 1

    payload = build_output(binner.cubes, grid, query, len(rows), retained)
    json_path.parent.mkdir(parents=True, exist_ok=True)
    binary_path.parent.mkdir(parents=True, exist_ok=True)
    dump_outputs(payload, json_path, binary_path)


if __name__ == "__main__":  # pragma: no cover - CLI entry point
    main()
