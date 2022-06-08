import { Effect, Scene } from "@babylonjs/core";

import { OceanSettings, ShaderDataType, ShaderSamplerData, ShaderUniformData } from "../interfaces";
import { PlanetPostProcess } from "../planetPostProcess";
import { Star } from "../../celestialBodies/stars/star";
import { AbstractPlanet } from "../../celestialBodies/planets/abstractPlanet";

import oceanFragment from "../../../shaders/oceanFragment.glsl";
import { Assets } from "../../assets";

const shaderName = "ocean";
Effect.ShadersStore[`${shaderName}FragmentShader`] = oceanFragment;

export class OceanPostProcess extends PlanetPostProcess {
    settings: OceanSettings;

    constructor(name: string, planet: AbstractPlanet, sun: Star, scene: Scene) {
        let settings: OceanSettings = {
            oceanRadius: planet.getApparentRadius(),
            depthModifier: 0.002,
            alphaModifier: 0.007,
            specularPower: 1.5,
            smoothness: 0.9,
            waveBlendingSharpness: 0.1
        };

        let uniforms: ShaderUniformData = {
            oceanRadius: {
                type: ShaderDataType.Float,
                get: () => {
                    return settings.oceanRadius;
                }
            },

            smoothness: {
                type: ShaderDataType.Float,
                get: () => {
                    return settings.smoothness;
                }
            },
            specularPower: {
                type: ShaderDataType.Float,
                get: () => {
                    return settings.specularPower;
                }
            },
            alphaModifier: {
                type: ShaderDataType.Float,
                get: () => {
                    return settings.alphaModifier;
                }
            },
            depthModifier: {
                type: ShaderDataType.Float,
                get: () => {
                    return settings.depthModifier;
                }
            },
            waveBlendingSharpness: {
                type: ShaderDataType.Float,
                get: () => {
                    return settings.waveBlendingSharpness;
                }
            },
            planetInverseRotationQuaternion: {
                type: ShaderDataType.Quaternion,
                get: () => {
                    return planet.getInverseRotationQuaternion();
                }
            },
            time: {
                type: ShaderDataType.Float,
                get: () => {
                    //TODO: do not hardcode the 100000
                    // use rotating time offset to prevent float imprecision and distant artifacts
                    return this.internalTime % 100000;
                }
            }
        };

        let samplers: ShaderSamplerData = {
            normalMap1: {
                type: ShaderDataType.Texture,
                get: () => {
                    return Assets.WaterNormalMap1!;
                }
            },
            normalMap2: {
                type: ShaderDataType.Texture,
                get: () => {
                    return Assets.WaterNormalMap2!;
                }
            }
        };

        super(name, shaderName, uniforms, samplers, planet, sun, scene);

        this.settings = settings;
    }
}
