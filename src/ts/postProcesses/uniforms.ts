import { UberScene } from "../uberCore/uberScene";
import { UniformEnumType, ShaderSamplers, ShaderUniforms, SamplerEnumType } from "../uberCore/postProcesses/types";
import { StellarObject } from "../stellarObjects/stellarObject";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { BaseObject } from "../bodies/common";
import { Star } from "../stellarObjects/star/star";

export function getActiveCameraUniforms(scene: UberScene): ShaderUniforms {
    return [
        {
            name: "camera_position",
            type: UniformEnumType.Vector3,
            get: () => scene.getActiveUberCamera().getAbsolutePosition()
        },
        {
            name: "camera_projection",
            type: UniformEnumType.Matrix,
            get: () => scene.getActiveUberCamera().getProjectionMatrix()
        },
        {
            name: "camera_inverseProjection",
            type: UniformEnumType.Matrix,
            get: () => scene.getActiveUberCamera().getInverseProjectionMatrix()
        },
        {
            name: "camera_view",
            type: UniformEnumType.Matrix,
            get: () => scene.getActiveUberCamera().getViewMatrix()
        },
        {
            name: "camera_inverseView",
            type: UniformEnumType.Matrix,
            get: () => scene.getActiveUberCamera().getInverseViewMatrix()
        },
        {
            name: "camera_near",
            type: UniformEnumType.Float,
            get: () => scene.getActiveUberCamera().minZ
        },
        {
            name: "camera_far",
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
                    name: `star_positions[${index}]`,
                    type: UniformEnumType.Vector3,
                    get: () => star.getTransform().getAbsolutePosition()
                },
                {
                    name: `star_radiuses[${index}]`,
                    type: UniformEnumType.Float,
                    get: () => star.getRadius()
                },
                {
                    name: `star_colors[${index}]`,
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
            name: "object_position",
            type: UniformEnumType.Vector3,
            get: () => object.getTransform().getAbsolutePosition()
        },
        {
            name: "object_radius",
            type: UniformEnumType.Float,
            get: () => object.getBoundingRadius()
        },
        {
            name: "object_rotationAxis",
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