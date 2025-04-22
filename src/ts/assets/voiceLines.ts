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

import initiatingPlanetaryLandingSoundPath from "../../asset/sound/voice/InitiatingPlanetaryLandingCharlotte.mp3";
import landingRequestSoundPath from "../../asset/sound/voice/LandingRequestGrantedCharlotte.mp3";
import landingCompleteSoundPath from "../../asset/sound/voice/LandingCompleteCharlotte.mp3";

import missionCompleteSoundPath from "../../asset/sound/voice/MissionCompleteCharlotte.mp3";

import newDiscoverySoundPath from "../../asset/sound/voice/NewDiscoveryCharlotte.mp3";

import cannotEngageWarpDriveSoundPath from "../../asset/sound/voice/CannotEngageWarpDriveCharlotte.mp3";
import warpDriveEmergencyShutDownSoundPath from "../../asset/sound/voice/WarpDriveEmergencyShutdownCharlotte.mp3";
import warpDriveDisengagedSoundPath from "../../asset/sound/voice/WarpDriveDisengagedCharlotte.mp3";
import engagingWarpDriveSoundPath from "../../asset/sound/voice/EngagingWarpDriveCharlotte.mp3";

import fuelScoopingVoicePath from "../../asset/sound/voice/FuelScoopingCharlotte.mp3";
import fuelScoopingCompleteVoicePath from "../../asset/sound/voice/FuelScoopingCompleteCharlotte.mp3";

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

export async function loadVoiceLines(
    progressCallback: (loadedCount: number, totalCount: number, lastItemName: string) => void
): Promise<SpeakerVoiceLines> {
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

    // Voice sounds
    const initiatingPlanetaryLandingSoundPromise = loadSoundAsync(
        "InitiatingPlanetaryLanding",
        initiatingPlanetaryLandingSoundPath
    );
    const landingRequestGrantedSoundPromise = loadSoundAsync("LandingRequestGranted", landingRequestSoundPath);
    const landingCompleteSoundPromise = loadSoundAsync("LandingComplete", landingCompleteSoundPath);
    const missionCompleteSoundPromise = loadSoundAsync("MissionComplete", missionCompleteSoundPath);
    const newDiscoverySoundPromise = loadSoundAsync("NewDiscovery", newDiscoverySoundPath);

    const cannotEngageWarpDriveSoundPromise = loadSoundAsync("CannotEngageWarpDrive", cannotEngageWarpDriveSoundPath);
    const warpDriveEmergencyShutDownSoundPromise = loadSoundAsync(
        "WarpDriveEmergencyShutDown",
        warpDriveEmergencyShutDownSoundPath
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
            fuelScoopingComplete: await fuelScoopingCompleteVoicePromise
        }
    };
}
