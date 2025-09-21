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

import { CreateSoundAsync, type AudioEngineV2 } from "@babylonjs/core/AudioV2/abstractAudio/audioEngineV2";
import type { IStaticSoundOptions, StaticSound } from "@babylonjs/core/AudioV2/abstractAudio/staticSound";

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
    readonly ouch: StaticSound;
    readonly engineRunning: StaticSound;
    readonly menuHover: StaticSound;
    readonly menuSelect: StaticSound;
    readonly openPauseMenu: StaticSound;
    readonly targetLock: StaticSound;
    readonly targetUnlock: StaticSound;
    readonly enableWarpDrive: StaticSound;
    readonly disableWarpDrive: StaticSound;
    readonly acceleratingWarpDrive: StaticSound;
    readonly deceleratingWarpDrive: StaticSound;
    readonly hyperSpace: StaticSound;
    readonly thruster: StaticSound;
    readonly success: StaticSound;
    readonly error: StaticSound;
};

export async function loadSounds(
    audioEngine: AudioEngineV2,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Sounds> {
    const loadSoundAsync = async (
        name: string,
        url: string,
        engine: AudioEngineV2,
        options?: Partial<IStaticSoundOptions>,
    ) => {
        progressMonitor?.startTask();
        const sound = await CreateSoundAsync(name, url, options, engine);
        progressMonitor?.completeTask();
        return sound;
    };

    const ouchSoundPromise = loadSoundAsync("OuchSound", ouchSoundPath, audioEngine);

    const engineRunningSoundPromise = loadSoundAsync("EngineRunningSound", engineRunningSoundPath, audioEngine, {
        loop: true,
    });

    const menuHoverSoundPromise = loadSoundAsync("MenuHoverSound", menuHoverSoundPath, audioEngine, {
        playbackRate: 0.5,
    });

    const menuSelectSoundPromise = loadSoundAsync("MenuSelectSound", menuHoverSoundPath, audioEngine);

    const openPauseMenuSoundPromise = loadSoundAsync("OpenPauseMenuSound", menuHoverSoundPath, audioEngine, {
        playbackRate: 0.75,
    });
    // Target sounds
    const targetLockSoundPromise = loadSoundAsync("TargetLockSound", targetSoundPath, audioEngine);

    const targetUnlockSoundPromise = loadSoundAsync("TargetUnlockSound", targetSoundPath, audioEngine, {
        playbackRate: 0.5,
    });
    // Warp drive sounds
    const enableWarpDriveSoundPromise = loadSoundAsync("EnableWarpDriveSound", enableWarpDriveSoundPath, audioEngine, {
        playbackRate: 2,
    });

    const disableWarpDriveSoundPromise = loadSoundAsync(
        "DisableWarpDriveSound",
        disableWarpDriveSoundPath,
        audioEngine,
    );
    const acceleratingWarpDriveSoundPromise = loadSoundAsync(
        "AcceleratingWarpDriveSound",
        acceleratingWarpDriveSoundPath,
        audioEngine,
        {
            playbackRate: 1.0,
            volume: 0.3,
            loop: true,
        },
    );

    const deceleratingWarpDriveSoundPromise = loadSoundAsync(
        "DeceleratingWarpDriveSound",
        deceleratingWarpDriveSoundPath,
        audioEngine,
        {
            playbackRate: 1.0,
            volume: 0.3,
            loop: true,
        },
    );

    const hyperSpaceSoundPromise = loadSoundAsync("HyperSpaceSound", hyperSpaceSoundPath, audioEngine, {
        playbackRate: 1.5,
        volume: 0.25,
        loop: true,
    });

    const thrusterSoundPromise = loadSoundAsync("ThrusterSound", thrusterSoundPath, audioEngine, {
        playbackRate: 1.0,
        volume: 0.5,
        loop: true,
    });

    // UI sounds
    const successSoundPromise = loadSoundAsync("Success", echoedBlipSoundPath, audioEngine);
    const errorSoundPromise = loadSoundAsync("Error", errorBleepSoundPath, audioEngine);

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
