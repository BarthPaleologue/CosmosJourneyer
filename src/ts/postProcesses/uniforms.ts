import { UberScene } from "../uberCore/uberScene";
import { AbstractBody } from "../bodies/abstractBody";
import { ITransformLike } from "../uberCore/transforms/ITransformLike";
import { ShaderDataType, ShaderSamplers, ShaderUniforms } from "../uberCore/postProcesses/uberPostProcess";
import { ITransformable } from "../orbits/iOrbitalBody";

export function getActiveCameraUniforms(scene: UberScene): ShaderUniforms {
    return [
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
        }
    ];
}

export function getStarsUniforms(stars: ITransformable[]): ShaderUniforms {
    return [
        {
            name: "starPositions",
            type: ShaderDataType.Vector3Array,
            get: () => {
                return stars.map((star) => star.transform.getAbsolutePosition());
            }
        },
        {
            name: "nbStars",
            type: ShaderDataType.Int,
            get: () => {
                return stars.length;
            }
        }
    ];
}

export function getBodyUniforms(body: AbstractBody): ShaderUniforms {
    return [
        {
            name: "planetPosition",
            type: ShaderDataType.Vector3,
            get: () => {
                return body.transform.getAbsolutePosition();
            }
        },
        {
            name: "planetRadius",
            type: ShaderDataType.Float,
            get: () => {
                return body.getApparentRadius();
            }
        }
    ];
}

export function getSamplers(scene: UberScene): ShaderSamplers {
    return [
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
                return scene.getDepthRenderer().getDepthMap();
            }
        }
    ];
}
