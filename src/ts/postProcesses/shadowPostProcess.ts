import shadowFragment from "../../shaders/shadowFragment.glsl";
import { AbstractBody } from "../bodies/abstractBody";
import { UberScene } from "../uberCore/uberScene";
import { UberPostProcess } from "../uberCore/postProcesses/uberPostProcess";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers, getStellarObjectsUniforms } from "./uniforms";
import { ObjectPostProcess } from "./objectPostProcess";
import { StellarObject } from "../stellarObjects/stellarObject";
import { Effect } from "@babylonjs/core/Materials/effect";
import { SamplerEnumType, ShaderSamplers, ShaderUniforms, UniformEnumType } from "../uberCore/postProcesses/types";
import { PostProcessType } from "./postProcessTypes";
import { RingsUniforms } from "./rings/ringsUniform";
import { RingsPostProcess } from "./rings/ringsPostProcess";
import { Assets } from "../assets";

export type ShadowUniforms = {
    hasRings: boolean;
    hasClouds: boolean;
    hasOcean: boolean;
};

export class ShadowPostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly object: AbstractBody;
    readonly shadowUniforms: ShadowUniforms;

    public static async CreateAsync(body: AbstractBody, scene: UberScene, stellarObjects: StellarObject[]): Promise<ShadowPostProcess> {
        const shaderName = "shadow";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = shadowFragment;
        }

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
                name: "star_radiuses",
                type: UniformEnumType.FloatArray,
                get: () => stellarObjects.map((star) => star.getBoundingRadius())
            },
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

            const ringsLUT = ringsUniforms.getLUT(body.model.seed, ringsUniforms.ringStart, ringsUniforms.ringEnd, ringsUniforms.ringFrequency, scene);
            samplers.push({
                name: "ringsLUT",
                type: SamplerEnumType.Texture,
                get: () => {
                    return ringsLUT;
                }
            });

            return new Promise((resolve, reject) => {
                ringsLUT.executeWhenReady(() => {
                    resolve(new ShadowPostProcess(body.name + "Shadow", body, scene, shaderName, uniforms, samplers, shadowUniforms));
                });
            });
        } else {
            uniforms.push(...RingsUniforms.getEmptyShaderUniforms());
            samplers.push({
                name: "ringsLUT",
                type: SamplerEnumType.Texture,
                get: () => {
                    return Assets.EmptyTexture;
                }
            });
            return new ShadowPostProcess(body.name + "Shadow", body, scene, shaderName, uniforms, samplers, shadowUniforms);
        }
    }

    private constructor(
        name: string,
        body: AbstractBody,
        scene: UberScene,
        shaderName: string,
        uniforms: ShaderUniforms,
        samplers: ShaderSamplers,
        shadowUniforms: ShadowUniforms
    ) {
        super(name, shaderName, uniforms, samplers, scene);

        this.object = body;
        this.shadowUniforms = shadowUniforms;
    }
}
