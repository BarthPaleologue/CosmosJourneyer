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

import { AudioAssets, loadAudioAssets } from "./audioAssets";
import { loadRenderingAssets, RenderingAssets } from "./renderingAssets";

export type Assets = {
    readonly audio: Readonly<AudioAssets>;
    readonly rendering: Readonly<RenderingAssets>;
};

export async function loadAssets(
    progressCallback: (loadedCount: number, totalCount: number, lastItemName: string) => void,
    scene: Scene
): Promise<Assets> {
    const audioAssetsPromise = loadAudioAssets(progressCallback);
    const renderingAssetsPromise = loadRenderingAssets(progressCallback, scene);

    return {
        audio: await audioAssetsPromise,
        rendering: await renderingAssetsPromise
    };
}
