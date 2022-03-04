import {PostProcess, Mesh, Light, Scene, Camera, Effect, Axis, Vector3, Texture} from "@babylonjs/core";

import { PlayerController } from "../player/playerController";

interface StarfieldSettings {

}

export class StarfieldPostProcess extends PostProcess {

    settings: StarfieldSettings;
    camera: Camera;

    internalTime = 0;

    constructor(name: string, player: PlayerController, sun: Mesh | Light, scene: Scene) {
        super(name, "./shaders/starfield", [
            "sunPosition",
            "cameraPosition",

            "projection",
            "view",
            "transform",

            "cameraNear",
            "cameraFar",

            "visibility",

            "time"
        ], [
            "textureSampler",
            "depthSampler",
        ], 1, player.camera, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);

        this.camera = player.camera;

        this.setCamera(this.camera);

        this.settings = {};

        let depthMap = scene.customRenderTargets[0];

        this.onApply = (effect: Effect) => {
            this.internalTime += this.getEngine().getDeltaTime();

            effect.setTexture("depthSampler", depthMap);

            effect.setVector3("cameraPosition", this.camera.position);

            let vis = 1.0 - Vector3.Dot(sun.getAbsolutePosition().normalizeToNew(), this.camera.getDirection(Axis.Z));
            vis /= 2;

            effect.setFloat("visibility", vis);

            effect.setMatrix("projection", this.camera.getProjectionMatrix());
            effect.setMatrix("view", this.camera.getViewMatrix());

            effect.setFloat("cameraNear", this.camera.minZ);
            effect.setFloat("cameraFar", this.camera.maxZ);

            effect.setFloat("time", this.internalTime);
        };
    }

    setCamera(camera: Camera) {
        this.camera.detachPostProcess(this);
        this.camera = camera;
        camera.attachPostProcess(this);
    }
}