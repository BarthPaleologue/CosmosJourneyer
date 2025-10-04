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

import { type Scene } from "@babylonjs/core/scene";

import { loadAudioAssets, type AudioAssets } from "./audio";
import { type ILoadingProgressMonitor } from "./loadingProgressMonitor";
import { loadRenderingAssets, type RenderingAssets } from "./renderingAssets";

export type Assets = {
    readonly audio: Readonly<AudioAssets>;
    readonly rendering: Readonly<RenderingAssets>;
};

export async function loadAssets(scene: Scene, progressMonitor: ILoadingProgressMonitor | null): Promise<Assets> {
    const audioAssetsPromise = loadAudioAssets(progressMonitor);
    const renderingAssetsPromise = loadRenderingAssets(scene, progressMonitor);

    return {
        audio: await audioAssetsPromise,
        rendering: await renderingAssetsPromise,
    };
}
