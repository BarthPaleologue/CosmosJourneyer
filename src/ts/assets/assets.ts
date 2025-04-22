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
import { loadTextures, Textures } from "./textures";
import { loadSounds, Sounds } from "./sounds";
import { initMaterials, Materials } from "./materials";
import { loadObjects, Objects } from "./objects";
import { loadMusics, Musics } from "./musics";
import { loadVoiceLines, SpeakerVoiceLines } from "./voiceLines";

export type Assets = {
    readonly sounds: Sounds;
    readonly musics: Musics;
    readonly speakerVoiceLines: SpeakerVoiceLines;
    readonly textures: Textures;
    readonly materials: Materials;
    readonly objects: Objects;
};

export async function loadAssets(
    progressCallback: (loadedCount: number, totalCount: number, lastItemName: string) => void,
    scene: Scene
): Promise<Assets> {
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

    const textures = await texturesPromise;

    const materials = initMaterials(textures, scene);

    const objectsPromise = loadObjects(materials, textures, scene, progressCallbackWrapped, increaseTotalCount);

    return {
        sounds: await soundsPromise,
        musics: await musicsPromise,
        speakerVoiceLines: await voiceLinesPromise,
        textures: textures,
        materials: materials,
        objects: await objectsPromise
    };
}
