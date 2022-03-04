import {PostProcess, Camera, Mesh, PointLight, Scene, Texture, Effect, Axis} from "@babylonjs/core";

interface CloudSettings {
    cloudLayerRadius: number,
    smoothness: number,
    specularPower: number,
    cloudFrequency: number,
    cloudDetailFrequency: number,
    cloudPower: number,
    worleySpeed: number,
    detailSpeed: number,
}

// TODO: faire une super classe pour tous ces post processes

import waterbump from "../../../asset/textures/cloudNormalMap.jpg";

export class FlatCloudsPostProcess extends PostProcess {

    settings: CloudSettings;
    camera: Camera;
    sun: Mesh | PointLight;
    planet: Mesh;

    internalTime = 0;

    constructor(name: string, planet: Mesh, planetRadius: number, waterLevel: number, cloudLayerRadius: number, sun: Mesh | PointLight, camera: Camera, scene: Scene) {
        super(name, "./shaders/flatClouds", [
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
            "cloudLayerRadius",
            "waterLevel",

            "cloudFrequency",
            "cloudDetailFrequency",
            "cloudPower",

            "worleySpeed",
            "detailSpeed",

            "smoothness",
            "specularPower",

            "planetWorldMatrix",

            "time"
        ], [
            "textureSampler",
            "depthSampler",
            "normalMap"
        ], 1, camera, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);


        this.settings = {
            cloudLayerRadius: cloudLayerRadius,
            specularPower: 2,
            smoothness: 0.9,
            cloudFrequency: 3,
            cloudDetailFrequency: 15.0,
            cloudPower: 5,
            worleySpeed: 0.5,
            detailSpeed: 1.0,
        };

        this.camera = camera;
        this.sun = sun;
        this.planet = planet;

        this.setCamera(this.camera);

        let depthMap = scene.customRenderTargets[0];

        this.onApply = (effect: Effect) => {
            this.internalTime += this.getEngine().getDeltaTime();

            effect.setTexture("depthSampler", depthMap);
            effect.setTexture("normalMap", new Texture(waterbump, scene));

            effect.setVector3("sunPosition", this.sun.getAbsolutePosition());
            effect.setVector3("cameraPosition", this.camera.position);

            effect.setVector3("planetPosition", this.planet.absolutePosition);
            effect.setFloat("planetRadius", planetRadius);
            effect.setFloat("waterLevel", waterLevel);

            effect.setMatrix("projection", this.camera.getProjectionMatrix());
            effect.setMatrix("view", this.camera.getViewMatrix());
            effect.setMatrix("transform", this.camera.getTransformationMatrix());

            effect.setFloat("cameraNear", camera.minZ);
            effect.setFloat("cameraFar", camera.maxZ);
            effect.setVector3("cameraDirection", camera.getDirection(Axis.Z));

            effect.setFloat("cloudLayerRadius", this.settings.cloudLayerRadius);

            effect.setFloat("cloudFrequency", this.settings.cloudFrequency);
            effect.setFloat("cloudDetailFrequency", this.settings.cloudDetailFrequency);
            effect.setFloat("cloudPower", this.settings.cloudPower);

            effect.setFloat("worleySpeed", this.settings.worleySpeed);
            effect.setFloat("detailSpeed", this.settings.detailSpeed);

            effect.setFloat("smoothness", this.settings.smoothness);
            effect.setFloat("specularPower", this.settings.specularPower);

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