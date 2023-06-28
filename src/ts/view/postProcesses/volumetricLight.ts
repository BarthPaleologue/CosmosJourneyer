import { VolumetricLightScatteringPostProcess } from "@babylonjs/core/PostProcesses/volumetricLightScatteringPostProcess";
import { Star } from "../bodies/stellarObjects/star";
import { UberScene } from "../../controller/uberCore/uberScene";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";

export class VolumetricLight extends VolumetricLightScatteringPostProcess {
    readonly body: Star;

    private static ID = 0;

    constructor(star: Star, scene: UberScene) {
        super(`${star.name}VolumetricLight${VolumetricLight.ID++}`, 1, scene.getActiveUberCamera(), star.mesh, 100, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, scene);

        this.body = star;

        this.exposure = 0.26;
        this.decay = 0.95;
        this.getCamera().detachPostProcess(this); // this is necessary because we can't set the camera to null in the volumetric light scattering post process
    }

    public update(deltaTime: number): void {
        return;
    }
}
