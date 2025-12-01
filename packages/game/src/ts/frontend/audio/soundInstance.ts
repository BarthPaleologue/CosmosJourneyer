import type { StaticSound } from "@babylonjs/core/AudioV2/abstractAudio/staticSound";
import type { IAudioParameterRampOptions } from "@babylonjs/core/AudioV2/audioParameter";

export interface ISoundInstance {
    play(): void;
    setVolume(volume: number, options?: Partial<IAudioParameterRampOptions>): void;
    setMaskFactor(factor: number, options?: Partial<IAudioParameterRampOptions>): void;
    getMask(): number;
    dispose(): void;
}

export type SoundInstanceOptions = {
    mask: number;
    initialTargetVolume: number;
    loop: boolean;
};

export class SoundInstance implements ISoundInstance {
    readonly sound: StaticSound;

    private targetVolume;

    private readonly volumeMultiplier: number;
    private readonly playbackSpeedMultiplier: number;

    private maskFactor = 1;

    readonly mask: number;

    private constructor(clonedSound: StaticSound, options?: Partial<SoundInstanceOptions>) {
        this.sound = clonedSound;

        this.mask = options?.mask ?? 0;

        this.targetVolume = options?.initialTargetVolume ?? 1;

        this.volumeMultiplier = clonedSound.volume;
        this.playbackSpeedMultiplier = clonedSound.playbackRate;

        this.sound.playbackRate = this.playbackSpeedMultiplier;
        this.sound.volume = this.targetVolume * this.volumeMultiplier * this.maskFactor;
        this.sound.loop = options?.loop ?? false;
    }

    static async New(baseSound: StaticSound, options?: Partial<SoundInstanceOptions>) {
        return new SoundInstance(await baseSound.cloneAsync(), options);
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
