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

import type { Texture } from "@babylonjs/core/Materials/Textures/texture";
import type { Scene } from "@babylonjs/core/scene";

import { err, ok, type Result } from "@/utils/types";

import type { ILoadingProgressMonitor } from "../../loadingProgressMonitor";
import { loadTextureAsync } from "../utils";

export type HeightMap1x1 = {
    type: "1x1";
    texture: Texture;
};

export type HeightMap2x4 = {
    type: "2x4";
    textures: [[Texture, Texture, Texture, Texture], [Texture, Texture, Texture, Texture]];
};

export type HeightMap = HeightMap1x1 | HeightMap2x4;

export async function loadHeightMap2x4FromUrlsToGpu(
    name: string,
    urls: [[string, string, string, string], [string, string, string, string]],
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Result<HeightMap2x4, Array<Error>>> {
    const loadingPromises: Array<Promise<Texture>> = [];
    for (const [i, row] of urls.entries()) {
        for (const [j, url] of row.entries()) {
            loadingPromises.push(loadTextureAsync(`${name}_${i}_${j}`, url, scene, progressMonitor));
        }
    }

    const textures = await Promise.all(loadingPromises);

    const texture00 = textures[0];
    const texture01 = textures[1];
    const texture02 = textures[2];
    const texture03 = textures[3];
    const texture10 = textures[4];
    const texture11 = textures[5];
    const texture12 = textures[6];
    const texture13 = textures[7];
    if (
        texture00 === undefined ||
        texture01 === undefined ||
        texture02 === undefined ||
        texture03 === undefined ||
        texture10 === undefined ||
        texture11 === undefined ||
        texture12 === undefined ||
        texture13 === undefined
    ) {
        for (const texture of textures) {
            texture.dispose();
        }
        return err([new Error("One or more textures failed to load.")]);
    }

    return ok({
        type: "2x4",
        textures: [
            [texture00, texture01, texture02, texture03],
            [texture10, texture11, texture12, texture13],
        ],
    });
}

export function disposeHeightMap2x4(heightMap: HeightMap2x4): void {
    for (const row of heightMap.textures) {
        for (const texture of row) {
            texture.dispose();
        }
    }
}

export function disposeHeightMap1x1(heightMap: HeightMap1x1): void {
    heightMap.texture.dispose();
}
