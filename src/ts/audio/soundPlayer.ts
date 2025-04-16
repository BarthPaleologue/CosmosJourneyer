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
import { Sounds } from "../assets/sounds";

export const enum SoundType {
    CLICK,
    HOVER,
    SUCCESS,
    ERROR,
    WARNING,
    INFO,
    ENABLE_ORBIT_DISPLAY,
    DISABLE_ORBIT_DISPLAY,
    TARGET_LOCK,
    TARGET_UNLOCK,
    ITINERARY_COMPUTED
}

export interface ISoundPlayer {
    playNow(soundType: SoundType): void;
    enqueuePlay(soundType: SoundType): void;
    update(): void;
}

export class SoundPlayer implements ISoundPlayer {
    private readonly sounds: Sounds;

    private isPlaying = false;
    private soundQueue: Array<Sound> = [];

    constructor(sounds: Sounds) {
        this.sounds = sounds;
    }

    private getSoundFromType(soundType: SoundType): Sound {
        switch (soundType) {
            case SoundType.CLICK:
            case SoundType.WARNING:
            case SoundType.INFO:
                return this.sounds.menuSelect;
            case SoundType.SUCCESS:
                return this.sounds.success;
            case SoundType.ERROR:
                return this.sounds.error;
            case SoundType.HOVER:
            case SoundType.ENABLE_ORBIT_DISPLAY:
            case SoundType.DISABLE_ORBIT_DISPLAY:
                return this.sounds.menuHover;
            case SoundType.TARGET_LOCK:
                return this.sounds.targetLock;
            case SoundType.TARGET_UNLOCK:
            case SoundType.ITINERARY_COMPUTED:
                return this.sounds.targetUnlock;
        }
    }

    public playNow(soundType: SoundType): void {
        this.getSoundFromType(soundType).play();
    }

    public enqueuePlay(soundType: SoundType): void {
        this.soundQueue.push(this.getSoundFromType(soundType));
    }

    public update(): void {
        if (this.isPlaying) {
            return;
        }

        const nextSound = this.soundQueue.shift();
        if (nextSound === undefined) {
            return;
        }

        this.isPlaying = true;
        nextSound.play();

        nextSound.onEndedObservable.addOnce(() => {
            this.isPlaying = false;
        });
    }
}

export class SoundPlayerMock implements ISoundPlayer {
    playNow(): void {
        // No-op
    }

    enqueuePlay(): void {
        // No-op
    }

    update(): void {
        // No-op
    }
}
