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

import menuHoverSoundPath from "@assets/sound/166186__drminky__menu-screen-mouse-over.mp3";
import disableWarpDriveSoundPath from "@assets/sound/204418__nhumphrey__large-engine.mp3";
import thrusterSoundPath from "@assets/sound/318688__limitsnap_creations__rocket-thrust-effect.mp3";
import errorBleepSoundPath from "@assets/sound/372197__original_sound__error-bleep-4.mp3";
import enableWarpDriveSoundPath from "@assets/sound/386992__lollosound__17-distorzione.mp3";
import acceleratingWarpDriveSoundPath from "@assets/sound/539503__timbre__endless-acceleration.mp3";
import hyperSpaceSoundPath from "@assets/sound/539503__timbre_endless-deceleration-hyperspace.mp3";
import deceleratingWarpDriveSoundPath from "@assets/sound/539503__timbre_endless-deceleration.mp3";
import echoedBlipSoundPath from "@assets/sound/554089__copyc4t__echoed-blip.mp3";
import targetSoundPath from "@assets/sound/702805__matrixxx__futuristic-inspect-sound-ui-or-in-game-notification.mp3";
import engineRunningSoundPath from "@assets/sound/engineRunning.mp3";
import ouchSoundPath from "@assets/sound/ouch.mp3";

export type Sounds = {
    readonly ouch: Sound;
    readonly engineRunning: Sound;
    readonly menuHover: Sound;
    readonly menuSelect: Sound;
    readonly openPauseMenu: Sound;
    readonly targetLock: Sound;
    readonly targetUnlock: Sound;
    readonly enableWarpDrive: Sound;
    readonly disableWarpDrive: Sound;
    readonly acceleratingWarpDrive: Sound;
    readonly deceleratingWarpDrive: Sound;
    readonly hyperSpace: Sound;
    readonly thruster: Sound;
    readonly success: Sound;
    readonly error: Sound;
};

export async function loadSounds(progressMonitor: ILoadingProgressMonitor | null): Promise<Sounds> {
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

    const ouchSoundPromise = loadSoundAsync("OuchSound", ouchSoundPath);

    const engineRunningSoundPromise = loadSoundAsync("EngineRunningSound", engineRunningSoundPath, { loop: true });

    const menuHoverSoundPromise = loadSoundAsync("MenuHoverSound", menuHoverSoundPath, { playbackRate: 0.5 });

    const menuSelectSoundPromise = loadSoundAsync("MenuSelectSound", menuHoverSoundPath);

    const openPauseMenuSoundPromise = loadSoundAsync("OpenPauseMenuSound", menuHoverSoundPath, { playbackRate: 0.75 });

    // Target sounds
    const targetLockSoundPromise = loadSoundAsync("TargetLockSound", targetSoundPath);

    const targetUnlockSoundPromise = loadSoundAsync("TargetUnlockSound", targetSoundPath, { playbackRate: 0.5 });

    // Warp drive sounds
    const enableWarpDriveSoundPromise = loadSoundAsync("EnableWarpDriveSound", enableWarpDriveSoundPath, {
        playbackRate: 2,
    });

    const disableWarpDriveSoundPromise = loadSoundAsync("DisableWarpDriveSound", disableWarpDriveSoundPath);

    const acceleratingWarpDriveSoundPromise = loadSoundAsync(
        "AcceleratingWarpDriveSound",
        acceleratingWarpDriveSoundPath,
        {
            playbackRate: 1.0,
            volume: 0.3,
            loop: true,
        },
    );

    const deceleratingWarpDriveSoundPromise = loadSoundAsync(
        "DeceleratingWarpDriveSound",
        deceleratingWarpDriveSoundPath,
        {
            playbackRate: 1.0,
            volume: 0.3,
            loop: true,
        },
    );

    const hyperSpaceSoundPromise = loadSoundAsync("HyperSpaceSound", hyperSpaceSoundPath, {
        playbackRate: 1.5,
        volume: 0.25,
        loop: true,
    });

    const thrusterSoundPromise = loadSoundAsync("ThrusterSound", thrusterSoundPath, {
        playbackRate: 1.0,
        volume: 0.5,
        loop: true,
    });

    // UI sounds
    const successSoundPromise = loadSoundAsync("Success", echoedBlipSoundPath);
    const errorSoundPromise = loadSoundAsync("Error", errorBleepSoundPath);

    return {
        ouch: await ouchSoundPromise,
        engineRunning: await engineRunningSoundPromise,
        menuHover: await menuHoverSoundPromise,
        menuSelect: await menuSelectSoundPromise,
        openPauseMenu: await openPauseMenuSoundPromise,
        targetLock: await targetLockSoundPromise,
        targetUnlock: await targetUnlockSoundPromise,
        enableWarpDrive: await enableWarpDriveSoundPromise,
        disableWarpDrive: await disableWarpDriveSoundPromise,
        acceleratingWarpDrive: await acceleratingWarpDriveSoundPromise,
        deceleratingWarpDrive: await deceleratingWarpDriveSoundPromise,
        hyperSpace: await hyperSpaceSoundPromise,
        thruster: await thrusterSoundPromise,
        success: await successSoundPromise,
        error: await errorSoundPromise,
    };
}
