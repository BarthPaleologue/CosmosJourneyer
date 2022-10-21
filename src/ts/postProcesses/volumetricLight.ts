import { Mesh, Texture, VolumetricLightScatteringPostProcess } from "@babylonjs/core";
import { Star } from "../bodies/stars/star";
import { IPostProcess } from "./iPostProcess";
import { UberScene } from "../core/uberScene";
import { CrepuscularRays } from "./crepuscularRays";

export class VolumetricLight extends VolumetricLightScatteringPostProcess implements IPostProcess {
    constructor(star: Star, starMesh: Mesh, scene: UberScene) {
        super(`${star.name}VolumetricLight`, 1, scene.getActiveUberCamera(), starMesh, 100, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, scene);

        this.exposure = 0.26;
        this.decay = 0.95;
        this.getCamera().detachPostProcess(this);

        // the volumetric light must be attached manually as it is not a custom post process
        scene.uberRenderingPipeline.volumetricLights.push(this);

    }

    public update(deltaTime: number): void {
        return;
    }
}
