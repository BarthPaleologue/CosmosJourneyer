import shadowFragment from "../../shaders/shadowFragment.glsl";
import { AbstractBody } from "../bodies/abstractBody";
import { UberScene } from "../uberCore/uberScene";
import { UberPostProcess } from "../uberCore/postProcesses/uberPostProcess";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers, getStellarObjectsUniforms } from "./uniforms";
import { ObjectPostProcess } from "./objectPostProcess";
import { StellarObject } from "../stellarObjects/stellarObject";
import { Effect } from "@babylonjs/core/Materials/effect";
import { ShaderUniforms, UniformEnumType } from "../uberCore/postProcesses/types";
import { PostProcessType } from "./postProcessTypes";
import { RingsUniforms } from "./rings/ringsUniform";

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
                name: "shadowUniforms.hasRings",
                type: UniformEnumType.Bool,
                get: () => {
                    return shadowUniforms.hasRings;
                }
            },
            {
                name: "shadowUniforms.hasClouds",
                type: UniformEnumType.Bool,
                get: () => {
                    return shadowUniforms.hasClouds;
                }
            },
            {
                name: "shadowUniforms.hasOcean",
                type: UniformEnumType.Bool,
                get: () => {
                    return shadowUniforms.hasOcean;
                }
            }
        ];

        const ringsUniforms = body.model.ringsUniforms as RingsUniforms;
        if (shadowUniforms.hasRings) uniforms.push(...ringsUniforms.getShaderUniforms());

        super(body.name + "shadow", shaderName, uniforms, getSamplers(scene), scene);

        this.object = body;
        this.shadowUniforms = shadowUniforms;
    }
}
