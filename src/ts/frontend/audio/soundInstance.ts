import type { StaticSound } from "@babylonjs/core/AudioV2/abstractAudio/staticSound";
import type { IAudioParameterRampOptions } from "@babylonjs/core/AudioV2/audioParameter";

export interface ISoundInstance {
    play(): void;
    setVolume(volume: number, options?: Partial<IAudioParameterRampOptions>): void;
    setMaskFactor(factor: number, options?: Partial<IAudioParameterRampOptions>): void;
    getMask(): number;
    dispose(): void;
}

export class SoundInstance implements ISoundInstance {
    readonly sound: StaticSound;

    private targetVolume;

    private readonly volumeMultiplier: number;
    private readonly playbackSpeedMultiplier: number;

    private maskFactor = 1;

    readonly mask: number;

    private constructor(clonedSound: StaticSound, mask: number, initialTargetVolume: number, loop: boolean) {
        this.sound = clonedSound;

        this.mask = mask;

        this.targetVolume = initialTargetVolume;

        this.volumeMultiplier = clonedSound.volume;
        this.playbackSpeedMultiplier = clonedSound.playbackRate;

        this.sound.playbackRate = this.playbackSpeedMultiplier;
        this.sound.volume = this.targetVolume * this.volumeMultiplier;
        this.sound.loop = loop;
    }

    static async New(baseSound: StaticSound, mask: number, initialTargetVolume: number, loop: boolean) {
        return new SoundInstance(await baseSound.cloneAsync(), mask, initialTargetVolume, loop);
    }

    play(): void {
        this.sound.play();
    }

    setVolume(volume: number, options?: Partial<IAudioParameterRampOptions>) {
        this.targetVolume = volume;
        this.sound.setVolume(this.targetVolume * this.volumeMultiplier * this.maskFactor, options);
    }

    setMaskFactor(factor: number, options?: Partial<IAudioParameterRampOptions>) {
        this.maskFactor = factor;
        this.sound.setVolume(this.targetVolume * this.volumeMultiplier * this.maskFactor, options);
    }

    getMask(): number {
        return this.mask;
    }

    dispose() {
        this.sound.dispose();
    }
}

export class SoundInstanceMock implements ISoundInstance {
    play(): void {
        // No-op
    }

    setVolume(): void {
        // No-op
    }

    setMaskFactor(): void {
        // No-op
    }

    getMask(): number {
        return 0;
    }

    dispose(): void {
        // No-op
    }
}
