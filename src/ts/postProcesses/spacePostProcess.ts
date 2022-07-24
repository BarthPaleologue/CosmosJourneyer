import { Camera, Color3, Effect, Matrix, PostProcess, Quaternion, Texture, Vector3 } from "@babylonjs/core";
import { ShaderDataType, ShaderSamplers, ShaderUniforms } from "./interfaces";
import { flattenVector3Array } from "../utils/algebra";
import { StarSystemManager } from "../bodies/starSystemManager";
import { IPostProcess } from "./iPostProcess";

export abstract class SpacePostProcess extends PostProcess implements IPostProcess {
    camera: Camera;

    uniforms: ShaderUniforms;
    samplers: ShaderSamplers;

    protected internalTime = 0;

    protected constructor(name: string, fragmentName: string, otherUniforms: ShaderUniforms, otherSamplers: ShaderSamplers, starSystem: StarSystemManager) {
        const uniforms: ShaderUniforms = [
            {
                name: "cameraPosition",
                type: ShaderDataType.Vector3,
                get: () => {
                    return Vector3.Zero();
                }
            },
            {
                name: "projection",
                type: ShaderDataType.Matrix,
                get: () => {
                    return starSystem.scene.activeCamera!.getProjectionMatrix();
                }
            },
            {
                name: "view",
                type: ShaderDataType.Matrix,
                get: () => {
                    return starSystem.scene.activeCamera!.getViewMatrix();
                }
            },
            {
                name: "cameraNear",
                type: ShaderDataType.Float,
                get: () => {
                    return starSystem.scene.activeCamera!.minZ;
                }
            },
            {
                name: "cameraFar",
                type: ShaderDataType.Float,
                get: () => {
                    return starSystem.scene.activeCamera!.maxZ;
                }
            },
            {
                name: "starPositions",
                type: ShaderDataType.Vector3Array,
                get: () => {
                    return starSystem.stars.map((star) => star.getAbsolutePosition());
                }
            },
            {
                name: "nbStars",
                type: ShaderDataType.Int,
                get: () => {
                    return starSystem.stars.length;
                }
            }
        ];

        const samplers: ShaderSamplers = [
            {
                name: "textureSampler",
                type: ShaderDataType.Auto,
                get: () => {
                    return 0;
                }
            },
            {
                name: "depthSampler",
                type: ShaderDataType.Texture,
                get: () => {
                    return starSystem.scene.customRenderTargets[0];
                }
            }
        ];

        uniforms.push(...otherUniforms);
        samplers.push(...otherSamplers);

        const uniformNames = uniforms.map((uniform) => uniform.name);
        const samplerNames = samplers.map((sampler) => sampler.name);

        super(name, fragmentName, uniformNames, samplerNames, 1, null, Texture.BILINEAR_SAMPLINGMODE, starSystem.scene.getEngine(), false);

        this.camera = starSystem.scene.activeCamera!;

        this.uniforms = uniforms;
        this.samplers = samplers;

        this.onApply = (effect: Effect) => {
            for (const uniform of this.uniforms) {
                switch (uniform.type) {
                    case ShaderDataType.Float:
                        effect.setFloat(uniform.name, uniform.get() as number);
                        break;
                    case ShaderDataType.Int:
                        effect.setInt(uniform.name, uniform.get() as number);
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
