"""Bake the Milky Way's artistic contrast curve in linear space."""

import os
from pathlib import Path

os.environ["OPENCV_IO_ENABLE_OPENEXR"] = "1"

import cv2
import numpy as np

directory = Path(__file__).resolve().parent
source = cv2.imread(str(directory / "starmap_2020_4k.exr"), cv2.IMREAD_UNCHANGED)
if source is None:
    raise RuntimeError("Could not read the source EXR")

# Average unresolved stars before the contrast curve so their peaks do not dominate.
wrapped = np.pad(source, ((0, 0), (3, 3), (0, 0)), mode="wrap")
softened = cv2.GaussianBlur(wrapped, (7, 7), sigmaX=0.6, borderType=cv2.BORDER_REFLECT_101)[:, 3:-3]
graded = np.power(softened, 2.2)
destination = directory / "milkyway-graded.exr"
if not cv2.imwrite(
    str(destination),
    graded,
    [
        cv2.IMWRITE_EXR_TYPE, cv2.IMWRITE_EXR_TYPE_FLOAT,
        cv2.IMWRITE_EXR_COMPRESSION, cv2.IMWRITE_EXR_COMPRESSION_ZIP,
    ],
):
    raise RuntimeError("Could not write the graded EXR")

print(f"Baked {destination.name}: {source.shape[1]} × {source.shape[0]}, Gaussian sigma 0.6 px, float32 RGB ** 2.2")
