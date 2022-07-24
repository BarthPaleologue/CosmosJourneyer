import { Mesh, Texture, VolumetricLightScatteringPostProcess } from "@babylonjs/core";
import { Star } from "../bodies/stars/star";
import { StarSystemManager } from "../bodies/starSystemManager";
import { IPostProcess } from "./iPostProcess";

export class VolumetricLight extends VolumetricLightScatteringPostProcess implements IPostProcess {
    constructor(star: Star, starMesh: Mesh, starSystem: StarSystemManager) {
        super(`${star.name}VolumetricLight`, 1, star.starSystem.scene.activeCamera!, starMesh, 100, Texture.BILINEAR_SAMPLINGMODE, star.starSystem.scene.getEngine());

        this.exposure = 0.26;
        this.decay = 0.95;
        this.getCamera().detachPostProcess(this);

        // the volumetric light must be attached manually as it is not a custom post process
        for (const pipeline of starSystem.pipelines) {
            pipeline.volumetricLights.push(this);
        }
    }

    public update(deltaTime : number): void {
        return;
    }
}