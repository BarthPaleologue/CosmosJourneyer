import { UberScene } from "../../controller/uberCore/uberScene";
import { BaseObject, OrbitalObject } from "../common";
import { UniformEnumType, ShaderSamplers, ShaderUniforms, SamplerEnumType } from "../../controller/uberCore/postProcesses/types";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export function getActiveCameraUniforms(scene: UberScene): ShaderUniforms {
    return [
        {
            name: "camera.position",
            type: UniformEnumType.Vector3,
            get: () => scene.getActiveUberCamera().getAbsolutePosition()
        },
        {
            name: "camera.projection",
            type: UniformEnumType.Matrix,
            get: () => scene.getActiveUberCamera().getProjectionMatrix()
        },
        {
            name: "camera.inverseProjection",
            type: UniformEnumType.Matrix,
            get: () => scene.getActiveUberCamera().getInverseProjectionMatrix()
        },
        {
            name: "camera.view",
            type: UniformEnumType.Matrix,
            get: () => scene.getActiveUberCamera().getViewMatrix()
        },
        {
            name: "camera.inverseView",
            type: UniformEnumType.Matrix,
            get: () => scene.getActiveUberCamera().getInverseViewMatrix()
        },
        {
            name: "camera.near",
            type: UniformEnumType.Float,
            get: () => scene.getActiveUberCamera().minZ
        },
        {
            name: "camera.far",
            type: UniformEnumType.Float,
            get: () => scene.getActiveUberCamera().maxZ
        }
    ];
}

export function getStellarObjectsUniforms(stars: OrbitalObject[]): ShaderUniforms {
    return [
        ...stars.map((star, index) => {
            return {
                name: `stars[${index}].position`,
                type: UniformEnumType.Vector3,
                get: () => star.transform.getAbsolutePosition()
            };
        }),
        {
            name: "starPositions",
            type: UniformEnumType.Vector3Array,
            get: () => stars.map((star) => star.transform.getAbsolutePosition())
        },
        {
            name: "nbStars",
            type: UniformEnumType.Int,
            get: () => stars.length
        }
    ];
}

export function getObjectUniforms(object: BaseObject): ShaderUniforms {
    return [
        {
            name: "object.position",
            type: UniformEnumType.Vector3,
            get: () => object.transform.getAbsolutePosition()
        },
        {
            name: "object.radius",
            type: UniformEnumType.Float,
            get: () => object.getBoundingRadius()
        },
        {
            name: "object.rotationAxis",
            type: UniformEnumType.Vector3,
            get: () => object.transform.up
        }
    ];
}

export function getSamplers(scene: UberScene): ShaderSamplers {
    return [
        {
            name: "textureSampler",
            type: SamplerEnumType.Auto,
            get: () => undefined
        },
        {
            name: "depthSampler",
            type: SamplerEnumType.Texture,
            get: () => scene.getDepthRenderer().getDepthMap()
        }
    ];
}
