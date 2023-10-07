import shadowFragment from "../../../shaders/shadowFragment.glsl";
import { AbstractBody } from "../bodies/abstractBody";
import { UberScene } from "../../controller/uberCore/uberScene";
import { UberPostProcess } from "../../controller/uberCore/postProcesses/uberPostProcess";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers, getStellarObjectsUniforms } from "./uniforms";
import { ObjectPostProcess } from "./objectPostProcess";
import { StellarObject } from "../bodies/stellarObjects/stellarObject";
import { Effect } from "@babylonjs/core/Materials/effect";
import { ShaderUniforms, UniformEnumType } from "../../controller/uberCore/postProcesses/types";
import { PostProcessType } from "./postProcessTypes";

const shaderName = "shadow";
Effect.ShadersStore[`${shaderName}FragmentShader`] = shadowFragment;

export type ShadowUniforms = {
    hasRings: boolean;
    hasClouds: boolean;
    hasOcean: boolean;
}

export class ShadowPostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly object: AbstractBody;
    readonly shadowUniforms: ShadowUniforms;

    constructor(body: AbstractBody, scene: UberScene, stellarObjects: StellarObject[]) {
        const shadowUniforms: ShadowUniforms = {
            hasRings: body.postProcesses.includes(PostProcessType.RING),
            hasClouds: body.postProcesses.includes(PostProcessType.CLOUDS),
            hasOcean: body.postProcesses.includes(PostProcessType.OCEAN)
        };
        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(body), 
            ...getStellarObjectsUniforms(stellarObjects), 
            ...getActiveCameraUniforms(scene),
            {
                name: "shadow.hasRings",
                type: UniformEnumType.Bool,
                get: () => {
                    return shadowUniforms.hasRings;
                }
            },
            {
                name: "shadow.hasClouds",
                type: UniformEnumType.Bool,
                get: () => {
                    return shadowUniforms.hasClouds;
                }
            },
            {
                name: "shadow.hasOcean",
                type: UniformEnumType.Bool,
                get: () => {
                    return shadowUniforms.hasOcean;
                }
            }
        ];

        super(body.name + "shadow", shaderName, uniforms, getSamplers(scene), scene);

        this.object = body;
        this.shadowUniforms = shadowUniforms;
    }
}
