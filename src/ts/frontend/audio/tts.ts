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

import { type Sound } from "@babylonjs/core/Audio/sound";

import { type SpeakerVoiceLines, type VoiceLines } from "@/frontend/assets/audio/voiceLines";

export const enum Speaker {
    CHARLOTTE,
}

export const enum VoiceLine {
    INITIATING_PLANETARY_LANDING,
    LANDING_REQUEST_GRANTED,
    LANDING_COMPLETE,
    MISSION_COMPLETE,
    NEW_DISCOVERY,
    CANNOT_ENGAGE_WARP_DRIVE,
    WARP_DRIVE_EMERGENCY_SHUT_DOWN,
    WARP_DRIVE_DISENGAGED,
    ENGAGING_WARP_DRIVE,
    FUEL_SCOOPING,
    FUEL_SCOOPING_COMPLETE,
}

export interface ITts {
    sayNow(speaker: Speaker, line: VoiceLine): void;
    enqueueSay(speaker: Speaker, line: VoiceLine): void;
    update(): void;
}

export class Tts implements ITts {
    private readonly voiceLines: SpeakerVoiceLines;

    private isPlaying = false;
    private soundQueue: Set<Sound> = new Set();

    constructor(voiceLines: SpeakerVoiceLines) {
        this.voiceLines = voiceLines;
    }

    private getLineFromVoiceLines(voiceLines: VoiceLines, line: VoiceLine): Sound {
        switch (line) {
            case VoiceLine.INITIATING_PLANETARY_LANDING:
                return voiceLines.initiatingPlanetaryLanding;
            case VoiceLine.LANDING_REQUEST_GRANTED:
                return voiceLines.landingRequestGranted;
            case VoiceLine.LANDING_COMPLETE:
                return voiceLines.landingComplete;
            case VoiceLine.MISSION_COMPLETE:
                return voiceLines.missionComplete;
            case VoiceLine.NEW_DISCOVERY:
                return voiceLines.newDiscovery;
            case VoiceLine.CANNOT_ENGAGE_WARP_DRIVE:
                return voiceLines.cannotEngageWarpDrive;
            case VoiceLine.WARP_DRIVE_EMERGENCY_SHUT_DOWN:
                return voiceLines.warpDriveEmergencyShutDown;
            case VoiceLine.WARP_DRIVE_DISENGAGED:
                return voiceLines.warpDriveDisengaged;
            case VoiceLine.ENGAGING_WARP_DRIVE:
                return voiceLines.engagingWarpDrive;
            case VoiceLine.FUEL_SCOOPING:
                return voiceLines.fuelScooping;
            case VoiceLine.FUEL_SCOOPING_COMPLETE:
                return voiceLines.fuelScoopingComplete;
        }
    }

    private getVoiceLinesFromSpeaker(speaker: Speaker): VoiceLines {
        switch (speaker) {
            case Speaker.CHARLOTTE:
                return this.voiceLines.charlotte;
        }
    }

    public sayNow(speaker: Speaker, line: VoiceLine) {
        this.getLineFromVoiceLines(this.getVoiceLinesFromSpeaker(speaker), line).play();
    }

    public enqueueSay(speaker: Speaker, line: VoiceLine) {
        this.soundQueue.add(this.getLineFromVoiceLines(this.getVoiceLinesFromSpeaker(speaker), line));
    }

    public update(): void {
        if (this.isPlaying) {
            return;
        }

        const nextSound = this.soundQueue.values().next().value;
        if (nextSound === undefined) {
            return;
        }

        this.soundQueue.delete(nextSound);

        this.isPlaying = true;
        nextSound.play();

        nextSound.onEndedObservable.addOnce(() => {
            this.isPlaying = false;
        });
    }
}

export class TtsMock implements ITts {
    sayNow(): void {
        // No-op
    }

    enqueueSay(): void {
        // No-op
    }

    update(): void {
        // No-op
    }
}
