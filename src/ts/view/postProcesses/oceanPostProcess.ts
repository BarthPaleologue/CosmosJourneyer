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
import {ShaderDataType, ShaderSamplers, ShaderUniforms} from "../../controller/uberCore/postProcesses/types";

const shaderName = "ocean";
Effect.ShadersStore[`${shaderName}FragmentShader`] = oceanFragment;

export interface OceanSettings {
    oceanRadius: number;
    smoothness: number;
    specularPower: number;
    depthModifier: number;
    alphaModifier: number;
    waveBlendingSharpness: number;
}

export class OceanPostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly settings: OceanSettings;
    readonly object: TelluricPlanemo;

    constructor(name: string, planet: TelluricPlanemo, scene: UberScene, stars: OrbitalObject[]) {
        const settings: OceanSettings = {
            oceanRadius: planet.getBoundingRadius(),
            depthModifier: 0.001,
            alphaModifier: 0.001,
            specularPower: 1.5,
            smoothness: 0.9,
            waveBlendingSharpness: 0.1
        };

        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(planet),
            ...getStellarObjectsUniforms(stars),
            ...getActiveCameraUniforms(scene),
            {
                name: "oceanRadius",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.oceanRadius;
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
                name: "alphaModifier",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.alphaModifier;
                }
            },
            {
                name: "depthModifier",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.depthModifier;
                }
            },
            {
                name: "waveBlendingSharpness",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.waveBlendingSharpness;
                }
            },
            {
                name: "planetInverseRotationQuaternion",
                type: ShaderDataType.Quaternion,
                get: () => {
                    return getInverseRotationQuaternion(planet.transform);
                }
            },
            {
                name: "time",
                type: ShaderDataType.Float,
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
                type: ShaderDataType.Texture,
                get: () => {
                    return Assets.WaterNormalMap1;
                }
            },
            {
                name: "normalMap2",
                type: ShaderDataType.Texture,
                get: () => {
                    return Assets.WaterNormalMap2;
                }
            }
        ];

        super(name, shaderName, uniforms, samplers, scene);

        this.object = planet;
        this.settings = settings;
    }
}
