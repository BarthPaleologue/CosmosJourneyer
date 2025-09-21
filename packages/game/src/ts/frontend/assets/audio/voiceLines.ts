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
import { CreateSoundAsync, type AudioEngineV2 } from "@babylonjs/core/AudioV2/abstractAudio/audioEngineV2";
import type { IStaticSoundOptions } from "@babylonjs/core/AudioV2/abstractAudio/staticSound";

import { type ILoadingProgressMonitor } from "../loadingProgressMonitor";

import cannotEngageWarpDriveSoundPath from "@assets/sound/voice/CannotEngageWarpDriveCharlotte.mp3";
import engagingWarpDriveSoundPath from "@assets/sound/voice/EngagingWarpDriveCharlotte.mp3";
import fuelScoopingVoicePath from "@assets/sound/voice/FuelScoopingCharlotte.mp3";
import fuelScoopingCompleteVoicePath from "@assets/sound/voice/FuelScoopingCompleteCharlotte.mp3";
import initiatingPlanetaryLandingSoundPath from "@assets/sound/voice/InitiatingPlanetaryLandingCharlotte.mp3";
import landingCompleteSoundPath from "@assets/sound/voice/LandingCompleteCharlotte.mp3";
import landingRequestSoundPath from "@assets/sound/voice/LandingRequestGrantedCharlotte.mp3";
import lowFuelWarningSoundPath from "@assets/sound/voice/LowFuelWarningCharlotte.mp3";
import missionCompleteSoundPath from "@assets/sound/voice/MissionCompleteCharlotte.mp3";
import newDiscoverySoundPath from "@assets/sound/voice/NewDiscoveryCharlotte.mp3";
import warpDriveDisengagedSoundPath from "@assets/sound/voice/WarpDriveDisengagedCharlotte.mp3";
import warpDriveEmergencyShutDownSoundPath from "@assets/sound/voice/WarpDriveEmergencyShutdownCharlotte.mp3";

export type VoiceLines = {
    readonly initiatingPlanetaryLanding: AbstractSound;
    readonly landingRequestGranted: AbstractSound;
    readonly landingComplete: AbstractSound;
    readonly missionComplete: AbstractSound;
    readonly newDiscovery: AbstractSound;
    readonly cannotEngageWarpDrive: AbstractSound;
    readonly warpDriveEmergencyShutDown: AbstractSound;
    readonly warpDriveDisengaged: AbstractSound;
    readonly engagingWarpDrive: AbstractSound;
    readonly fuelScooping: AbstractSound;
    readonly fuelScoopingComplete: AbstractSound;
    readonly lowFuelWarning: AbstractSound;
};

export type SpeakerVoiceLines = {
    readonly charlotte: VoiceLines;
};

export async function loadVoiceLines(
    audioEngine: AudioEngineV2,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<SpeakerVoiceLines> {
    const loadSoundAsync = async (
        name: string,
        url: string,
        audioEngine: AudioEngineV2,
        options?: Partial<IStaticSoundOptions>,
    ) => {
        progressMonitor?.startTask();
        const sound = await CreateSoundAsync(name, url, options, audioEngine);
        progressMonitor?.completeTask();
        return sound;
    };

    // Voice sounds
    const initiatingPlanetaryLandingSoundPromise = loadSoundAsync(
        "InitiatingPlanetaryLanding",
        initiatingPlanetaryLandingSoundPath,
        audioEngine,
    );
    const landingRequestGrantedSoundPromise = loadSoundAsync(
        "LandingRequestGranted",
        landingRequestSoundPath,
        audioEngine,
    );
    const landingCompleteSoundPromise = loadSoundAsync("LandingComplete", landingCompleteSoundPath, audioEngine);
    const missionCompleteSoundPromise = loadSoundAsync("MissionComplete", missionCompleteSoundPath, audioEngine);
    const newDiscoverySoundPromise = loadSoundAsync("NewDiscovery", newDiscoverySoundPath, audioEngine);

    const cannotEngageWarpDriveSoundPromise = loadSoundAsync(
        "CannotEngageWarpDrive",
        cannotEngageWarpDriveSoundPath,
        audioEngine,
    );
    const warpDriveEmergencyShutDownSoundPromise = loadSoundAsync(
        "WarpDriveEmergencyShutDown",
        warpDriveEmergencyShutDownSoundPath,
        audioEngine,
    );
    const warpDriveDisengagedSoundPromise = loadSoundAsync(
        "WarpDriveDisengaged",
        warpDriveDisengagedSoundPath,
        audioEngine,
    );
    const engagingWarpDriveSoundPromise = loadSoundAsync("EngagingWarpDrive", engagingWarpDriveSoundPath, audioEngine);

    const fuelScoopingVoicePromise = loadSoundAsync("FuelScoopingVoice", fuelScoopingVoicePath, audioEngine);
    const fuelScoopingCompleteVoicePromise = loadSoundAsync(
        "FuelScoopingCompleteVoice",
        fuelScoopingCompleteVoicePath,
        audioEngine,
    );
    const fuelWarningSoundPromise = loadSoundAsync("LowFuelWarning", lowFuelWarningSoundPath, audioEngine);

    return {
        charlotte: {
            initiatingPlanetaryLanding: await initiatingPlanetaryLandingSoundPromise,
            landingRequestGranted: await landingRequestGrantedSoundPromise,
            landingComplete: await landingCompleteSoundPromise,
            missionComplete: await missionCompleteSoundPromise,
            newDiscovery: await newDiscoverySoundPromise,
            cannotEngageWarpDrive: await cannotEngageWarpDriveSoundPromise,
            warpDriveEmergencyShutDown: await warpDriveEmergencyShutDownSoundPromise,
            warpDriveDisengaged: await warpDriveDisengagedSoundPromise,
            engagingWarpDrive: await engagingWarpDriveSoundPromise,
            fuelScooping: await fuelScoopingVoicePromise,
            fuelScoopingComplete: await fuelScoopingCompleteVoicePromise,
            lowFuelWarning: await fuelWarningSoundPromise,
        },
    };
}
