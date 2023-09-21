import { UberScene } from "../../controller/uberCore/uberScene";
import { ShaderDataType, ShaderSamplers, ShaderUniforms } from "../../controller/uberCore/postProcesses/uberPostProcess";
import { BaseObject, OrbitalObject } from "../../model/orbits/orbitalObject";

export function getActiveCameraUniforms(scene: UberScene): ShaderUniforms {
    return [
        {
            name: "cameraPosition",
            type: ShaderDataType.Vector3,
            get: () => {
                return scene.getActiveUberCamera().globalPosition;
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

export function getStellarObjectsUniforms(stars: OrbitalObject[]): ShaderUniforms {
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

export function getObjectUniforms(body: BaseObject): ShaderUniforms {
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
                return body.getBoundingRadius();
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
