import {PostProcess, Camera, Scene, DepthRenderer} from "@babylonjs/core";

export class DepthPostProcess extends PostProcess {

    constructor(name: string, camera: Camera, scene: Scene) {
        super(name, "./shaders/depth", [
            "cameraNear",
            "cameraFar"
        ], [
            "depthSampler",
        ], 1.0, camera);

        let depthRenderer = new DepthRenderer(scene, 1, camera, false);
        scene.customRenderTargets.push(depthRenderer.getDepthMap());

        this.onBeforeRender = (effect) => {
            effect.setTexture("depthSampler", depthRenderer.getDepthMap());
            effect.setFloat("cameraNear", camera.minZ);
            effect.setFloat("cameraFar", camera.maxZ);
        };
    }
}