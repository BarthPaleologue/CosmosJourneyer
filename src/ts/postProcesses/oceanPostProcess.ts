import { Effect } from "@babylonjs/core/Materials/effect";

import oceanFragment from "../../shaders/oceanFragment.glsl";
import { UberScene } from "../uberCore/uberScene";
import { UberPostProcess } from "../uberCore/postProcesses/uberPostProcess";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers, getStellarObjectsUniforms } from "./uniforms";
import { ObjectPostProcess, UpdatablePostProcess } from "./objectPostProcess";
import { getInverseRotationQuaternion } from "../uberCore/transforms/basicTransform";
import { UniformEnumType, ShaderSamplers, ShaderUniforms, SamplerEnumType } from "../uberCore/postProcesses/types";
import { BoundingSphere } from "../architecture/boundingSphere";
import { Assets } from "../assets";
import { Transformable } from "../architecture/transformable";

export type OceanUniforms = {
    oceanRadius: number;
    smoothness: number;
    specularPower: number;
    depthModifier: number;
    alphaModifier: number;
    waveBlendingSharpness: number;
    time: number;
};

export class OceanPostProcess extends UberPostProcess implements ObjectPostProcess, UpdatablePostProcess {
    readonly oceanUniforms: OceanUniforms;
    readonly object: Transformable;

    constructor(name: string, planet: Transformable & BoundingSphere, scene: UberScene, stars: Transformable[]) {
        const shaderName = "ocean";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = oceanFragment;
        }

        const oceanUniforms: OceanUniforms = {
            oceanRadius: planet.getBoundingRadius(),
            depthModifier: 0.0015,
            alphaModifier: 0.0025,
            specularPower: 1.0,
            smoothness: 0.9,
            waveBlendingSharpness: 0.1,
            time: 0
        };

        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(planet),
            ...getStellarObjectsUniforms(stars),
            ...getActiveCameraUniforms(scene),
            {
                name: "ocean_radius",
                type: UniformEnumType.Float,
                get: () => {
                    return oceanUniforms.oceanRadius;
                }
            },
            {
                name: "ocean_smoothness",
                type: UniformEnumType.Float,
                get: () => {
                    return oceanUniforms.smoothness;
                }
            },
            {
                name: "ocean_specularPower",
                type: UniformEnumType.Float,
                get: () => {
                    return oceanUniforms.specularPower;
                }
            },
            {
                name: "ocean_alphaModifier",
                type: UniformEnumType.Float,
                get: () => {
                    return oceanUniforms.alphaModifier;
                }
            },
            {
                name: "ocean_depthModifier",
                type: UniformEnumType.Float,
                get: () => {
                    return oceanUniforms.depthModifier;
                }
            },
            {
                name: "ocean_waveBlendingSharpness",
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
                    return oceanUniforms.time % 100000;
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

    public update(deltaTime: number) {
        this.oceanUniforms.time += deltaTime;
    }
}
