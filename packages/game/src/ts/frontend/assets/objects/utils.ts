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

import type { AssetContainer } from "@babylonjs/core/assetContainer";
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading";
import type { Scene } from "@babylonjs/core/scene";

import type { ILoadingProgressMonitor } from "../loadingProgressMonitor";

/**
 * Imports a model into a scene-owned asset container and completes its load task.
 * @param name Label used for the container's loading task.
 * @param url URL of the model to import.
 * @param scene Scene that receives the imported model resources.
 * @param progressMonitor Tracks completion of this model-loading task.
 * @returns The imported model resources, kept together in an asset container.
 */
export async function loadAssetInContainerAsync(
    name: string,
    url: string,
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor,
): Promise<AssetContainer> {
    progressMonitor.startTask();
    const container = await LoadAssetContainerAsync(url, scene);
    progressMonitor.completeTask();
    return container;
}
