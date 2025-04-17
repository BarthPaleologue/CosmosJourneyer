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

import { AssetsManager } from "@babylonjs/core/Misc/assetsManager";
import { Scene } from "@babylonjs/core/scene";
import { loadTextures, Textures } from "./textures";
import { loadSounds, Sounds } from "./sounds";
import { Materials } from "./materials";
import { Objects } from "./objects";
import { loadMusics, Musics } from "./musics";
import { loadVoiceLines, SpeakerVoiceLines } from "./voiceLines";

export type Assets2 = {
    readonly sounds: Sounds;
    readonly musics: Musics;
    readonly speakerVoiceLines: SpeakerVoiceLines;
    readonly textures: Textures;
};

export async function loadAssets(
    progressCallback: (loadedCount: number, totalCount: number, lastItemName: string) => void,
    scene: Scene
): Promise<Assets2> {
    let allAssetsTotalCount = 0;
    const increaseTotalCount = (nbItems: number) => {
        allAssetsTotalCount += nbItems;
    };

    const progressCallbackWrapped = (loadedCount: number, totalCount: number, lastItemName: string) => {
        progressCallback(loadedCount, allAssetsTotalCount, lastItemName);
    };

    const soundsPromise = loadSounds(progressCallbackWrapped, increaseTotalCount);
    const musicsPromise = loadMusics(progressCallbackWrapped, increaseTotalCount);
    const voiceLinesPromise = loadVoiceLines(progressCallbackWrapped, increaseTotalCount);
    const texturesPromise = loadTextures(progressCallbackWrapped, increaseTotalCount, scene);

    return {
        sounds: await soundsPromise,
        musics: await musicsPromise,
        speakerVoiceLines: await voiceLinesPromise,
        textures: await texturesPromise
    };
}

export class Assets {
    static IS_READY = false;

    private static MANAGER: AssetsManager;

    static async Init(textures: Textures, scene: Scene): Promise<void> {
        Assets.MANAGER = new AssetsManager(scene);
        Assets.MANAGER.autoHideLoadingUI = false;
        console.log("Initializing assets...");

        Objects.EnqueueTasks(Assets.MANAGER, scene);

        Assets.MANAGER.onFinish = () => {
            Materials.Init(textures, scene);

            Objects.BUTTERFLY.material = Materials.BUTTERFLY_MATERIAL;
            Objects.GRASS_BLADES.forEach((grassBlade) => (grassBlade.material = Materials.GRASS_MATERIAL));
            Objects.CRATE.material = Materials.CRATE_MATERIAL;

            console.log("Assets loaded");
            Assets.IS_READY = true;
        };

        await Assets.MANAGER.loadAsync();
    }
}
