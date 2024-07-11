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

import ouchSound from "../../asset/sound/ouch.mp3";
import engineRunningSound from "../../asset/sound/engineRunning.mp3";
import menuHoverSound from "../../asset/sound/166186__drminky__menu-screen-mouse-over.mp3";
import targetSound from "../../asset/sound/702805__matrixxx__futuristic-inspect-sound-ui-or-in-game-notification.mp3";
import enableWarpDriveSound from "../../asset/sound/386992__lollosound__17-distorzione.mp3";
import disableWarpDriveSound from "../../asset/sound/204418__nhumphrey__large-engine.mp3";
import acceleratingWarpDriveSound from "../../asset/sound/539503__timbre__endless-acceleration.mp3";
import deceleratingWarpDriveSound from "../../asset/sound/539503__timbre_endless-deceleration.mp3";
import hyperSpaceSound from "../../asset/sound/539503__timbre_endless-deceleration-hyperspace.mp3";
import thrusterSound from "../../asset/sound/318688__limitsnap_creations__rocket-thrust-effect.mp3";
import starMapBackgroundMusic from "../../asset/sound/455855__andrewkn__wandering.mp3";

export class Sounds {
    public static OUCH_SOUND: Sound;
    public static ENGINE_RUNNING_SOUND: Sound;

    public static MENU_HOVER_SOUND: Sound;
    public static MENU_SELECT_SOUND: Sound;
    public static OPEN_PAUSE_MENU_SOUND: Sound;

    public static STAR_MAP_CLICK_SOUND: Sound;

    public static TARGET_LOCK_SOUND: Sound;
    public static TARGET_UNLOCK_SOUND: Sound;

    public static ENABLE_WARP_DRIVE_SOUND: Sound;
    public static DISABLE_WARP_DRIVE_SOUND: Sound;

    public static ACCELERATING_WARP_DRIVE_SOUND: Sound;
    public static DECELERATING_WARP_DRIVE_SOUND: Sound;

    public static HYPER_SPACE_SOUND: Sound;

    public static THRUSTER_SOUND: Sound;

    public static STAR_MAP_BACKGROUND_MUSIC: Sound;
    public static MAIN_MENU_BACKGROUND_MUSIC: Sound;

