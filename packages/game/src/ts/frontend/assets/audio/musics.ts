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

import { type ISoundOptions } from "@babylonjs/core/Audio/Interfaces/ISoundOptions";
import { Sound } from "@babylonjs/core/Audio/sound";

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
    readonly wandering: Sound;
    readonly straussBlueDanube: Sound;
    readonly deepRelaxation: Sound;
    readonly atlanteanTwilight: Sound;
    readonly infinitePerspective: Sound;
    readonly thatZenMoment: Sound;
    readonly echoesOfTime: Sound;
    readonly peaceOfMind: Sound;
    readonly spacialWinds: Sound;
    readonly mesmerize: Sound;
    readonly reawakening: Sound;
    readonly equatorialComplex: Sound;
    readonly soaring: Sound;
};

export async function loadMusics(progressMonitor: ILoadingProgressMonitor | null): Promise<Musics> {
    const loadSoundAsync = (name: string, url: string, options?: ISoundOptions) => {
        progressMonitor?.startTask();
        const loadingPromise = new Promise<Sound>((resolve) => {
            const sound = new Sound(
                name,
                url,
                null,
                () => {
                    resolve(sound);
                },
                options,
            );
        });

        return loadingPromise.then((sound) => {
            progressMonitor?.completeTask();
            return sound;
        });
    };

    const wanderingPromise = loadSoundAsync("Wandering", wanderingPath, { loop: true, streaming: true });
    const straussBlueDanubePromise = loadSoundAsync("StraussBlueDanube", straussBlueDanubePath, { streaming: true });
    const deepRelaxationPromise = loadSoundAsync("DeepRelaxation", deepRelaxationPath, { streaming: true });
    const atlanteanTwilightPromise = loadSoundAsync("AtlanteanTwilight", atlanteanTwilightPath, { streaming: true });
    const infinitePerspectivePromise = loadSoundAsync("InfinitePerspective", infinitePerspectivePath, {
        streaming: true,
    });
    const thatZenMomentPromise = loadSoundAsync("ThatZenMoment", thatZenMomentPath, { streaming: true });
    const echoesOfTimePromise = loadSoundAsync("EchoesOfTime", echoesOfTimePath, { streaming: true });
    const peaceOfMindPromise = loadSoundAsync("PeaceOfMind", peaceOfMindPath, { streaming: true });
    const spacialWindsPromise = loadSoundAsync("SpacialWinds", spacialWindsPath, { streaming: true });
    const mesmerizePromise = loadSoundAsync("Mesmerize", mesmerizePath, { streaming: true });
    const reawakeningPromise = loadSoundAsync("Reawakening", reawakeningPath, { streaming: true });
    const equatorialComplexPromise = loadSoundAsync("EquatorialComplex", equatorialComplexPath, { streaming: true });
    const soaringPromise = loadSoundAsync("Soaring", soaringPath, { streaming: true });

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
