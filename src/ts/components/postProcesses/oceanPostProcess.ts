import {Axis, Camera, Mesh, PointLight, Scene, Texture} from "@babylonjs/core";

import waterbump from "../../../asset/textures/waterbump.png";
import {ExtendedPostProcess} from "./extendedPostProcess";
import {SolidPlanet} from "../celestialBodies/planets/solid/solidPlanet";
import {OceanSettings, ShaderDataType, ShaderSamplerData, ShaderUniformData} from "./interfaces";

export class OceanPostProcess extends ExtendedPostProcess {

    settings: OceanSettings;

    internalTime: number;

    constructor(name: string, planet: SolidPlanet, oceanRadius: number, sun: Mesh | PointLight, camera: Camera, scene: Scene) {

        let settings = {
            oceanRadius: oceanRadius,
            depthModifier: 0.002,
            alphaModifier: 0.007,
            specularPower: 2,
            smoothness: 0.9,
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
            "oceanRadius": {
                type: ShaderDataType.Float,
                get: () => {return settings.oceanRadius}
            },

            "smoothness": {
                type: ShaderDataType.Float,
                get: () => {return settings.smoothness}
            },
            "specularPower": {
                type: ShaderDataType.Float,
                get: () => {return settings.specularPower}
            },
            "alphaModifier": {
                type: ShaderDataType.Float,
                get: () => {return settings.alphaModifier}
            },
            "depthModifier": {
                type: ShaderDataType.Float,
                get: () => {return settings.depthModifier}
            },

            "planetWorldMatrix": {
                type: ShaderDataType.Matrix,
                get: () => {return planet.getWorldMatrix()}
            },

            "time": {
                type: ShaderDataType.Float,
                get: () => {
                    this.internalTime += scene.getEngine().getDeltaTime() / 1000;
                    return this.internalTime;
                }
            }
        };

        let samplers: ShaderSamplerData = {
            "normalMap": {
                type: ShaderDataType.Texture,
                get: () => {return new Texture(waterbump, scene)}
            }
        }

        super(name, "./shaders/ocean", uniforms, samplers, camera, scene);

        this.internalTime = 0;

        this.settings = settings;
    }
}