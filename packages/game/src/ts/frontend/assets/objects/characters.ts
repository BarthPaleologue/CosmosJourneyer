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

import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { type Scene } from "@babylonjs/core/scene";

import { type ILoadingProgressMonitor } from "../loadingProgressMonitor";
import { loadAssetInContainerAsync } from "./utils";

import characterPath from "@assets/character/character.glb";

export type Characters = {
    default: Mesh;
};

export async function loadCharacters(
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Characters> {
    const characterContainer = await loadAssetInContainerAsync("Character", characterPath, scene, progressMonitor);
    const character = characterContainer.rootNodes[0];
    if (!(character instanceof Mesh)) {
        throw new Error("Character root node is not a Mesh");
    }
    character.isVisible = false;
    for (const mesh of character.getChildMeshes()) {
        mesh.isVisible = false;
    }

    characterContainer.addAllToScene();

    return {
        default: character,
    };
}
