# GaiaExplorer

GaiaExplorer is a lightweight Python project built with [uv](https://github.com/astral-sh/uv) that queries the ESA Gaia archive and transforms the returned stars into voxel-friendly spatial cubes.

## Features

- Live ADQL queries against Gaia DR3 via [astroquery](https://astroquery.readthedocs.io/) and [Astropy](https://www.astropy.org/).
- Configurable cubic grid resolution and exploration range in light years.
- Automatic bucketing of stars into spatial cubes with deterministic identifiers.
- Normalization of stellar positions inside each cube for easy rendering.
- Dual output format: human-readable JSON and a compact gzip-compressed companion.

## Usage

```bash
uv run gaia-explorer \
  --output-json ./out/gaia_grid.json \
  --cube-ly 5.0 \
  --rmax-ly 50.0
```

### Important arguments

- `--cube-ly`: edge length of each cube in light years.
- `--rmax-ly`: heliocentric radius (in light years) used to fetch stars from Gaia.
- `--range-ly`: optional half-width of the explored cube (defaults to the query radius).
- `--parallax-over-error-min`: minimum Gaia parallax signal-to-noise ratio (defaults to 10).
- `--ruwe-max`: discard stars with RUWE larger than this value (defaults to 1.4).
- `--temperature-min`: optionally drop cool stars below a given effective temperature.
- `--limit`: apply an explicit `LIMIT` to the Gaia query when experimenting.

Outputs are written to `out/` inside this project. The binary output is written next to the JSON file using the same base name with the `.json.gz` suffix unless `--binary-output` is provided.

## Development

This project follows uv's standard layout. Install uv and run `uv run gaia-explorer --help` to see the complete CLI reference. Because the tool queries the Gaia archive directly, make sure the execution environment has Internet access.
