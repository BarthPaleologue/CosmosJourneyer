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

import "@babylonjs/core/Audio/audioEngine";
import "@babylonjs/core/Audio/audioSceneComponent";

import type { AbstractSound } from "@babylonjs/core/AudioV2/abstractAudio/abstractSound";
import { CreateStreamingSoundAsync, type AudioEngineV2 } from "@babylonjs/core/AudioV2/abstractAudio/audioEngineV2";
import type { IStreamingSoundOptions } from "@babylonjs/core/AudioV2/abstractAudio/streamingSound";

import { type ILoadingProgressMonitor } from "../loadingProgressMonitor";

import wanderingPath from "@assets/sound/music/455855__andrewkn__wandering.mp3";
import atlanteanTwilightPath from "@assets/sound/music/Atlantean_Twilight.mp3";
import deepRelaxationPath from "@assets/sound/music/Deep_Relaxation.ogg";
import echoesOfTimePath from "@assets/sound/music/Echoes_of_Time_v2.ogg";
import equatorialComplexPath from "@assets/sound/music/Equatorial-Complex.ogg";
import spacialWindsPath from "@assets/sound/music/Horror_Spacial_Winds.mp3";
import infinitePerspectivePath from "@assets/sound/music/Infinite_Perspective.ogg";
import mesmerizePath from "@assets/sound/music/Mesmerize.ogg";
import peaceOfMindPath from "@assets/sound/music/Peace_of_Mind.ogg";
import reawakeningPath from "@assets/sound/music/Reawakening.mp3";
import soaringPath from "@assets/sound/music/Soaring.ogg";
import straussBlueDanubePath from "@assets/sound/music/Strauss_The_Blue_Danube_Waltz.ogg";
import thatZenMomentPath from "@assets/sound/music/That_Zen_Moment.ogg";

export type Musics = {
    readonly wandering: AbstractSound;
    readonly straussBlueDanube: AbstractSound;
    readonly deepRelaxation: AbstractSound;
    readonly atlanteanTwilight: AbstractSound;
    readonly infinitePerspective: AbstractSound;
    readonly thatZenMoment: AbstractSound;
    readonly echoesOfTime: AbstractSound;
    readonly peaceOfMind: AbstractSound;
    readonly spacialWinds: AbstractSound;
    readonly mesmerize: AbstractSound;
    readonly reawakening: AbstractSound;
    readonly equatorialComplex: AbstractSound;
    readonly soaring: AbstractSound;
};

export async function loadMusics(
    audioEngine: AudioEngineV2,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Musics> {
    const loadSoundAsync = async (
        name: string,
        url: string,
        audioEngine: AudioEngineV2,
        options?: Partial<IStreamingSoundOptions>,
    ) => {
        progressMonitor?.startTask();
        const sound = await CreateStreamingSoundAsync(name, url, options, audioEngine);
        progressMonitor?.completeTask();
        return sound;
    };

    const wanderingPromise = loadSoundAsync("Wandering", wanderingPath, audioEngine, { loop: true });
    const straussBlueDanubePromise = loadSoundAsync("StraussBlueDanube", straussBlueDanubePath, audioEngine);
    const deepRelaxationPromise = loadSoundAsync("DeepRelaxation", deepRelaxationPath, audioEngine);
    const atlanteanTwilightPromise = loadSoundAsync("AtlanteanTwilight", atlanteanTwilightPath, audioEngine);
    const infinitePerspectivePromise = loadSoundAsync("InfinitePerspective", infinitePerspectivePath, audioEngine);
    const thatZenMomentPromise = loadSoundAsync("ThatZenMoment", thatZenMomentPath, audioEngine);
    const echoesOfTimePromise = loadSoundAsync("EchoesOfTime", echoesOfTimePath, audioEngine);
    const peaceOfMindPromise = loadSoundAsync("PeaceOfMind", peaceOfMindPath, audioEngine);
    const spacialWindsPromise = loadSoundAsync("SpacialWinds", spacialWindsPath, audioEngine);
    const mesmerizePromise = loadSoundAsync("Mesmerize", mesmerizePath, audioEngine);
    const reawakeningPromise = loadSoundAsync("Reawakening", reawakeningPath, audioEngine);
    const equatorialComplexPromise = loadSoundAsync("EquatorialComplex", equatorialComplexPath, audioEngine);
    const soaringPromise = loadSoundAsync("Soaring", soaringPath, audioEngine);

    return {
        wandering: await wanderingPromise,
        straussBlueDanube: await straussBlueDanubePromise,
        deepRelaxation: await deepRelaxationPromise,
        atlanteanTwilight: await atlanteanTwilightPromise,
        infinitePerspective: await infinitePerspectivePromise,
        thatZenMoment: await thatZenMomentPromise,
        echoesOfTime: await echoesOfTimePromise,
        peaceOfMind: await peaceOfMindPromise,
        spacialWinds: await spacialWindsPromise,
        mesmerize: await mesmerizePromise,
        reawakening: await reawakeningPromise,
        equatorialComplex: await equatorialComplexPromise,
        soaring: await soaringPromise,
    };
}
