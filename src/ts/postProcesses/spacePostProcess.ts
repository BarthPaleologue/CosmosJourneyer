import { Camera, Vector3, Vector4 } from "@babylonjs/core";
import { ShaderDataType, ShaderSamplers, ShaderUniforms } from "./interfaces";
import { StarSystem } from "../bodies/starSystem";
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
                    return Vector3.Zero();
                }
            },
            {
                name: "projection",
                type: ShaderDataType.Matrix,
                get: () => {
                    return scene.getPlayer().camera.getProjectionMatrix();
                }
            },
            {
                name: "view",
                type: ShaderDataType.Matrix,
                get: () => {
                    return scene.getPlayer().camera.getViewMatrix();
                }
            },
            {
                name: "cameraNear",
                type: ShaderDataType.Float,
                get: () => {
                    return scene.getPlayer().camera.minZ;
                }
            },
            {
                name: "cameraFar",
                type: ShaderDataType.Float,
                get: () => {
                    return scene.getPlayer().camera.maxZ;
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
                    return scene.customRenderTargets[0];
                }
            }
        ];

        uniforms.push(...otherUniforms);
        samplers.push(...otherSamplers);

        super(name, fragmentName, uniforms, samplers, scene);
    }
}
