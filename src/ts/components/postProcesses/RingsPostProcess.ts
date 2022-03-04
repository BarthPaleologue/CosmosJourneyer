import {PostProcess, Camera, Scene, Mesh, PointLight, Effect, Texture} from "@babylonjs/core";

interface RingsSettings {
    ringStart: number;
    ringEnd: number;
    ringFrequency: number;
    ringOpacity: number;
}

export class RingsPostProcess extends PostProcess {

    settings: RingsSettings;
    camera: Camera;
    sun: Mesh | PointLight;
    planet: Mesh;

    internalTime = 0;

    constructor(name: string, planet: Mesh, planetRadius: number, waterLevel: number, sun: Mesh | PointLight, camera: Camera, scene: Scene) {
        super(name, "./shaders/rings", [
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
        ], 1, camera, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);


        this.settings = {
            ringStart: 1.5,
            ringEnd: 2.5,
            ringFrequency: 30.0,
            ringOpacity: 0.4
        };

        this.camera = camera;
        this.sun = sun;
        this.planet = planet;

        this.setCamera(this.camera);

        let depthMap = scene.customRenderTargets[0];

        this.onApply = (effect: Effect) => {
            this.internalTime += this.getEngine().getDeltaTime();

            effect.setTexture("depthSampler", depthMap);

            effect.setVector3("sunPosition", this.sun.getAbsolutePosition());
            effect.setVector3("cameraPosition", this.camera.position);

            effect.setVector3("planetPosition", this.planet.getAbsolutePosition());
            effect.setFloat("planetRadius", planetRadius);
            effect.setFloat("waterLevel", waterLevel);

            effect.setFloat("ringStart", this.settings.ringStart);
            effect.setFloat("ringEnd", this.settings.ringEnd);
            effect.setFloat("ringFrequency", this.settings.ringFrequency);
            effect.setFloat("ringOpacity", this.settings.ringOpacity);

            effect.setMatrix("projection", this.camera.getProjectionMatrix());
            effect.setMatrix("view", this.camera.getViewMatrix());

            effect.setFloat("cameraNear", camera.minZ);
            effect.setFloat("cameraFar", camera.maxZ);

            effect.setMatrix("planetWorldMatrix", this.planet.getWorldMatrix());

            effect.setFloat("time", this.internalTime);
        };
    }

    setCamera(camera: Camera) {
        this.camera.detachPostProcess(this);
        this.camera = camera;
        camera.attachPostProcess(this);
    }
}