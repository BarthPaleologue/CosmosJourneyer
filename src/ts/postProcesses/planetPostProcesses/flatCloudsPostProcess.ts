import { Color3, Effect, Texture } from "@babylonjs/core";

import { CloudSettings, ShaderDataType, ShaderSamplerData, ShaderUniformData } from "../interfaces";
import normalMap from "../../../asset/textures/cloudNormalMap2.jpg";
import { PlanetPostProcess } from "../planetPostProcess";
import { AbstractPlanet } from "../../bodies/planets/abstractPlanet";
import { gcd } from "../../utils/math";

import flatCloudsFragment from "../../../shaders/flatCloudsFragment.glsl";
import { StarSystemManager } from "../../bodies/starSystemManager";

const shaderName = "flatClouds";
Effect.ShadersStore[`${shaderName}FragmentShader`] = flatCloudsFragment;

export class FlatCloudsPostProcess extends PlanetPostProcess {
    settings: CloudSettings;

    constructor(name: string, planet: AbstractPlanet, cloudLayerHeight: number, starSystem: StarSystemManager) {
        const settings: CloudSettings = {
            cloudLayerRadius: planet.getApparentRadius() + cloudLayerHeight,
            specularPower: 2,
            smoothness: 0.9,
            cloudFrequency: 4,
            cloudDetailFrequency: 20,
            cloudPower: 2,
            cloudSharpness: 7,
            cloudColor: new Color3(0.8, 0.8, 0.8),
            worleySpeed: 0.0005,
            detailSpeed: 0.003
        };

        const uniforms: ShaderUniformData = {
            cloudLayerRadius: {
                type: ShaderDataType.Float,
                get: () => {
                    return settings.cloudLayerRadius;
                }
            },
            cloudFrequency: {
                type: ShaderDataType.Float,
                get: () => {
                    return settings.cloudFrequency;
                }
            },
            cloudDetailFrequency: {
                type: ShaderDataType.Float,
                get: () => {
                    return settings.cloudDetailFrequency;
                }
            },
            cloudPower: {
                type: ShaderDataType.Float,
                get: () => {
                    return settings.cloudPower;
                }
            },
            cloudSharpness: {
                type: ShaderDataType.Float,
                get: () => {
                    return settings.cloudSharpness;
                }
            },
            cloudColor: {
                type: ShaderDataType.Color3,
                get: () => {
                    return settings.cloudColor;
                }
            },
            worleySpeed: {
                type: ShaderDataType.Float,
                get: () => {
                    return settings.worleySpeed;
                }
            },
            detailSpeed: {
                type: ShaderDataType.Float,
                get: () => {
                    return settings.detailSpeed;
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
            planetInverseRotationQuaternion: {
                type: ShaderDataType.Quaternion,
                get: () => {
                    return planet.getInverseRotationQuaternion();
                }
            },
            time: {
                type: ShaderDataType.Float,
                get: () => {
                    return this.internalTime % ((2 * Math.PI * gcd(this.settings.worleySpeed * 10000, this.settings.detailSpeed * 10000)) / this.settings.worleySpeed);
                }
            }
        };

        const samplers: ShaderSamplerData = {
            normalMap: {
                type: ShaderDataType.Texture,
                get: () => {
                    return new Texture(normalMap, starSystem.scene);
                }
            }
        };

        super(name, shaderName, uniforms, samplers, planet, starSystem.stars[0], starSystem.scene);

        this.settings = settings;

        starSystem.spaceRenderingPipeline.clouds.push(this);
    }
}
