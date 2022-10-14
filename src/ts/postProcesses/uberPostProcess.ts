import { Color3, Effect, Matrix, PostProcess, Quaternion, Texture, Vector3, Vector4 } from "@babylonjs/core";
import { ShaderDataType, ShaderSamplers, ShaderUniforms } from "./interfaces";
import { flattenVector3Array, flattenVector4Array } from "../utils/algebra";
import { IPostProcess } from "./iPostProcess";
import { UberScene } from "../core/uberScene";

export abstract class UberPostProcess extends PostProcess implements IPostProcess {
    protected readonly uniforms: ShaderUniforms = [];
    protected readonly samplers: ShaderSamplers = [];

    protected internalTime = 0;

    protected constructor(name: string, fragmentName: string, uniforms: ShaderUniforms, samplers: ShaderSamplers, scene: UberScene) {
        const uniformNames = uniforms.map((uniform) => uniform.name);
        const samplerNames = samplers.map((sampler) => sampler.name);

        super(name, fragmentName, uniformNames, samplerNames, 1, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);

        this.uniforms.push(...uniforms);
        this.samplers.push(...samplers);

        this.onApply = (effect: Effect) => {
            for (const uniform of this.uniforms) {
                switch (uniform.type) {
                    case ShaderDataType.Float:
                        effect.setFloat(uniform.name, uniform.get() as number);
                        break;
                    case ShaderDataType.Int:
                        effect.setInt(uniform.name, uniform.get() as number);
                        break;
                    case ShaderDataType.Bool:
                        effect.setBool(uniform.name, uniform.get() as boolean);
                        break;
                    case ShaderDataType.Vector3:
                        effect.setVector3(uniform.name, uniform.get() as Vector3);
                        break;
                    case ShaderDataType.Color3:
                        effect.setColor3(uniform.name, uniform.get() as Color3);
                        break;
                    case ShaderDataType.Quaternion:
                        effect.setQuaternion(uniform.name, uniform.get() as Quaternion);
                        break;
                    case ShaderDataType.Matrix:
                        effect.setMatrix(uniform.name, uniform.get() as Matrix);
                        break;
                    case ShaderDataType.Vector3Array:
                        effect.setArray3(uniform.name, flattenVector3Array(uniform.get() as Vector3[]));
                        break;
                    case ShaderDataType.Vector4Array:
                        effect.setArray4(uniform.name, flattenVector4Array(uniform.get() as Vector4[]));
                        break;
                    case ShaderDataType.Auto:
                        // BabylonJS already handles this
                        break;
                    default:
                        throw new Error(`Unknown enum shader data type in uniform (not samplers): ${uniform.type}`);
                }
            }

            for (const sampler of this.samplers) {
                switch (sampler.type) {
                    case ShaderDataType.Texture:
                        effect.setTexture(sampler.name, sampler.get() as Texture);
                        break;
                    case ShaderDataType.Auto:
                        // BabylonJS already handles this
                        break;
                    default:
                        throw new Error(`Unknown enum shader data type in uniform samplers: ${sampler.type}`);
                }
            }
        };
    }

    update(deltaTime: number) {
        this.internalTime += deltaTime;
    }
}
