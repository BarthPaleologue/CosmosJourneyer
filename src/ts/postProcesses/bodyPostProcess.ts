import { AbstractBody } from "../bodies/abstractBody";
import { UberScene } from "../core/uberScene";
import { ShaderSamplers, ShaderUniforms, UberPostProcess } from "../core/postProcesses/uberPostProcess";

export abstract class BodyPostProcess extends UberPostProcess {
    readonly body: AbstractBody;

    constructor(name: string, body: AbstractBody, fragmentName: string, uniforms: ShaderUniforms, samplers: ShaderSamplers, scene: UberScene) {
        super(name, fragmentName, uniforms, samplers, scene);
        this.body = body;
    }
}