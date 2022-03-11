import {Camera, Mesh, PointLight, Scene, Texture, Effect, Axis} from "@babylonjs/core";

import waterbump from "../../../asset/textures/waterbump.png";
import {ExtendedPostProcess} from "./extendedPostProcess";

interface OceanSettings {
    oceanRadius: number,
    smoothness: number,
    specularPower: number,
    depthModifier: number,
    alphaModifier: number,
}

export class OceanPostProcess extends ExtendedPostProcess {

    settings: OceanSettings;
    camera: Camera;
    sun: Mesh | PointLight;
    planet: Mesh;

    internalTime = 0;

    constructor(name: string, planet: Mesh, oceanRadius: number, sun: Mesh | PointLight, camera: Camera, scene: Scene) {
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
            "depthModifier",

            "planetWorldMatrix",

            "time"
        ], [
            "textureSampler",
            "depthSampler",
            "normalMap"
        ], camera);


        this.settings = {
            oceanRadius: oceanRadius,
            depthModifier: 0.002,
            alphaModifier: 0.007,
            specularPower: 2,
            smoothness: 0.9,
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

            effect.setMatrix("projection", this.camera.getProjectionMatrix());
            effect.setMatrix("view", this.camera.getViewMatrix());
            effect.setMatrix("transform", this.camera.getTransformationMatrix());

            effect.setFloat("cameraNear", camera.minZ);
            effect.setFloat("cameraFar", camera.maxZ);
            effect.setVector3("cameraDirection", camera.getDirection(Axis.Z));

            effect.setFloat("oceanRadius", this.settings.oceanRadius);

            effect.setFloat("smoothness", this.settings.smoothness);
            effect.setFloat("specularPower", this.settings.specularPower);
            effect.setFloat("alphaModifier", this.settings.alphaModifier);
            effect.setFloat("depthModifier", this.settings.depthModifier);

            effect.setMatrix("planetWorldMatrix", this.planet.getWorldMatrix());

            effect.setFloat("time", this.internalTime);
        };
    }
}