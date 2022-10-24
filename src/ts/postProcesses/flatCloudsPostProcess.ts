import { Color3, Effect, Texture } from "@babylonjs/core";

import normalMap from "../../asset/textures/cloudNormalMap3.jpg";
import { gcd } from "../utils/gradientMath";

import flatCloudsFragment from "../../shaders/flatCloudsFragment.glsl";
import { UberScene } from "../core/uberScene";
import { ShaderDataType, ShaderSamplers, ShaderUniforms, UberPostProcess } from "../core/postProcesses/uberPostProcess";
import { getActiveCameraUniforms, getBodyUniforms, getSamplers, getStarsUniforms } from "./uniforms";
import { TelluricPlanet } from "../bodies/planets/telluricPlanet";
import { BlackHole } from "../bodies/blackHole";
import { Star } from "../bodies/stars/star";

const shaderName = "flatClouds";
Effect.ShadersStore[`${shaderName}FragmentShader`] = flatCloudsFragment;

export interface CloudSettings {
    cloudLayerRadius: number;
    smoothness: number;
    specularPower: number;
    cloudFrequency: number;
    cloudDetailFrequency: number;
    cloudCoverage: number;
    cloudSharpness: number;
    cloudColor: Color3;
    worleySpeed: number;
    detailSpeed: number;
}

export class FlatCloudsPostProcess extends UberPostProcess {
    readonly planet;
    settings: CloudSettings;

    constructor(name: string, planet: TelluricPlanet, cloudLayerHeight: number, scene: UberScene, stars: (Star | BlackHole)[]) {
        const settings: CloudSettings = {
            cloudLayerRadius: planet.getApparentRadius() + cloudLayerHeight,
            specularPower: 2,
            smoothness: 0.9,
            cloudFrequency: 4,
            cloudDetailFrequency: 20,
            cloudCoverage: 0.8 * Math.exp(-planet.physicalProperties.waterAmount * planet.physicalProperties.pressure),
            cloudSharpness: 3.5,
            cloudColor: new Color3(0.8, 0.8, 0.8),
            worleySpeed: 0.0005,
            detailSpeed: 0.003
        };

        const uniforms: ShaderUniforms = [
            ...getBodyUniforms(planet),
            ...getStarsUniforms(stars),
            ...getActiveCameraUniforms(scene),
            {
                name: "cloudLayerRadius",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.cloudLayerRadius;
                }
            },
            {
                name: "cloudFrequency",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.cloudFrequency;
                }
            },
            {
                name: "cloudDetailFrequency",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.cloudDetailFrequency;
                }
            },
            {
                name: "cloudCoverage",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.cloudCoverage;
                }
            },
            {
                name: "cloudSharpness",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.cloudSharpness;
                }
            },
            {
                name: "cloudColor",
                type: ShaderDataType.Color3,
                get: () => {
                    return settings.cloudColor;
                }
            },
            {
                name: "worleySpeed",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.worleySpeed;
                }
            },
            {
                name: "detailSpeed",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.detailSpeed;
                }
            },
            {
                name: "smoothness",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.smoothness;
                }
            },
            {
                name: "specularPower",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.specularPower;
                }
            },
            {
                name: "planetInverseRotationQuaternion",
                type: ShaderDataType.Quaternion,
                get: () => {
                    return planet.getInverseRotationQuaternion();
                }
            },
            {
                name: "time",
                type: ShaderDataType.Float,
                get: () => {
                    return this.internalTime % ((2 * Math.PI * gcd(this.settings.worleySpeed * 10000, this.settings.detailSpeed * 10000)) / this.settings.worleySpeed);
                }
            }
        ];

        const samplers: ShaderSamplers = [
            ...getSamplers(scene),
            {
                name: "normalMap",
                type: ShaderDataType.Texture,
                get: () => {
                    return new Texture(normalMap, scene);
                }
            }
        ];

        super(name, shaderName, uniforms, samplers, scene);

        this.settings = settings;
        this.planet = planet;
    }
}
