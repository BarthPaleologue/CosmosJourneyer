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

import { Sound } from "@babylonjs/core/Audio/sound";
import { ISoundOptions } from "@babylonjs/core/Audio/Interfaces/ISoundOptions";
import "@babylonjs/core/Audio/audioEngine";
import "@babylonjs/core/Audio/audioSceneComponent";

import wanderingPath from "../../asset/sound/music/455855__andrewkn__wandering.mp3";
import straussBlueDanubePath from "../../asset/sound/music/Strauss_The_Blue_Danube_Waltz.ogg";
import deepRelaxationPath from "../../asset/sound/music/Deep_Relaxation.ogg";
import atlanteanTwilightPath from "../../asset/sound/music/Atlantean_Twilight.mp3";
import infinitePerspectivePath from "../../asset/sound/music/Infinite_Perspective.ogg";
import thatZenMomentPath from "../../asset/sound/music/That_Zen_Moment.ogg";
import echoesOfTimePath from "../../asset/sound/music/Echoes_of_Time_v2.ogg";
import peaceOfMindPath from "../../asset/sound/music/Peace_of_Mind.ogg";
import spacialWindsPath from "../../asset/sound/music/Horror_Spacial_Winds.mp3";
import mesmerizePath from "../../asset/sound/music/Mesmerize.ogg";
import reawakeningPath from "../../asset/sound/music/Reawakening.mp3";
import equatorialComplexPath from "../../asset/sound/music/Equatorial-Complex.ogg";
import soaringPath from "../../asset/sound/music/Soaring.ogg";

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

export async function loadMusics(
    progressCallback: (loadedCount: number, totalCount: number, lastItemName: string) => void
): Promise<Musics> {
    let loadedCount = 0;
    let totalCount = 0;

    const loadSoundAsync = (name: string, url: string, options?: ISoundOptions) => {
        const loadingPromise = new Promise<Sound>((resolve, reject) => {
            const sound = new Sound(
                name,
                url,
                null,
                () => {
                    resolve(sound);
                },
                options
            );
        });
        totalCount++;

        return loadingPromise.then((sound) => {
            progressCallback(++loadedCount, totalCount, sound.name);
            return sound;
        });
    };

    const wanderingPromise = loadSoundAsync("Wandering", wanderingPath, { loop: true });
    const straussBlueDanubePromise = loadSoundAsync("StraussBlueDanube", straussBlueDanubePath);
    const deepRelaxationPromise = loadSoundAsync("DeepRelaxation", deepRelaxationPath);
    const atlanteanTwilightPromise = loadSoundAsync("AtlanteanTwilight", atlanteanTwilightPath);
    const infinitePerspectivePromise = loadSoundAsync("InfinitePerspective", infinitePerspectivePath);
    const thatZenMomentPromise = loadSoundAsync("ThatZenMoment", thatZenMomentPath);
    const echoesOfTimePromise = loadSoundAsync("EchoesOfTime", echoesOfTimePath);
    const peaceOfMindPromise = loadSoundAsync("PeaceOfMind", peaceOfMindPath);
    const spacialWindsPromise = loadSoundAsync("SpacialWinds", spacialWindsPath);
    const mesmerizePromise = loadSoundAsync("Mesmerize", mesmerizePath);
    const reawakeningPromise = loadSoundAsync("Reawakening", reawakeningPath);
    const equatorialComplexPromise = loadSoundAsync("EquatorialComplex", equatorialComplexPath);
    const soaringPromise = loadSoundAsync("Soaring", soaringPath);

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
        soaring: await soaringPromise
    };
}
