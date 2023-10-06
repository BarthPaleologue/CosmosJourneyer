import shadowFragment from "../../../shaders/shadowFragment.glsl";
import { AbstractBody } from "../bodies/abstractBody";
import { UberScene } from "../../controller/uberCore/uberScene";
import { UberPostProcess } from "../../controller/uberCore/postProcesses/uberPostProcess";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers, getStellarObjectsUniforms } from "./uniforms";
import { ObjectPostProcess } from "./objectPostProcess";
import { StellarObject } from "../bodies/stellarObjects/stellarObject";
import { Effect } from "@babylonjs/core/Materials/effect";
import { ShaderUniforms } from "../../controller/uberCore/postProcesses/types";

const shaderName = "shadow";
Effect.ShadersStore[`${shaderName}FragmentShader`] = shadowFragment;

export class ShadowPostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly object: AbstractBody;

    constructor(body: AbstractBody, scene: UberScene, stellarObjects: StellarObject[]) {
        const uniforms: ShaderUniforms = [...getObjectUniforms(body), ...getStellarObjectsUniforms(stellarObjects), ...getActiveCameraUniforms(scene)];

        super(body.name + "shadow", shaderName, uniforms, getSamplers(scene), scene);

        this.object = body;
    }
}
