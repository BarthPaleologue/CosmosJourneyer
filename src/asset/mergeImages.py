#  This file is part of Cosmos Journeyer
#
#  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
#
#  This program is free software: you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation, either version 3 of the License, or
#  (at your option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import argparse
from PIL import Image


def combine_images(img1_path, img2_path, channels_img, output_path):
    """
    Combine channels from two images into one.

    Use case: you have an albedo texture using 3 channels, and a roughness texture using 1 channel.
    You want to combine them into a single texture using RGBA mode.
    This function allows you to do that.
    """
    # Open the input images
    img1 = Image.open(img1_path).convert("RGBA")
    img2 = Image.open(img2_path).convert("RGBA")

    # Extract channels from the first image
    r1, g1, b1, a1 = img1.split()

    # Extract channels from the second image
    r2, g2, b2, a2 = img2.split()

    # Create a dictionary to map channel names to actual channel data
    channels_dict = {
        'r1': r1, 'g1': g1, 'b1': b1, 'a1': a1,
        'r2': r2, 'g2': g2, 'b2': b2, 'a2': a2
    }

    # make tuple from channels_img
    channels = tuple([channels_dict[channel] for channel in channels_img])

    # Create a new image with RGBA mode
    new_img = Image.merge("RGBA", channels)

    # Save the combined image
    new_img.save(output_path)
    print(f"Combined image saved to {output_path}")


if __name__ == "__main__":
    """
    Example usage:
    python3 mergeImages.py grassMaterial/wispy-grass-meadow_albedo.png grassMaterial/wispy-grass-meadow_roughness.png r1 g1 b1 r2 grassMaterial/wispy-grass-meadow_albedo_roughness.png
    """
    parser = argparse.ArgumentParser(description="Combine channels from two images into one.")
    parser.add_argument('img1_path', type=str, help="Path to the first image")
    parser.add_argument('img2_path', type=str, help="Path to the second image")
    parser.add_argument('channels_img', type=str, nargs=4, help="How to combine channels (e.g., r1 g1 b1 r2)")
    parser.add_argument('output_path', type=str, help="Path to save the output image")

    args = parser.parse_args()
    combine_images(args.img1_path, args.img2_path, args.channels_img, args.output_path)
