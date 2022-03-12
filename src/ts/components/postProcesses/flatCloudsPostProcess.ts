import {Axis, Camera, Scene, Texture} from "@babylonjs/core";
import {ExtendedPostProcess} from "./extendedPostProcess";
import {CloudSettings, ShaderDataType, ShaderSamplerData, ShaderUniformData} from "./interfaces";
import {SolidPlanet} from "../celestialBodies/planets/solid/solidPlanet";
import waterbump from "../../../asset/textures/cloudNormalMap.jpg";
import {CelestialBody} from "../celestialBodies/celestialBody";

export class FlatCloudsPostProcess extends ExtendedPostProcess {

    settings: CloudSettings;

    internalTime: number;

    constructor(name: string, planet: SolidPlanet, cloudLayerRadius: number, sun: CelestialBody, camera: Camera, scene: Scene) {

        let settings = {
            cloudLayerRadius: cloudLayerRadius,
            specularPower: 2,
            smoothness: 0.9,
            cloudFrequency: 3,
            cloudDetailFrequency: 15.0,
            cloudPower: 5,
            worleySpeed: 0.5,
            detailSpeed: 1.0,
        };

        let uniforms: ShaderUniformData = {
            "sunPosition": {
                type: ShaderDataType.Vector3,
                get: () => {return sun.getAbsolutePosition()}
            },
            "planetPosition": {
                type: ShaderDataType.Vector3,
                get: () => {return planet.getAbsolutePosition()}
            },

            "cameraDirection": {
                type: ShaderDataType.Vector3,
                get: () => {return scene.activeCamera!.getDirection(Axis.Z)}
            },

            "planetRadius": {
                type: ShaderDataType.Float,
                get: () => {return planet.getRadius()}
            },
            "cloudLayerRadius": {
                type: ShaderDataType.Float,
                get: () => {return settings.cloudLayerRadius}
            },

            "cloudFrequency": {
                type: ShaderDataType.Float,
                get: () => {return settings.cloudFrequency}
            },
            "cloudDetailFrequency": {
                type: ShaderDataType.Float,
                get: () => {return settings.cloudDetailFrequency}
            },
            "cloudPower": {
                type: ShaderDataType.Float,
                get: () => {return settings.cloudPower}
            },

            "worleySpeed": {
                type: ShaderDataType.Float,
                get: () => {return settings.worleySpeed}
            },
            "detailSpeed": {
                type: ShaderDataType.Float,
                get: () => {return settings.detailSpeed}
            },

            "smoothness": {
                type: ShaderDataType.Float,
                get: () => {return settings.smoothness}
            },
            "specularPower": {
                type: ShaderDataType.Float,
                get: () => {return settings.specularPower}
            },

            "planetWorldMatrix": {
                type: ShaderDataType.Matrix,
                get: () => {return planet.getWorldMatrix()}
            },

            "time": {
                type: ShaderDataType.Float,
                get: () => {
                    this.internalTime += scene.getEngine().getDeltaTime() / 1000;
                    return this.internalTime
                }
            }
        };

        let samplers: ShaderSamplerData = {
            "normalMap": {
                type: ShaderDataType.Texture,
                get: () => {return new Texture(waterbump, scene)}
            }
        }

        super(name, "./shaders/flatClouds", uniforms, samplers, camera, scene);

        this.internalTime = 0;

        this.settings = settings;
    }
}