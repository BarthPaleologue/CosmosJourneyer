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

import type { AbstractSound } from "@babylonjs/core/AudioV2/abstractAudio/abstractSound";

import { type SpeakerVoiceLines, type VoiceLines } from "@/frontend/assets/audio/voiceLines";

import { assertUnreachable } from "@/utils/types";

export type Speaker = "Charlotte";

export type VoiceLine =
    | "initiating_planetary_landing"
    | "landing_request_granted"
    | "landing_complete"
    | "mission_complete"
    | "new_discovery"
    | "cannot_engage_warp_drive"
    | "warp_drive_emergency_shut_down"
    | "warp_drive_disengaged"
    | "engaging_warp_drive"
    | "fuel_scooping"
    | "fuel_scooping_complete"
    | "low_fuel_warning";

export interface ITts {
    sayNow(speaker: Speaker, line: VoiceLine): void;
    enqueueSay(speaker: Speaker, line: VoiceLine): void;
    update(): void;
}

export class Tts implements ITts {
    private readonly voiceLines: SpeakerVoiceLines;

    private isPlaying = false;
    private soundQueue: Set<AbstractSound> = new Set();

    constructor(voiceLines: SpeakerVoiceLines) {
        this.voiceLines = voiceLines;
    }

    private getLineFromVoiceLines(voiceLines: VoiceLines, line: VoiceLine): AbstractSound {
        switch (line) {
            case "initiating_planetary_landing":
                return voiceLines.initiatingPlanetaryLanding;
            case "landing_request_granted":
                return voiceLines.landingRequestGranted;
            case "landing_complete":
                return voiceLines.landingComplete;
            case "mission_complete":
                return voiceLines.missionComplete;
            case "new_discovery":
                return voiceLines.newDiscovery;
            case "cannot_engage_warp_drive":
                return voiceLines.cannotEngageWarpDrive;
            case "warp_drive_emergency_shut_down":
                return voiceLines.warpDriveEmergencyShutDown;
            case "warp_drive_disengaged":
                return voiceLines.warpDriveDisengaged;
            case "engaging_warp_drive":
                return voiceLines.engagingWarpDrive;
            case "fuel_scooping":
                return voiceLines.fuelScooping;
            case "fuel_scooping_complete":
                return voiceLines.fuelScoopingComplete;
            case "low_fuel_warning":
                return voiceLines.lowFuelWarning;
            default:
                return assertUnreachable(line);
        }
    }

    private getVoiceLinesFromSpeaker(speaker: Speaker): VoiceLines {
        switch (speaker) {
            case "Charlotte":
                return this.voiceLines.charlotte;
            default:
                return assertUnreachable(speaker);
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
