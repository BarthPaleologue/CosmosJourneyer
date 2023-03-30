import { UberScene } from "../uberCore/uberScene";
import { ShaderSamplers, ShaderUniforms, UberPostProcess } from "../uberCore/postProcesses/uberPostProcess";
import { BaseObject } from "../bodies/common";

export abstract class BodyPostProcess extends UberPostProcess {
    readonly body: BaseObject;

    constructor(name: string, body: BaseObject, fragmentName: string, uniforms: ShaderUniforms, samplers: ShaderSamplers, scene: UberScene) {
        super(name, fragmentName, uniforms, samplers, scene);
        this.body = body;
    }
}
