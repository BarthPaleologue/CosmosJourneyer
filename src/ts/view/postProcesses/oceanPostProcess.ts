import { Effect } from "@babylonjs/core/Materials/effect";

import oceanFragment from "../../../shaders/oceanFragment.glsl";
import { Assets } from "../../controller/assets";
import { UberScene } from "../../controller/uberCore/uberScene";
import { UberPostProcess } from "../../controller/uberCore/postProcesses/uberPostProcess";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers, getStellarObjectsUniforms } from "./uniforms";
import { TelluricPlanemo } from "../bodies/planemos/telluricPlanemo";
import { ObjectPostProcess } from "./objectPostProcess";
import { OrbitalObject } from "../common";
import { getInverseRotationQuaternion } from "../../controller/uberCore/transforms/basicTransform";
import { UniformEnumType, ShaderSamplers, ShaderUniforms, SamplerEnumType } from "../../controller/uberCore/postProcesses/types";

const shaderName = "ocean";
Effect.ShadersStore[`${shaderName}FragmentShader`] = oceanFragment;

export type OceanUniforms = {
    oceanRadius: number;
    smoothness: number;
    specularPower: number;
    depthModifier: number;
    alphaModifier: number;
    waveBlendingSharpness: number;
}

export class OceanPostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly oceanUniforms: OceanUniforms;
    readonly object: TelluricPlanemo;

    constructor(name: string, planet: TelluricPlanemo, scene: UberScene, stars: OrbitalObject[]) {
        const oceanUniforms: OceanUniforms = {
            oceanRadius: planet.getBoundingRadius(),
            depthModifier: 0.001,
            alphaModifier: 0.001,
            specularPower: 1.0,
            smoothness: 0.9,
            waveBlendingSharpness: 0.1
        };

        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(planet),
            ...getStellarObjectsUniforms(stars),
            ...getActiveCameraUniforms(scene),
            {
                name: "ocean.radius",
                type: UniformEnumType.Float,
                get: () => {
                    return oceanUniforms.oceanRadius;
                }
            },
            {
                name: "ocean.smoothness",
                type: UniformEnumType.Float,
                get: () => {
                    return oceanUniforms.smoothness;
                }
            },
            {
                name: "ocean.specularPower",
                type: UniformEnumType.Float,
                get: () => {
                    return oceanUniforms.specularPower;
                }
            },
            {
                name: "ocean.alphaModifier",
                type: UniformEnumType.Float,
                get: () => {
                    return oceanUniforms.alphaModifier;
                }
            },
            {
                name: "ocean.depthModifier",
                type: UniformEnumType.Float,
                get: () => {
                    return oceanUniforms.depthModifier;
                }
            },
            {
                name: "ocean.waveBlendingSharpness",
                type: UniformEnumType.Float,
                get: () => {
                    return oceanUniforms.waveBlendingSharpness;
                }
            },
            {
                name: "planetInverseRotationQuaternion",
                type: UniformEnumType.Quaternion,
                get: () => {
                    return getInverseRotationQuaternion(planet.getTransform());
                }
            },
            {
                name: "time",
                type: UniformEnumType.Float,
                get: () => {
                    //TODO: do not hardcode the 100000
                    // use rotating time offset to prevent float imprecision and distant artifacts
                    return this.internalTime % 100000;
                }
            }
        ];

        const samplers: ShaderSamplers = [
            ...getSamplers(scene),
            {
                name: "normalMap1",
                type: SamplerEnumType.Texture,
                get: () => {
                    return Assets.WaterNormalMap1;
                }
            },
            {
                name: "normalMap2",
                type: SamplerEnumType.Texture,
                get: () => {
                    return Assets.WaterNormalMap2;
                }
            }
        ];

        super(name, shaderName, uniforms, samplers, scene);

        this.object = planet;
        this.oceanUniforms = oceanUniforms;
    }
}
