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

import { Scene } from "@babylonjs/core/scene";

import { initMaterials, Materials } from "./materials";
import { loadObjects, Objects } from "./objects";
import { loadTextures, Textures } from "./textures";

export type RenderingAssets = {
    readonly textures: Textures;
    readonly materials: Materials;
    readonly objects: Objects;
};

export async function loadRenderingAssets(
    progressCallback: (loadedCount: number, totalCount: number, lastItemName: string) => void,
    scene: Scene
): Promise<RenderingAssets> {
    const texturesPromise = loadTextures(progressCallback, scene);

    const textures = await texturesPromise;

    const materials = initMaterials(textures, scene);

    const objectsPromise = loadObjects(materials, scene, progressCallback);

    return {
        textures: textures,
        materials: materials,
        objects: await objectsPromise
    };
}
