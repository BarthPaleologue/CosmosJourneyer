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
import type { AudioEngineV2 } from "@babylonjs/core/AudioV2/abstractAudio/audioEngineV2";

import type { ILoadingProgressMonitor } from "../loadingProgressMonitor";
import { loadStreamingSoundAsync } from "./utils";

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
    progressMonitor: ILoadingProgressMonitor,
): Promise<Musics> {
    const wanderingPromise = loadStreamingSoundAsync("Wandering", wanderingPath, audioEngine, progressMonitor, {
        loop: true,
    });
    const straussBlueDanubePromise = loadStreamingSoundAsync(
        "StraussBlueDanube",
        straussBlueDanubePath,
        audioEngine,
        progressMonitor,
    );
    const deepRelaxationPromise = loadStreamingSoundAsync(
        "DeepRelaxation",
        deepRelaxationPath,
        audioEngine,
        progressMonitor,
    );
    const atlanteanTwilightPromise = loadStreamingSoundAsync(
        "AtlanteanTwilight",
        atlanteanTwilightPath,
        audioEngine,
        progressMonitor,
    );
    const infinitePerspectivePromise = loadStreamingSoundAsync(
        "InfinitePerspective",
        infinitePerspectivePath,
        audioEngine,
        progressMonitor,
    );
    const thatZenMomentPromise = loadStreamingSoundAsync(
        "ThatZenMoment",
        thatZenMomentPath,
        audioEngine,
        progressMonitor,
    );
    const echoesOfTimePromise = loadStreamingSoundAsync("EchoesOfTime", echoesOfTimePath, audioEngine, progressMonitor);
    const peaceOfMindPromise = loadStreamingSoundAsync("PeaceOfMind", peaceOfMindPath, audioEngine, progressMonitor);
    const spacialWindsPromise = loadStreamingSoundAsync("SpacialWinds", spacialWindsPath, audioEngine, progressMonitor);
    const mesmerizePromise = loadStreamingSoundAsync("Mesmerize", mesmerizePath, audioEngine, progressMonitor);
    const reawakeningPromise = loadStreamingSoundAsync("Reawakening", reawakeningPath, audioEngine, progressMonitor);
    const equatorialComplexPromise = loadStreamingSoundAsync(
        "EquatorialComplex",
        equatorialComplexPath,
        audioEngine,
        progressMonitor,
    );
    const soaringPromise = loadStreamingSoundAsync("Soaring", soaringPath, audioEngine, progressMonitor);

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
