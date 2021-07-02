export class OceanPostProcess extends BABYLON.PostProcess {
    constructor(name, planet, oceanRadius, sun, camera, scene) {
        super(name, "./shaders/ocean", [
            "sunPosition",
            "cameraPosition",
            "projection",
            "view",
            "transform",
            "cameraNear",
            "cameraFar",
            "cameraDirection",
            "planetPosition",
            "planetRadius",
            "oceanRadius",
            "smoothness",
            "specularPower",
            "alphaModifier",
            "depthModifier"
        ], [
            "textureSampler",
            "depthSampler",
            "normalMap"
        ], 1, camera, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);
        this.settings = {
            oceanRadius: oceanRadius,
            depthModifier: 1.0,
            alphaModifier: 0.1,
            specularPower: 2,
            smoothness: 0.9,
        };
        this.camera = camera;
        this.sun = sun;
        this.planet = planet;
        this.setCamera(this.camera);
        let depthRenderer = new BABYLON.DepthRenderer(scene);
        scene.customRenderTargets.push(depthRenderer.getDepthMap());
        let depthMap = scene.customRenderTargets[0];
        //this.getEffect().setTexture("normalMap", new BABYLON.Texture("./textures/waternormal.jpg", scene));
        this.onApply = (effect) => {
            effect.setTexture("depthSampler", depthMap);
            effect.setTexture("normalMap", new BABYLON.Texture("./textures/waterbump.png", scene));
            effect.setVector3("sunPosition", this.sun.getAbsolutePosition());
            effect.setVector3("cameraPosition", this.camera.position);
            effect.setVector3("planetPosition", this.planet.position);
            effect.setMatrix("projection", this.camera.getProjectionMatrix());
            effect.setMatrix("view", this.camera.getViewMatrix());
            effect.setMatrix("transform", this.camera.getTransformationMatrix());
            effect.setFloat("cameraNear", camera.minZ);
            effect.setFloat("cameraFar", camera.maxZ);
            effect.setVector3("cameraDirection", camera.getDirection(BABYLON.Axis.Z));
            effect.setFloat("oceanRadius", this.settings.oceanRadius);
            effect.setFloat("smoothness", this.settings.smoothness);
            effect.setFloat("specularPower", this.settings.specularPower);
            effect.setFloat("alphaModifier", this.settings.alphaModifier);
            effect.setFloat("depthModifier", this.settings.depthModifier);
        };
    }
    setCamera(camera) {
        this.camera.detachPostProcess(this);
        this.camera = camera;
        camera.attachPostProcess(this);
    }
}
