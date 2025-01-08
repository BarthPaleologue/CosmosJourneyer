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
import { AssetsManager } from "@babylonjs/core/Misc/assetsManager";
import { Scene } from "@babylonjs/core/scene";
import "@babylonjs/core/Audio/audioEngine";
import "@babylonjs/core/Audio/audioSceneComponent";

import starMapBackgroundMusic from "../../asset/sound/music/455855__andrewkn__wandering.mp3";
import straussBlueDanube from "../../asset/sound/music/Strauss_The_Blue_Danube_Waltz.ogg";
import deepRelaxation from "../../asset/sound/music/Deep_Relaxation.ogg";
import atlanteanTwilight from "../../asset/sound/music/Atlantean_Twilight.mp3";
import infinitePerspective from "../../asset/sound/music/Infinite_Perspective.ogg";
import thatZenMoment from "../../asset/sound/music/That_Zen_Moment.ogg";
import echoesOfTime from "../../asset/sound/music/Echoes_of_Time_v2.ogg";
import danseMorialta from "../../asset/sound/music/Danse_Morialta.mp3";
import peaceOfMind from "../../asset/sound/music/Peace_of_Mind.ogg";
import spacialWinds from "../../asset/sound/music/Horror_Spacial_Winds.mp3";
import mesmerize from "../../asset/sound/music/Mesmerize.ogg";
import reawakening from "../../asset/sound/music/Reawakening.mp3";

export class Musics {
    public static STAR_MAP: Sound;

    public static MAIN_MENU: Sound;

    public static STRAUSS_BLUE_DANUBE: Sound;

    public static DEEP_RELAXATION: Sound;

    public static ATLANTEAN_TWILIGHT: Sound;

    public static INFINITE_PERSPECTIVE: Sound;

    public static THAT_ZEN_MOMENT: Sound;

    public static ECHOES_OF_TIME: Sound;

    public static DANSE_MORIALTA: Sound;

    public static PEACE_OF_MIND: Sound;

    public static SPACIAL_WINDS: Sound;

    public static MESMERIZE: Sound;

    public static REAWAKENING: Sound;

    public static EnqueueTasks(manager: AssetsManager, scene: Scene) {
        const starMapBackgroundMusicTask = manager.addBinaryFileTask("starMapBackgroundMusicTask", starMapBackgroundMusic);
        starMapBackgroundMusicTask.onSuccess = (task) => {
            Musics.STAR_MAP = new Sound("StarMapBackgroundMusic", task.data, scene, null, {
                loop: true
            });

            Musics.MAIN_MENU = Musics.STAR_MAP;

            console.log("Star map background music loaded");
        };

        const straussBlueDanubeTask = manager.addBinaryFileTask("straussBlueDanubeTask", straussBlueDanube);
        straussBlueDanubeTask.onSuccess = (task) => {
            Musics.STRAUSS_BLUE_DANUBE = new Sound("StraussBlueDanube", task.data, scene);
            console.log("Strauss Blue Danube sound loaded");
        };

        const deepRelaxationTask = manager.addBinaryFileTask("deepRelaxationTask", deepRelaxation);
        deepRelaxationTask.onSuccess = (task) => {
            Musics.DEEP_RELAXATION = new Sound("DeepRelaxation", task.data, scene);
            console.log("Deep Relaxation sound loaded");
        };

        const atlanteanTwilightTask = manager.addBinaryFileTask("atlanteanTwilightTask", atlanteanTwilight);
        atlanteanTwilightTask.onSuccess = (task) => {
            Musics.ATLANTEAN_TWILIGHT = new Sound("AtlanteanTwilight", task.data, scene);
            console.log("Atlantean Twilight sound loaded");
        };

        const infinitePerspectiveTask = manager.addBinaryFileTask("infinitePerspectiveTask", infinitePerspective);
        infinitePerspectiveTask.onSuccess = (task) => {
            Musics.INFINITE_PERSPECTIVE = new Sound("InfinitePerspective", task.data, scene);
            console.log("Infinite Perspective sound loaded");
        };

        const thatZenMomentTask = manager.addBinaryFileTask("thatZenMomentTask", thatZenMoment);
        thatZenMomentTask.onSuccess = (task) => {
            Musics.THAT_ZEN_MOMENT = new Sound("ThatZenMoment", task.data, scene);
            console.log("That Zen Moment sound loaded");
        };

        const echoesOfTimeTask = manager.addBinaryFileTask("echoesOfTimeTask", echoesOfTime);
        echoesOfTimeTask.onSuccess = (task) => {
            Musics.ECHOES_OF_TIME = new Sound("EchoesOfTime", task.data, scene);
            console.log("Echoes of Time sound loaded");
        };

        const danseMorialtaTask = manager.addBinaryFileTask("danseMorialtaTask", danseMorialta);
        danseMorialtaTask.onSuccess = (task) => {
            Musics.DANSE_MORIALTA = new Sound("DanseMorialta", task.data, scene);
            console.log("Danse Morialta sound loaded");
        };

        const peaceOfMindTask = manager.addBinaryFileTask("peaceOfMindTask", peaceOfMind);
        peaceOfMindTask.onSuccess = (task) => {
            Musics.PEACE_OF_MIND = new Sound("PeaceOfMind", task.data, scene);
            console.log("Peace of Mind sound loaded");
        };

        const spacialWindsTask = manager.addBinaryFileTask("spacialWindsTask", spacialWinds);
        spacialWindsTask.onSuccess = (task) => {
            Musics.SPACIAL_WINDS = new Sound("SpacialWinds", task.data, scene);
            console.log("Spacial Winds sound loaded");
        };

        const mesmerizeTask = manager.addBinaryFileTask("mesmerizeTask", mesmerize);
        mesmerizeTask.onSuccess = (task) => {
            Musics.MESMERIZE = new Sound("Mesmerize", task.data, scene);
            console.log("Mesmerize sound loaded");
        };

        const reawakeningTask = manager.addBinaryFileTask("reawakeningTask", reawakening);
        reawakeningTask.onSuccess = (task) => {
            Musics.REAWAKENING = new Sound("Reawakening", task.data, scene);
            console.log("Reawakening sound loaded");
        };
    }
}
