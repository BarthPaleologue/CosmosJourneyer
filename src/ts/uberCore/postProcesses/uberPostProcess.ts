import { Matrix, Quaternion, Vector3, Vector4 } from "@babylonjs/core/Maths/math.vector";
import { flattenVector3Array, flattenVector4Array } from "../../utils/algebra";
import { UberScene } from "../uberScene";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { UpdatablePostProcess } from "../../postProcesses/objectPostProcess";
import { UniformEnumType, ShaderSamplers, ShaderUniforms, SamplerEnumType } from "./types";
import { Observable } from "@babylonjs/core/Misc/observable";

/**
 * A wrapper around BabylonJS post processes that allows more predictable and easier to use uniforms
 */
export abstract class UberPostProcess extends PostProcess implements UpdatablePostProcess {
    private readonly uniforms: ShaderUniforms = [];
    private readonly samplers: ShaderSamplers = [];

    readonly onUpdatedObservable = new Observable<number>();

    protected constructor(name: string, fragmentName: string, uniforms: ShaderUniforms, samplers: ShaderSamplers, scene: UberScene) {
        const uniformNames = uniforms.map((uniform) => uniform.name);
        const samplerNames = samplers.map((sampler) => sampler.name);

        super(name, fragmentName, uniformNames, samplerNames, 1, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);

        this.uniforms.push(...uniforms);
        this.samplers.push(...samplers);

        this.onApplyObservable.add(() => this.transferUniforms());
    }

    /**
     * Gets the uniforms new values and transfers them to the post process
     */
    private transferUniforms() {
        const effect = this.getEffect();
        for (const uniform of this.uniforms) {
            switch (uniform.type) {
                case UniformEnumType.Float:
                    effect.setFloat(uniform.name, uniform.get() as number);
                    break;
                case UniformEnumType.Int:
                    effect.setInt(uniform.name, uniform.get() as number);
                    break;
                case UniformEnumType.Bool:
                    effect.setBool(uniform.name, uniform.get() as boolean);
                    break;
                case UniformEnumType.Vector3:
                    effect.setVector3(uniform.name, uniform.get() as Vector3);
                    break;
                case UniformEnumType.Color3:
                    effect.setColor3(uniform.name, uniform.get() as Color3);
                    break;
                case UniformEnumType.Quaternion:
                    effect.setQuaternion(uniform.name, uniform.get() as Quaternion);
                    break;
                case UniformEnumType.Matrix:
                    effect.setMatrix(uniform.name, uniform.get() as Matrix);
                    break;
                case UniformEnumType.Vector3Array:
                    effect.setFloatArray3(uniform.name, flattenVector3Array(uniform.get() as Vector3[]));
                    break;
                case UniformEnumType.Vector4Array:
                    effect.setFloatArray4(uniform.name, flattenVector4Array(uniform.get() as Vector4[]));
                    break;
                case UniformEnumType.FloatArray:
                    effect.setFloatArray(uniform.name, uniform.get() as number[]);
                    break;
                case UniformEnumType.Auto:
                    // BabylonJS already handles this
                    break;
            }
        }

        for (const sampler of this.samplers) {
            switch (sampler.type) {
                case SamplerEnumType.Texture:
                    effect.setTexture(sampler.name, sampler.get() as Texture);
                    break;
                case SamplerEnumType.Auto:
                    // BabylonJS already handles this
                    break;
                default:
                    throw new Error(`Unsupported sampler type: ${sampler.type}`);
            }
        }
    }

    public update(deltaTime: number) {
        this.onUpdatedObservable.notifyObservers(deltaTime);
    }
}
