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

import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { type Scene } from "@babylonjs/core/scene";

import { type ILoadingProgressMonitor } from "../loadingProgressMonitor";

export async function loadTextureAsync(
    name: string,
    url: string,
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Texture> {
    progressMonitor?.startTask();
    const texture = await new Promise<Texture>((resolve) => {
        const texture = new Texture(url, scene, false, false, undefined, () => {
            resolve(texture);
        });
        texture.name = name;
    });

    progressMonitor?.completeTask();
    return texture;
}

export async function loadCubeTextureAsync(
    name: string,
    url: string,
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<CubeTexture> {
    progressMonitor?.startTask();
    const texture = await new Promise<CubeTexture>((resolve) => {
        const texture = CubeTexture.CreateFromPrefilteredData(url, scene);
        texture.onLoadObservable.add(() => {
            resolve(texture);
        });
        texture.name = name;
    });

    progressMonitor?.completeTask();
    return texture;
}
