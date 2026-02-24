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

import type { StaticSound } from "@babylonjs/core/AudioV2/abstractAudio/staticSound";

import { type Sounds } from "@/frontend/assets/audio/sounds";

import { assertUnreachable } from "@/utils/types";

import { SoundInstance, SoundInstanceMock, type ISoundInstance, type SoundInstanceOptions } from "./soundInstance";

export type SoundType =
    | "click"
    | "hover"
    | "success"
    | "error"
    | "warning"
    | "info"
    | "enable_orbit_display"
    | "disable_orbit_display"
    | "target_lock"
    | "target_unlock"
    | "itinerary_computed"
    | "open_pause_menu"
    | "enable_warp_drive"
    | "disable_warp_drive"
    | "accelerating_warp_drive"
    | "decelerating_warp_drive"
    | "hyper_space"
    | "thruster";

export interface ISoundPlayer {
    playNow(soundType: SoundType): void;
    enqueuePlay(soundType: SoundType): void;
    createInstance(soundType: SoundType, options?: Partial<SoundInstanceOptions>): Promise<ISoundInstance>;
    freeInstance(instance: ISoundInstance): void;
    setInstanceMask(mask: number): void;
    update(): void;
}

export class SoundPlayer implements ISoundPlayer {
    private readonly sounds: Sounds;

    private isPlaying = false;
    private soundQueue: Array<StaticSound> = [];

    private readonly soundInstances: Set<ISoundInstance> = new Set();
    private soundInstanceMask = 0b1111;

    constructor(sounds: Sounds) {
        this.sounds = sounds;
    }

    private getSoundFromType(soundType: SoundType): StaticSound {
        switch (soundType) {
            case "click":
            case "warning":
            case "info":
                return this.sounds.menuSelect;
            case "success":
                return this.sounds.success;
            case "error":
                return this.sounds.error;
            case "hover":
            case "enable_orbit_display":
            case "disable_orbit_display":
                return this.sounds.menuHover;
            case "target_lock":
                return this.sounds.targetLock;
            case "target_unlock":
            case "itinerary_computed":
                return this.sounds.targetUnlock;
            case "open_pause_menu":
                return this.sounds.openPauseMenu;
            case "enable_warp_drive":
                return this.sounds.enableWarpDrive;
            case "disable_warp_drive":
                return this.sounds.disableWarpDrive;
            case "accelerating_warp_drive":
                return this.sounds.acceleratingWarpDrive;
            case "decelerating_warp_drive":
                return this.sounds.deceleratingWarpDrive;
            case "hyper_space":
                return this.sounds.hyperSpace;
            case "thruster":
                return this.sounds.thruster;
            default:
                return assertUnreachable(soundType);
        }
    }

    public playNow(soundType: SoundType): void {
        this.getSoundFromType(soundType).play();
    }

    public enqueuePlay(soundType: SoundType): void {
        this.soundQueue.push(this.getSoundFromType(soundType));
    }

    public async createInstance(
        soundType: SoundType,
        options?: Partial<SoundInstanceOptions>,
    ): Promise<ISoundInstance> {
        const sound = this.getSoundFromType(soundType);
        const instance = await SoundInstance.New(sound, options);
        this.soundInstances.add(instance);
        instance.setMaskFactor(((options?.mask ?? 0) & this.soundInstanceMask) !== 0 ? 1 : 0);
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
            soundInstance.setMaskFactor(isSoundEnabled ? 1 : 0, { duration: 0.1 });
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

    createInstance(): Promise<ISoundInstance> {
        return Promise.resolve(new SoundInstanceMock());
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
