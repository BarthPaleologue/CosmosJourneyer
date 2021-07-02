export class DepthPostProcess extends BABYLON.PostProcess {
    constructor(name, camera, scene) {
        super(name, "./shaders/depth", [
            "cameraNear",
            "cameraFar"
        ], [
            "depthSampler",
        ], 1.0, camera);
        let depthRenderer = new BABYLON.DepthRenderer(scene, 1, camera, false);
        scene.customRenderTargets.push(depthRenderer.getDepthMap());
        this.onBeforeRender = (effect) => {
            effect.setTexture("depthSampler", depthRenderer.getDepthMap());
            effect.setFloat("cameraNear", camera.minZ);
            effect.setFloat("cameraFar", camera.maxZ);
        };
    }
}
