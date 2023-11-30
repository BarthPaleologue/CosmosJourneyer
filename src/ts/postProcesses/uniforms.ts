import { UberScene } from "../uberCore/uberScene";
import { UniformEnumType, ShaderSamplers, ShaderUniforms, SamplerEnumType } from "../uberCore/postProcesses/types";
import { StellarObject } from "../stellarObjects/stellarObject";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { BaseObject } from "../bodies/common";
import { Star } from "../stellarObjects/star/star";

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

export function getStellarObjectsUniforms(stars: StellarObject[]): ShaderUniforms {
    return [
        ...stars.flatMap((star, index) => {
            return [
                {
                    name: `stars[${index}].position`,
                    type: UniformEnumType.Vector3,
                    get: () => star.getTransform().getAbsolutePosition()
                },
                {
                    name: `stars[${index}].radius`,
                    type: UniformEnumType.Float,
                    get: () => star.getRadius()
                },
                {
                    name: `stars[${index}].color`,
                    type: UniformEnumType.Vector3,
                    get: () => (star instanceof Star ? star.model.surfaceColor : Vector3.One())
                }
            ];
        }),
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
            get: () => object.getTransform().getAbsolutePosition()
        },
        {
            name: "object.radius",
            type: UniformEnumType.Float,
            get: () => object.getBoundingRadius()
        },
        {
            name: "object.rotationAxis",
            type: UniformEnumType.Vector3,
            get: () => object.getTransform().up
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