    public static EnqueueTasks(manager: AssetsManager, scene: Scene) {
        const ouchSoundTask = manager.addBinaryFileTask("ouchSoundTask", ouchSound);
        ouchSoundTask.onSuccess = (task) => {
            Sounds.OUCH_SOUND = new Sound("OuchSound", task.data, scene);

            console.log("Ouch sound loaded");
        };

        const engineRunningSoundTask = manager.addBinaryFileTask("engineRunningSoundTask", engineRunningSound);
        engineRunningSoundTask.onSuccess = (task) => {
            Sounds.ENGINE_RUNNING_SOUND = new Sound("EngineRunningSound", task.data, scene, null, {
                loop: true
            });

            console.log("Engine running sound loaded");
        };

        const menuHoverSoundTask = manager.addBinaryFileTask("menuHoverSoundTask", menuHoverSound);
        menuHoverSoundTask.onSuccess = (task) => {
            Sounds.MENU_HOVER_SOUND = new Sound("MenuHoverSound", task.data, scene);
            Sounds.MENU_HOVER_SOUND.updateOptions({
                playbackRate: 0.5
            });

            const clonedSound = Sounds.MENU_HOVER_SOUND.clone();
            if (clonedSound === null) throw new Error("clonedSound is null");
            Sounds.MENU_SELECT_SOUND = clonedSound;
            Sounds.MENU_SELECT_SOUND.updateOptions({
                playbackRate: 1.0
            });

            const clonedSound2 = Sounds.MENU_HOVER_SOUND.clone();
            if (clonedSound2 === null) throw new Error("clonedSound2 is null");
            Sounds.OPEN_PAUSE_MENU_SOUND = clonedSound2;
            Sounds.OPEN_PAUSE_MENU_SOUND.updateOptions({
                playbackRate: 0.75
            });

            console.log("Menu hover sound loaded");
        };

        const targetSoundTask = manager.addBinaryFileTask("targetSoundTask", targetSound);
        targetSoundTask.onSuccess = (task) => {
            Sounds.TARGET_LOCK_SOUND = new Sound("StarMapClickSound", task.data, scene);

            const clonedSound = Sounds.TARGET_LOCK_SOUND.clone();
            if (clonedSound === null) throw new Error("clonedSound is null");
            Sounds.TARGET_UNLOCK_SOUND = clonedSound;
            Sounds.TARGET_UNLOCK_SOUND.updateOptions({
                playbackRate: 0.5
            });

            const clonedSound2 = Sounds.TARGET_LOCK_SOUND.clone();
            if (clonedSound2 === null) throw new Error("clonedSound2 is null");
            Sounds.STAR_MAP_CLICK_SOUND = clonedSound2;

            console.log("Target sound loaded");
        };

        const enableWarpDriveSoundTask = manager.addBinaryFileTask("enableWarpDriveSoundTask", enableWarpDriveSound);
        enableWarpDriveSoundTask.onSuccess = (task) => {
            Sounds.ENABLE_WARP_DRIVE_SOUND = new Sound("EnableWarpDriveSound", task.data, scene);
            Sounds.ENABLE_WARP_DRIVE_SOUND.updateOptions({
                playbackRate: 2
            });

            console.log("Enable warp drive sound loaded");
        };

        const disableWarpDriveSoundTask = manager.addBinaryFileTask("disableWarpDriveSoundTask", disableWarpDriveSound);
        disableWarpDriveSoundTask.onSuccess = (task) => {
            Sounds.DISABLE_WARP_DRIVE_SOUND = new Sound("DisableWarpDriveSound", task.data, scene);

            console.log("Disable warp drive sound loaded");
        };

        const acceleratingWarpDriveSoundTask = manager.addBinaryFileTask("acceleratingWarpDriveSoundTask", acceleratingWarpDriveSound);
        acceleratingWarpDriveSoundTask.onSuccess = (task) => {
            Sounds.ACCELERATING_WARP_DRIVE_SOUND = new Sound("AcceleratingWarpDriveSound", task.data, scene);
            Sounds.ACCELERATING_WARP_DRIVE_SOUND.updateOptions({
                playbackRate: 1.0,
                volume: 0.1,
                loop: true
            });

            console.log("Accelerating warp drive sound loaded");
        };

        const deceleratingWarpDriveSoundTask = manager.addBinaryFileTask("deceleratingWarpDriveSoundTask", deceleratingWarpDriveSound);
        deceleratingWarpDriveSoundTask.onSuccess = (task) => {
            Sounds.DECELERATING_WARP_DRIVE_SOUND = new Sound("DeceleratingWarpDriveSound", task.data, scene);
            Sounds.DECELERATING_WARP_DRIVE_SOUND.updateOptions({
                playbackRate: 1.0,
                volume: 0.1,
                loop: true
            });

            console.log("Decelerating warp drive sound loaded");
        };

        const hyperSpaceSoundTask = manager.addBinaryFileTask("hyperSpaceSoundTask", hyperSpaceSound);
        hyperSpaceSoundTask.onSuccess = (task) => {
            Sounds.HYPER_SPACE_SOUND = new Sound("HyperSpaceSound", task.data, scene);
            Sounds.HYPER_SPACE_SOUND.updateOptions({
                playbackRate: 1.5,
                volume: 0.25,
                loop: true
            });

            console.log("Hyper space sound loaded");
        };

        const thrusterSoundTask = manager.addBinaryFileTask("thrusterSoundTask", thrusterSound);
        thrusterSoundTask.onSuccess = (task) => {
            Sounds.THRUSTER_SOUND = new Sound("ThrusterSound", task.data, scene);
            Sounds.THRUSTER_SOUND.updateOptions({
                playbackRate: 1.0,
                volume: 0.5,
                loop: true
            });

            console.log("Thruster sound loaded");
        };

        const starMapBackgroundMusicTask = manager.addBinaryFileTask("starMapBackgroundMusicTask", starMapBackgroundMusic);
        starMapBackgroundMusicTask.onSuccess = (task) => {
            Sounds.STAR_MAP_BACKGROUND_MUSIC = new Sound("StarMapBackgroundMusic", task.data, scene, null, {
                loop: true
            });

            console.log("Star map background music loaded");
        };

        const mainMenuBackgroundMusicTask = manager.addBinaryFileTask("mainMenuBackgroundMusicTask", starMapBackgroundMusic);
        mainMenuBackgroundMusicTask.onSuccess = (task) => {
            Sounds.MAIN_MENU_BACKGROUND_MUSIC = new Sound("MainMenuBackgroundMusic", task.data, scene, null, {
                loop: true
            });

            console.log("Main menu background music loaded");
        };
    }
}
