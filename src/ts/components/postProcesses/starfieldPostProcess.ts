interface StarfieldSettings {
    ringStart: number;
    ringEnd: number;
    ringFrequency: number;
    ringOpacity: number;
}

export class StarfieldPostProcess extends BABYLON.PostProcess {

    settings: StarfieldSettings;
    camera: BABYLON.Camera;

    internalTime = 0;

    constructor(name: string, camera: BABYLON.Camera, scene: BABYLON.Scene) {
        super(name, "./shaders/starfield", [
            "sunPosition",
            "cameraPosition",

            "projection",
            "view",
            "transform",

            "cameraNear",
            "cameraFar",

            "planetPosition",
            "planetRadius",
            "cloudLayerRadius",
            "waterLevel",

            "ringStart",
            "ringEnd",
            "ringFrequency",
            "ringOpacity",

            "planetWorldMatrix",

            "time"
        ], [
            "textureSampler",
            "depthSampler",
        ], 1, camera, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);


        this.settings = {
            ringStart: 1.5,
            ringEnd: 2.5,
            ringFrequency: 30.0,
            ringOpacity: 0.3
        };

        this.camera = camera;

        this.setCamera(this.camera);

        let depthMap = scene.customRenderTargets[0];

        this.onApply = (effect: BABYLON.Effect) => {
            this.internalTime += this.getEngine().getDeltaTime();

            effect.setTexture("depthSampler", depthMap);

            effect.setVector3("cameraPosition", this.camera.position);

            effect.setFloat("ringStart", this.settings.ringStart);
            effect.setFloat("ringEnd", this.settings.ringEnd);
            effect.setFloat("ringFrequency", this.settings.ringFrequency);
            effect.setFloat("ringOpacity", this.settings.ringOpacity);

            effect.setMatrix("projection", this.camera.getProjectionMatrix());
            effect.setMatrix("view", this.camera.getViewMatrix());

            effect.setFloat("cameraNear", camera.minZ);
            effect.setFloat("cameraFar", camera.maxZ);

            effect.setFloat("time", this.internalTime);
        };
    }

    setCamera(camera: BABYLON.Camera) {
        this.camera.detachPostProcess(this);
        this.camera = camera;
        camera.attachPostProcess(this);
    }
}