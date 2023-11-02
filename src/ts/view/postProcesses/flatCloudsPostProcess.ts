import { Effect } from "@babylonjs/core/Materials/effect";
import { Color3 } from "@babylonjs/core/Maths/math.color";

import { gcd } from "terrain-generation";

import flatCloudsFragment from "../../../shaders/flatCloudsFragment.glsl";
import { UberScene } from "../../controller/uberCore/uberScene";
import { UberPostProcess } from "../../controller/uberCore/postProcesses/uberPostProcess";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers, getStellarObjectsUniforms } from "./uniforms";
import { TelluricPlanemo } from "../bodies/planemos/telluricPlanemo";
import { ObjectPostProcess } from "./objectPostProcess";
import { StellarObject } from "../bodies/stellarObjects/stellarObject";
import { getInverseRotationQuaternion } from "../../controller/uberCore/transforms/basicTransform";
import { UniformEnumType, ShaderSamplers, ShaderUniforms } from "../../controller/uberCore/postProcesses/types";

const shaderName = "flatClouds";
Effect.ShadersStore[`${shaderName}FragmentShader`] = flatCloudsFragment;

export interface CloudUniforms {
    layerRadius: number;
    smoothness: number;
    specularPower: number;
    frequency: number;
    detailFrequency: number;
    coverage: number;
    sharpness: number;
    color: Color3;
    worleySpeed: number;
    detailSpeed: number;
}

export class FlatCloudsPostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly cloudUniforms: CloudUniforms;
    readonly object: TelluricPlanemo;

    constructor(name: string, planet: TelluricPlanemo, cloudLayerHeight: number, scene: UberScene, stellarObjects: StellarObject[]) {
        const cloudUniforms: CloudUniforms = {
            layerRadius: planet.getBoundingRadius() + cloudLayerHeight,
            specularPower: 2,
            smoothness: 0.7,
            frequency: 4,
            detailFrequency: 12,
            coverage: 0.8 * Math.exp(-planet.model.physicalProperties.waterAmount * planet.model.physicalProperties.pressure),
            sharpness: 3.5,
            color: new Color3(0.8, 0.8, 0.8),
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
                    return cloudUniforms.layerRadius;
                }
            },
            {
                name: "clouds.frequency",
                type: UniformEnumType.Float,
                get: () => {
                    return cloudUniforms.frequency;
                }
            },
            {
                name: "clouds.detailFrequency",
                type: UniformEnumType.Float,
                get: () => {
                    return cloudUniforms.detailFrequency;
                }
            },
            {
                name: "clouds.coverage",
                type: UniformEnumType.Float,
                get: () => {
                    return cloudUniforms.coverage;
                }
            },
            {
                name: "clouds.sharpness",
                type: UniformEnumType.Float,
                get: () => {
                    return cloudUniforms.sharpness;
                }
            },
            {
                name: "clouds.color",
                type: UniformEnumType.Color3,
                get: () => {
                    return cloudUniforms.color;
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
                name: "time",
                type: UniformEnumType.Float,
                get: () => {
                    return (
                        -this.internalTime % ((2 * Math.PI * gcd(this.cloudUniforms.worleySpeed * 10000, this.cloudUniforms.detailSpeed * 10000)) / this.cloudUniforms.worleySpeed)
                    );
                }
            }
        ];

        const samplers: ShaderSamplers = getSamplers(scene);

        super(name, shaderName, uniforms, samplers, scene);

        this.object = planet;
        this.cloudUniforms = cloudUniforms;
    }
}
