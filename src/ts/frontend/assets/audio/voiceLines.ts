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

import cannotEngageWarpDriveSoundPath from "@assets/sound/voice/CannotEngageWarpDriveCharlotte.mp3";
import engagingWarpDriveSoundPath from "@assets/sound/voice/EngagingWarpDriveCharlotte.mp3";
import fuelScoopingVoicePath from "@assets/sound/voice/FuelScoopingCharlotte.mp3";
import fuelScoopingCompleteVoicePath from "@assets/sound/voice/FuelScoopingCompleteCharlotte.mp3";
import initiatingPlanetaryLandingSoundPath from "@assets/sound/voice/InitiatingPlanetaryLandingCharlotte.mp3";
import landingCompleteSoundPath from "@assets/sound/voice/LandingCompleteCharlotte.mp3";
import landingRequestSoundPath from "@assets/sound/voice/LandingRequestGrantedCharlotte.mp3";
import missionCompleteSoundPath from "@assets/sound/voice/MissionCompleteCharlotte.mp3";
import newDiscoverySoundPath from "@assets/sound/voice/NewDiscoveryCharlotte.mp3";
import warpDriveDisengagedSoundPath from "@assets/sound/voice/WarpDriveDisengagedCharlotte.mp3";
import warpDriveEmergencyShutDownSoundPath from "@assets/sound/voice/WarpDriveEmergencyShutdownCharlotte.mp3";

export type VoiceLines = {
    readonly initiatingPlanetaryLanding: Sound;
    readonly landingRequestGranted: Sound;
    readonly landingComplete: Sound;
    readonly missionComplete: Sound;
    readonly newDiscovery: Sound;
    readonly cannotEngageWarpDrive: Sound;
    readonly warpDriveEmergencyShutDown: Sound;
    readonly warpDriveDisengaged: Sound;
    readonly engagingWarpDrive: Sound;
    readonly fuelScooping: Sound;
    readonly fuelScoopingComplete: Sound;
};

export type SpeakerVoiceLines = {
    readonly charlotte: VoiceLines;
};

export async function loadVoiceLines(progressMonitor: ILoadingProgressMonitor | null): Promise<SpeakerVoiceLines> {
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

    // Voice sounds
    const initiatingPlanetaryLandingSoundPromise = loadSoundAsync(
        "InitiatingPlanetaryLanding",
        initiatingPlanetaryLandingSoundPath,
    );
    const landingRequestGrantedSoundPromise = loadSoundAsync("LandingRequestGranted", landingRequestSoundPath);
    const landingCompleteSoundPromise = loadSoundAsync("LandingComplete", landingCompleteSoundPath);
    const missionCompleteSoundPromise = loadSoundAsync("MissionComplete", missionCompleteSoundPath);
    const newDiscoverySoundPromise = loadSoundAsync("NewDiscovery", newDiscoverySoundPath);

    const cannotEngageWarpDriveSoundPromise = loadSoundAsync("CannotEngageWarpDrive", cannotEngageWarpDriveSoundPath);
    const warpDriveEmergencyShutDownSoundPromise = loadSoundAsync(
        "WarpDriveEmergencyShutDown",
        warpDriveEmergencyShutDownSoundPath,
    );
    const warpDriveDisengagedSoundPromise = loadSoundAsync("WarpDriveDisengaged", warpDriveDisengagedSoundPath);
    const engagingWarpDriveSoundPromise = loadSoundAsync("EngagingWarpDrive", engagingWarpDriveSoundPath);

    const fuelScoopingVoicePromise = loadSoundAsync("FuelScoopingVoice", fuelScoopingVoicePath);
    const fuelScoopingCompleteVoicePromise = loadSoundAsync("FuelScoopingCompleteVoice", fuelScoopingCompleteVoicePath);

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
        },
    };
}
