#!/usr/bin/env python3
import rasterio, argparse
import numpy as np
from scipy.ndimage import gaussian_filter, sobel

def process_window(src, dst, window, scale, wrap_mode):
    h = src.read(1, window=window).astype(np.float32)

    # add 1-px halo so Sobel sees neighbours
    pad_mode = 'wrap' if wrap_mode == 'wrap' else 'edge'
    h_pad = np.pad(h, 1, mode=pad_mode)

    sigma_px = 1.0          # tweak 0.5–2.0
    h_pad = gaussian_filter(h_pad, sigma=sigma_px, mode='wrap')
    dzdx = sobel(h_pad, axis=1, mode=wrap_mode)[1:-1, 1:-1]
    dzdy = sobel(h_pad, axis=0, mode='reflect')[1:-1, 1:-1]

    nx = -scale * dzdx
    ny = -scale * dzdy
    nz = np.ones_like(h)

    # ----- robust normalisation -----
    mag = np.sqrt(nx*nx + ny*ny + nz*nz)
    mag[mag == 0] = 1.0
    nx, ny, nz = nx/mag, ny/mag, nz/mag
    # --------------------------------

    rgb = (0.5 * (np.stack((nx, ny, nz), -1) + 1.0) * 255).astype(np.uint8)
    dst.write(rgb.transpose(2, 0, 1), window=window)


def main(inp, outp, scale, wrap):
    with rasterio.open(inp) as src:
        profile = src.profile
        profile.update(count=3, dtype='uint8', compress='lzw', tiled=True)
        with rasterio.open(outp, 'w', **profile) as dst:
            for ji, window in src.block_windows():         # iterate GDAL blocks
                process_window(src, dst, window, scale, wrap)

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("-i","--in",required=True); ap.add_argument("-o","--out",required=True)
    ap.add_argument("-s","--scale",type=float,default=1.0)
    ap.add_argument("--wrap",choices=("wrap","nearest"),default="wrap")
    args = ap.parse_args(); main(args.__dict__['in'], args.__dict__['out'], args.scale, args.wrap)

