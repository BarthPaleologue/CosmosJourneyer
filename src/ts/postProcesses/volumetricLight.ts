import { Texture, VolumetricLightScatteringPostProcess } from "@babylonjs/core";
import { Star } from "../bodies/stars/star";
import { UberScene } from "../core/uberScene";

export class VolumetricLight extends VolumetricLightScatteringPostProcess {
    readonly body: Star;

    constructor(star: Star, scene: UberScene) {
        super(`${star.name}VolumetricLight`, 1, scene.getActiveUberCamera(), star.mesh, 100, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, scene);

        this.body = star;

        this.exposure = 0.26;
        this.decay = 0.95;
        this.getCamera().detachPostProcess(this);
    }

    public update(deltaTime: number): void {
        return;
    }
}
