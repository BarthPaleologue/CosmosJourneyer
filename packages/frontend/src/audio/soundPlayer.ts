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

import { type Sounds } from "@/frontend/assets/audio/sounds";

import { SoundInstance, SoundInstanceMock, type ISoundInstance } from "./soundInstance";

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
    ITINERARY_COMPUTED,
    OPEN_PAUSE_MENU,
    ENABLE_WARP_DRIVE,
    DISABLE_WARP_DRIVE,
    ACCELERATING_WARP_DRIVE,
    DECELERATING_WARP_DRIVE,
    HYPER_SPACE,
    THRUSTER,
}

export interface ISoundPlayer {
    playNow(soundType: SoundType): void;
    enqueuePlay(soundType: SoundType): void;
    createInstance(
        soundType: SoundType,
        mask: number,
        initialTargetVolume: number,
        isPonctual: boolean,
    ): ISoundInstance;
    freeInstance(instance: ISoundInstance): void;
    setInstanceMask(mask: number): void;
    update(): void;
}

export class SoundPlayer implements ISoundPlayer {
    private readonly sounds: Sounds;

    private isPlaying = false;
    private soundQueue: Array<Sound> = [];

    private readonly soundInstances: Set<ISoundInstance> = new Set();
    private soundInstanceMask = 0b1111;

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
            case SoundType.OPEN_PAUSE_MENU:
                return this.sounds.openPauseMenu;
            case SoundType.ENABLE_WARP_DRIVE:
                return this.sounds.enableWarpDrive;
            case SoundType.DISABLE_WARP_DRIVE:
                return this.sounds.disableWarpDrive;
            case SoundType.ACCELERATING_WARP_DRIVE:
                return this.sounds.acceleratingWarpDrive;
            case SoundType.DECELERATING_WARP_DRIVE:
                return this.sounds.deceleratingWarpDrive;
            case SoundType.HYPER_SPACE:
                return this.sounds.hyperSpace;
            case SoundType.THRUSTER:
                return this.sounds.thruster;
        }
    }

    public playNow(soundType: SoundType): void {
        this.getSoundFromType(soundType).play();
    }

    public enqueuePlay(soundType: SoundType): void {
        this.soundQueue.push(this.getSoundFromType(soundType));
    }

    public createInstance(
        soundType: SoundType,
        mask: number,
        initialTargetVolume: number,
        isPonctual: boolean,
    ): ISoundInstance {
        const sound = this.getSoundFromType(soundType);
        const instance = new SoundInstance(sound, mask, initialTargetVolume, isPonctual);
        this.soundInstances.add(instance);
        instance.setMaskFactor((mask & this.soundInstanceMask) !== 0 ? 1 : 0);
        return instance;
    }

    freeInstance(instance: ISoundInstance): void {
        this.soundInstances.delete(instance);
        instance.dispose();
    }

    public setInstanceMask(mask: number): void {
        this.soundInstanceMask = mask;
    }

    public update(): void {
        for (const soundInstance of this.soundInstances) {
            const isSoundEnabled = (soundInstance.getMask() & this.soundInstanceMask) !== 0;
            soundInstance.setMaskFactor(isSoundEnabled ? 1 : 0);
        }

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

    createInstance(): ISoundInstance {
        return new SoundInstanceMock();
    }

    freeInstance(): void {
        // No-op
    }

    setInstanceMask(): void {
        // No-op
    }

    update(): void {
        // No-op
    }
}
