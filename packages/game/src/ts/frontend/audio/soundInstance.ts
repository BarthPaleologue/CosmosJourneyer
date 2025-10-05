import { type Sound } from "@babylonjs/core/Audio/sound";

export interface ISoundInstance {
    play(): void;
    setVolume(volume: number): void;
    setMaskFactor(factor: number): void;
    getMask(): number;
    dispose(): void;
}

export class SoundInstance implements ISoundInstance {
    readonly sound: Sound;

    private targetVolume;

    private readonly volumeMultiplier: number;
    private readonly playbackSpeedMultiplier: number;

    private maskFactor = 1;

    readonly mask: number;

    constructor(baseSound: Sound, mask: number, initialTargetVolume: number, playOnce: boolean) {
        const clonedSound = baseSound.clone();
        if (clonedSound === null) throw new Error("Cloned sound was null!");
        this.sound = clonedSound;

        this.mask = mask;

        this.targetVolume = initialTargetVolume;

        this.volumeMultiplier = baseSound.getVolume();
        this.playbackSpeedMultiplier = baseSound.getPlaybackRate();

        this.sound.updateOptions({
            playbackRate: this.playbackSpeedMultiplier,
            volume: this.targetVolume * this.volumeMultiplier * this.maskFactor,
            loop: !playOnce,
        });
    }

    play(): void {
        this.sound.play();
    }

    setVolume(volume: number) {
        this.targetVolume = volume;
        this.sound.setVolume(this.targetVolume * this.volumeMultiplier * this.maskFactor, 0.5);
    }

    setMaskFactor(factor: number) {
        this.maskFactor = factor;
        this.sound.setVolume(this.targetVolume * this.volumeMultiplier * this.maskFactor, 0.5);
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
