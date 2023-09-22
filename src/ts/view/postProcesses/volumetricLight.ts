import { VolumetricLightScatteringPostProcess } from "@babylonjs/core/PostProcesses/volumetricLightScatteringPostProcess";
import { Star } from "../bodies/stellarObjects/star";
import { UberScene } from "../../controller/uberCore/uberScene";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { ObjectPostProcess, UpdatablePostProcess } from "./objectPostProcess";

export class VolumetricLight extends VolumetricLightScatteringPostProcess implements UpdatablePostProcess, ObjectPostProcess {
    readonly object: Star;

    private scene: UberScene;

    constructor(star: Star, scene: UberScene) {
        super(`${star.name}VolumetricLight`, 1, scene.getActiveUberCamera(), star.mesh, 100, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, scene);
        
        this.scene = scene;

        this.object = star;

        this.exposure = 0.26;
        this.decay = 0.95;

        this.getCamera().detachPostProcess(this);
    }

    public update(deltaTime: number): void {
        return;
    }

    public override dispose(): void {
        super.dispose(this.scene.getActiveUberCamera());
    }
}
