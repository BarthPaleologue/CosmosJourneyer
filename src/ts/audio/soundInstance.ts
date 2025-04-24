import { Sound } from "@babylonjs/core/Audio/sound";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes";
import { moveTowards } from "../utils/math";

export class SoundInstance {
    readonly sound: Sound;

    private targetVolume;
    private targetPlaybackSpeed = 1;

    private blendSpeed = 0.5;

    private readonly volumeMultiplier: number;
    private readonly playbackSpeedMultiplier: number;

    private spatialVolumeMultiplier = 1;

    private localPosition: Vector3;

    private parent: TransformNode | null;

    private maskFactor = 1;

    private targetMaskFactor = 1;

    private readonly isPonctual: boolean;

    readonly mask: number;

    constructor(
        baseSound: Sound,
        mask: number,
        initialTargetVolume: number,
        isPonctual: boolean,
        parent: TransformNode | null
    ) {
        const clonedSound = baseSound.clone();
        if (clonedSound === null) throw new Error("Cloned sound was null!");
        this.sound = clonedSound;

        this.mask = mask;

        this.targetVolume = initialTargetVolume;

        this.volumeMultiplier = baseSound.getVolume();
        this.playbackSpeedMultiplier = baseSound.getPlaybackRate();

        this.sound.updateOptions({
            playbackRate: this.playbackSpeedMultiplier * this.targetPlaybackSpeed,
            volume: this.targetVolume * this.volumeMultiplier * this.maskFactor
        });

        this.isPonctual = isPonctual;

        this.localPosition = Vector3.Zero();
        this.parent = parent;
    }

    setLocalPosition(localPosition: Vector3) {
        this.localPosition = localPosition;
    }

    setParent(parent: TransformNode | null) {
        this.parent = parent;
    }

    setTargetVolume(volume: number, blendSpeed = this.blendSpeed) {
        this.targetVolume = volume;
        this.setBlendSpeed(blendSpeed);
    }

    setBlendSpeed(speed: number) {
        this.blendSpeed = speed;
    }

    setMaskFactor(factor: number) {
        this.targetMaskFactor = factor;
    }

    update(deltaSeconds: number) {
        this.maskFactor = moveTowards(this.maskFactor, this.targetMaskFactor, this.blendSpeed * deltaSeconds);
        if (this.maskFactor === 0) {
            this.sound.stop();
        } else if (!this.sound.isPlaying && !this.isPonctual) {
            this.sound.play();
        }

        this.sound.setVolume(
            moveTowards(
                this.sound.getVolume(),
                this.targetVolume * this.volumeMultiplier * this.spatialVolumeMultiplier * this.maskFactor,
                this.blendSpeed * deltaSeconds
            )
        );
        this.sound.setPlaybackRate(
            moveTowards(
                this.sound.getPlaybackRate(),
                this.targetPlaybackSpeed * this.playbackSpeedMultiplier,
                this.blendSpeed * deltaSeconds
            )
        );

        /*if (this.parent !== null) {
            const worldPosition = Vector3.TransformCoordinates(this.localPosition, this.parent.getWorldMatrix());
            const camera = this.parent.getScene().activeCamera;
            if (camera === null) throw new Error("No active camera");
            const worldCameraPosition = Vector3.TransformCoordinates(camera.position, this.parent.getWorldMatrix());
            const distance = Vector3.Distance(worldCameraPosition, worldPosition);
            this.spatialVolumeMultiplier = 1 / (1 + 0.01 * distance);
        }*/
    }

    dispose() {
        this.sound.dispose();
    }
}
