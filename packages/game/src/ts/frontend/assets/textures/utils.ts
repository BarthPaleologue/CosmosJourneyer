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

import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import type { Scene } from "@babylonjs/core/scene";

import type { ILoadingProgressMonitor } from "../loadingProgressMonitor";

/**
 * Loads a 2D texture and completes its loading task.
 * @param name Name assigned to the texture.
 * @param url URL of the image to load.
 * @param engine Engine that creates the texture resource.
 * @param progressMonitor Tracks completion of this texture-loading task.
 * @returns A texture that resolves after the image loads.
 */
export async function loadTextureAsync(
    name: string,
    url: string,
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor,
): Promise<Texture> {
    progressMonitor.startTask();
    const texture = await new Promise<Texture>((resolve) => {
        const createdTexture = new Texture(url, engine, false, false, undefined, () => {
            resolve(createdTexture);
        });
        createdTexture.name = name;
    });

    progressMonitor.completeTask();
    return texture;
}

/**
 * Loads a cube texture and completes its loading task.
 * @param name Name assigned to the cube texture.
 * @param url Base URL used to load the cube-map faces.
 * @param scene Scene that owns the cube texture.
 * @param progressMonitor Tracks completion of this texture-loading task.
 * @returns The loaded prefiltered cube texture.
 */
export async function loadCubeTextureAsync(
    name: string,
    url: string,
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor,
): Promise<CubeTexture> {
    progressMonitor.startTask();
    const texture = await new Promise<CubeTexture>((resolve) => {
        const createdTexture = CubeTexture.CreateFromPrefilteredData(url, scene);
        createdTexture.onLoadObservable.add(() => {
            resolve(createdTexture);
        });
        createdTexture.name = name;
    });

    progressMonitor.completeTask();
    return texture;
}
