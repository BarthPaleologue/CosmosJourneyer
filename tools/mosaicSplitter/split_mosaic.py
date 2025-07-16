#!/usr/bin/env python3
"""
split_mosaic.py  –  cut a huge raster (height-map, normal, albedo …) into
                    an M×N tile grid **without ever loading the full image
                    into RAM**.

Example (2 × 4 grid → 8 tiles):

    python split_mosaic.py \
           -i moon_normal.tif \
           -o tiles/out_{row}{col}.tif \
           --cols 2 --rows 4
"""

from pathlib import Path
import argparse

import numpy as np
import rasterio
from rasterio.windows import Window

# ──────────────────────────────────────────────────────────────────────────────
def split_to_mosaic(src_path: Path, pattern: str, n_cols: int, n_rows: int):
    """Write tiles to `pattern.format(row=R,col=C)` using 1-based indices."""
    with rasterio.open(src_path) as src:
        W, H = src.width, src.height
        tile_w = W // n_cols
        tile_h = H // n_rows

        for r in range(n_rows):
            for c in range(n_cols):
                # pixel offsets for this tile (clip the last row/col in case W,H
                # aren’t an exact multiple – keeps every pixel of the source)
                col_off = c * tile_w
                row_off = r * tile_h
                w = tile_w if c < n_cols - 1 else W - col_off
                h = tile_h if r < n_rows - 1 else H - row_off

                window = Window(col_off, row_off, w, h)
                transform = src.window_transform(window)

                # read just this window (all bands)  → RAM ≈ w × h × bands
                data = src.read(window=window)

                # prepare per-tile metadata
                profile = src.profile
                profile.update({
                    "width": w,
                    "height": h,
                    "transform": transform,
                    # keep compression, tiling & dtype from original
                })

                out_path = Path(pattern.format(row=r + 1, col=c + 1))
                out_path.parent.mkdir(parents=True, exist_ok=True)

                with rasterio.open(out_path, "w", **profile) as dst:
                    dst.write(data)

                print(f"wrote {out_path} [{w}×{h}]")

# ──────────────────────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser(description="Split a raster into an M×N mosaic")
    ap.add_argument("-i", "--in", required=True, type=Path, help="input raster")
    ap.add_argument("-o", "--out",
                    required=True,
                    help=('output pattern, e.g. "tiles/tile_{row}{col}.tif" '
                          "(rows/cols are 1-based placeholders)"))
    ap.add_argument("--cols", type=int, default=2, help="tiles in X (default 2)")
    ap.add_argument("--rows", type=int, default=4, help="tiles in Y (default 4)")
    args = ap.parse_args()

    split_to_mosaic(args.__dict__["in"], args.out, args.cols, args.rows)

if __name__ == "__main__":
    main()
