import normalMap from "../../../asset/textures/cloudNormalMap3.jpg";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";

import { gcd } from "terrain-generation";

import flatCloudsFragment from "../../../shaders/flatCloudsFragment.glsl";
import { UberScene } from "../../controller/uberCore/uberScene";
import { UberPostProcess } from "../../controller/uberCore/postProcesses/uberPostProcess";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers, getStellarObjectsUniforms } from "./uniforms";
import { TelluricPlanemo } from "../bodies/planemos/telluricPlanemo";
import { ObjectPostProcess } from "./objectPostProcess";
import { StellarObject } from "../bodies/stellarObjects/stellarObject";
import { getInverseRotationQuaternion } from "../../controller/uberCore/transforms/basicTransform";
import {
    UniformEnumType,
    ShaderSamplers,
    ShaderUniforms,
    SamplerEnumType
} from "../../controller/uberCore/postProcesses/types";

const shaderName = "flatClouds";
Effect.ShadersStore[`${shaderName}FragmentShader`] = flatCloudsFragment;

export interface CloudUniforms {
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

export class FlatCloudsPostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly cloudUniforms: CloudUniforms;
    readonly object: TelluricPlanemo;

    constructor(name: string, planet: TelluricPlanemo, cloudLayerHeight: number, scene: UberScene, stellarObjects: StellarObject[]) {
        const cloudUniforms: CloudUniforms = {
            cloudLayerRadius: planet.getBoundingRadius() + cloudLayerHeight,
            specularPower: 2,
            smoothness: 0.7,
            cloudFrequency: 4,
            cloudDetailFrequency: 12,
            cloudCoverage: 0.8 * Math.exp(-planet.model.physicalProperties.waterAmount * planet.model.physicalProperties.pressure),
            cloudSharpness: 3.5,
            cloudColor: new Color3(0.8, 0.8, 0.8),
            worleySpeed: 0.0005,
            detailSpeed: 0.003
        };

        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(planet),
            ...getStellarObjectsUniforms(stellarObjects),
            ...getActiveCameraUniforms(scene),
            {
                name: "clouds.layerRadius",
                type: UniformEnumType.Float,
                get: () => {
                    return cloudUniforms.cloudLayerRadius;
                }
            },
            {
                name: "clouds.frequency",
                type: UniformEnumType.Float,
                get: () => {
                    return cloudUniforms.cloudFrequency;
                }
            },
            {
                name: "clouds.detailFrequency",
                type: UniformEnumType.Float,
                get: () => {
                    return cloudUniforms.cloudDetailFrequency;
                }
            },
            {
                name: "clouds.coverage",
                type: UniformEnumType.Float,
                get: () => {
                    return cloudUniforms.cloudCoverage;
                }
            },
            {
                name: "clouds.sharpness",
                type: UniformEnumType.Float,
                get: () => {
                    return cloudUniforms.cloudSharpness;
                }
            },
            {
                name: "clouds.color",
                type: UniformEnumType.Color3,
                get: () => {
                    return cloudUniforms.cloudColor;
                }
            },
            {
                name: "clouds.worleySpeed",
                type: UniformEnumType.Float,
                get: () => {
                    return cloudUniforms.worleySpeed;
                }
            },
            {
                name: "clouds.detailSpeed",
                type: UniformEnumType.Float,
                get: () => {
                    return cloudUniforms.detailSpeed;
                }
            },
            {
                name: "clouds.smoothness",
                type: UniformEnumType.Float,
                get: () => {
                    return cloudUniforms.smoothness;
                }
            },
            {
                name: "clouds.specularPower",
                type: UniformEnumType.Float,
                get: () => {
                    return cloudUniforms.specularPower;
                }
            },
            {
                name: "planetInverseRotationQuaternion",
                type: UniformEnumType.Quaternion,
                get: () => {
                    return getInverseRotationQuaternion(planet.transform);
                }
            },
            {
                name: "time",
                type: UniformEnumType.Float,
                get: () => {
                    return -this.internalTime % ((2 * Math.PI * gcd(this.cloudUniforms.worleySpeed * 10000, this.cloudUniforms.detailSpeed * 10000)) / this.cloudUniforms.worleySpeed);
                }
            }
        ];

        const samplers: ShaderSamplers = [
            ...getSamplers(scene),
            {
                name: "normalMap",
                type: SamplerEnumType.Texture,
                get: () => {
                    return new Texture(normalMap, scene);
                }
            }
        ];

        super(name, shaderName, uniforms, samplers, scene);

        this.object = planet;
        this.cloudUniforms = cloudUniforms;
    }
}
