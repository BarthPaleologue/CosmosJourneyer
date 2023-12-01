import shadowFragment from "../../shaders/shadowFragment.glsl";
import { AbstractBody } from "../bodies/abstractBody";
import { UberScene } from "../uberCore/uberScene";
import { UberPostProcess } from "../uberCore/postProcesses/uberPostProcess";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers, getStellarObjectsUniforms } from "./uniforms";
import { ObjectPostProcess } from "./objectPostProcess";
import { StellarObject } from "../stellarObjects/stellarObject";
import { Effect } from "@babylonjs/core/Materials/effect";
import { SamplerEnumType, ShaderUniforms, UniformEnumType } from "../uberCore/postProcesses/types";
import { PostProcessType } from "./postProcessTypes";
import { RingsUniforms } from "./rings/ringsUniform";
import { RingsPostProcess } from "./rings/ringsPostProcess";

const shaderName = "shadow";
Effect.ShadersStore[`${shaderName}FragmentShader`] = shadowFragment;

export type ShadowUniforms = {
    hasRings: boolean;
    hasClouds: boolean;
    hasOcean: boolean;
};

export class ShadowPostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly object: AbstractBody;
    readonly shadowUniforms: ShadowUniforms;

    constructor(body: AbstractBody, scene: UberScene, stellarObjects: StellarObject[]) {
        const shadowUniforms: ShadowUniforms = {
            hasRings: body.model.ringsUniforms !== null,
            hasClouds: body.postProcesses.includes(PostProcessType.CLOUDS),
            hasOcean: body.postProcesses.includes(PostProcessType.OCEAN)
        };
        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(body),
            ...getStellarObjectsUniforms(stellarObjects),
            ...getActiveCameraUniforms(scene),
            {
                name: "shadowUniforms_hasRings",
                type: UniformEnumType.Bool,
                get: () => {
                    return shadowUniforms.hasRings;
                }
            },
            {
                name: "shadowUniforms_hasClouds",
                type: UniformEnumType.Bool,
                get: () => {
                    return shadowUniforms.hasClouds;
                }
            },
            {
                name: "shadowUniforms_hasOcean",
                type: UniformEnumType.Bool,
                get: () => {
                    return shadowUniforms.hasOcean;
                }
            }
        ];

        const samplers = getSamplers(scene);

        const ringsUniforms = body.model.ringsUniforms as RingsUniforms;
        if (shadowUniforms.hasRings) {
            uniforms.push(...ringsUniforms.getShaderUniforms());

            const ringsLUT = RingsPostProcess.CreateLUT(body.model.seed, ringsUniforms.ringStart, ringsUniforms.ringEnd, ringsUniforms.ringFrequency, scene);
            samplers.push({
                name: "ringsLUT",
                type: SamplerEnumType.Texture,
                get: () => {
                    return ringsLUT;
                }
            });
        }

        super(body.name + "shadow", shaderName, uniforms, samplers, scene);

        this.object = body;
        this.shadowUniforms = shadowUniforms;
    }
}
