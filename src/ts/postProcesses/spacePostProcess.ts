import { Vector3, Vector4 } from "@babylonjs/core";
import { ShaderDataType, ShaderSamplers, ShaderUniforms } from "./interfaces";
import { IPostProcess } from "./iPostProcess";
import { UberPostProcess } from "./uberPostProcess";
import { UberScene } from "../core/uberScene";

export abstract class SpacePostProcess extends UberPostProcess implements IPostProcess {
    protected constructor(name: string, fragmentName: string, otherUniforms: ShaderUniforms, otherSamplers: ShaderSamplers, scene: UberScene) {
        const uniforms: ShaderUniforms = [
            {
                name: "cameraPosition",
                type: ShaderDataType.Vector3,
                get: () => {
                    return scene.getActiveUberCamera().position;
                }
            },
            {
                name: "projection",
                type: ShaderDataType.Matrix,
                get: () => {
                    return scene.getActiveUberCamera().getProjectionMatrix();
                }
            },
            {
                name: "inverseProjection",
                type: ShaderDataType.Matrix,
                get: () => {
                    return scene.getActiveUberCamera().getInverseProjectionMatrix();
                }
            },
            {
                name: "view",
                type: ShaderDataType.Matrix,
                get: () => {
                    return scene.getActiveUberCamera().getViewMatrix();
                }
            },
            {
                name: "inverseView",
                type: ShaderDataType.Matrix,
                get: () => {
                    return scene.getActiveUberCamera().getInverseViewMatrix();
                }
            },
            {
                name: "cameraNear",
                type: ShaderDataType.Float,
                get: () => {
                    return scene.getActiveUberCamera().minZ;
                }
            },
            {
                name: "cameraFar",
                type: ShaderDataType.Float,
                get: () => {
                    return scene.getActiveUberCamera().maxZ;
                }
            },
            {
                name: "starPositions",
                type: ShaderDataType.Vector3Array,
                get: () => {
                    return scene.getStarSystem().stars.map((star) => star.getAbsolutePosition());
                }
            },
            {
                name: "nbStars",
                type: ShaderDataType.Int,
                get: () => {
                    return scene.getStarSystem().stars.length;
                }
            },
            {
                name: "planetPositions",
                type: ShaderDataType.Vector4Array,
                get: () => {
                    return scene.getStarSystem().planets.map((planet) => {
                        const position = planet.getAbsolutePosition();
                        return new Vector4(position.x, position.y, position.z, planet.radius);
                    });
                }
            },
            {
                name: "nbPlanets",
                type: ShaderDataType.Int,
                get: () => {
                    return scene.getStarSystem().planets.length;
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
                    return scene.getActiveUberCamera().depthRenderer.getDepthMap();
                }
            }
        ];

        uniforms.push(...otherUniforms);
        samplers.push(...otherSamplers);

        super(name, fragmentName, uniforms, samplers, scene);
    }
}
