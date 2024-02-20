import { Sound } from "@babylonjs/core/Audio/sound";
import { moveTowards } from "./moveTowards";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes";

export class AudioInstance {
    readonly sound: Sound;

    private targetVolume = 1;
    private targetPlaybackSpeed = 1;

    private blendSpeed = 0.5;

    private readonly volumeMultiplier: number;
    private readonly playbackSpeedMultiplier: number;

    private spatialVolumeMultiplier = 1;

    private localPosition: Vector3;

    private parent: TransformNode | null;

    constructor(baseSound: Sound, localPosition: Vector3, parent: TransformNode | null) {
        const clonedSound = baseSound.clone();
        if (clonedSound === null) throw new Error("Cloned sound was null!");
        this.sound = clonedSound;

        this.volumeMultiplier = baseSound.getVolume();
        this.playbackSpeedMultiplier = baseSound.getPlaybackRate();

        this.sound.updateOptions({
            playbackRate: this.playbackSpeedMultiplier
        });

        this.localPosition = localPosition;
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

    muteInstantly() {
        this.sound.setVolume(0);
    }

    update(deltaSeconds: number) {
        if (this.blendSpeed === 0) {
            this.sound.setVolume(this.targetVolume * this.volumeMultiplier);
            this.sound.setPlaybackRate(this.targetPlaybackSpeed);
        } else {
            this.sound.setVolume(moveTowards(this.sound.getVolume(), this.targetVolume * this.volumeMultiplier * this.spatialVolumeMultiplier, this.blendSpeed * deltaSeconds));
            this.sound.setPlaybackRate(moveTowards(this.sound.getPlaybackRate(), this.targetPlaybackSpeed * this.playbackSpeedMultiplier, this.blendSpeed * deltaSeconds));
        }

        if (this.parent !== null) {
            const worldPosition = Vector3.TransformCoordinates(this.localPosition, this.parent.getWorldMatrix());
            const camera = this.parent.getScene().activeCamera;
            if(camera === null) throw new Error("No active camera");
            const worldCameraPosition = Vector3.TransformCoordinates(camera.position, this.parent.getWorldMatrix());
            const distance = Vector3.Distance(worldCameraPosition, worldPosition);
            this.spatialVolumeMultiplier = 1 / (1 + 0.01 * distance);
        }
    }
}
