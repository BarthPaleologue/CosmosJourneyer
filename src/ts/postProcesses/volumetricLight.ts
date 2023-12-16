import { VolumetricLightScatteringPostProcess } from "@babylonjs/core/PostProcesses/volumetricLightScatteringPostProcess";
import { UberScene } from "../uberCore/uberScene";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { ObjectPostProcess } from "./objectPostProcess";
import { Star } from "../stellarObjects/star/star";

export class VolumetricLight extends VolumetricLightScatteringPostProcess implements ObjectPostProcess {
    readonly object: Star;

    constructor(star: Star, scene: UberScene) {
        super(`${star.name}VolumetricLight`, 1, scene.getActiveUberCamera(), star.mesh, 100, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, scene);

        this.object = star;

        this.exposure = 0.26;
        this.decay = 0.95;

        this.getCamera().detachPostProcess(this);
    }

    public override dispose(): void {
        super.dispose(this.getCamera());
    }
}
