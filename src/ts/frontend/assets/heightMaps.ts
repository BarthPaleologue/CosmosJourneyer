//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { type Scene } from "@babylonjs/core/scene";

import { err, ok, type Result } from "@/utils/types";

export type HeightMap1x1 = {
    type: "1x1";
    texture: Texture;
};

export type HeightMap2x4<TTexture> = {
    type: "2x4";
    textures: [[TTexture, TTexture, TTexture, TTexture], [TTexture, TTexture, TTexture, TTexture]];
};

export type HeightMap = HeightMap1x1 | HeightMap2x4<Texture>;

export function loadBitmapOnGpu(name: string, input: ImageBitmap, scene: Scene): Texture {
    return new Texture(name, scene, false, false, undefined, undefined, undefined, input);
}

export function loadHeightMap2x4ToGpu(
    name: string,
    input: HeightMap2x4<ImageBitmap>,
    scene: Scene,
): Result<HeightMap2x4<Texture>, unknown> {
    try {
        return ok({
            type: "2x4",
            textures: [
                [
                    loadBitmapOnGpu(`${name}_0_0`, input.textures[0][0], scene),
                    loadBitmapOnGpu(`${name}_0_1`, input.textures[0][1], scene),
                    loadBitmapOnGpu(`${name}_0_2`, input.textures[0][2], scene),
                    loadBitmapOnGpu(`${name}_0_3`, input.textures[0][3], scene),
                ],
                [
                    loadBitmapOnGpu(`${name}_1_0`, input.textures[1][0], scene),
                    loadBitmapOnGpu(`${name}_1_1`, input.textures[1][1], scene),
                    loadBitmapOnGpu(`${name}_1_2`, input.textures[1][2], scene),
                    loadBitmapOnGpu(`${name}_1_3`, input.textures[1][3], scene),
                ],
            ],
        });
    } catch (error) {
        return err(error);
    }
}

export function disposeHeightMap2x4(heightMap: HeightMap2x4<Texture>): void {
    for (const row of heightMap.textures) {
        for (const texture of row) {
            texture.dispose();
        }
    }
}

export function disposeHeightMap1x1(heightMap: HeightMap1x1): void {
    heightMap.texture.dispose();
}
