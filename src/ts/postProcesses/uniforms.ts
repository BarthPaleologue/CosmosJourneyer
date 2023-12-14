import { UberScene } from "../uberCore/uberScene";
import { SamplerEnumType, ShaderSamplers, ShaderUniforms, UniformEnumType } from "../uberCore/postProcesses/types";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { BoundingSphere } from "../bodies/common";
import { Star } from "../stellarObjects/star/star";
import { Transformable } from "../uberCore/transforms/basicTransform";
import { Scene } from "@babylonjs/core/scene";

export function getActiveCameraUniforms(scene: Scene): ShaderUniforms {
    return [
        {
            name: "camera_position",
            type: UniformEnumType.Vector3,
            get: () => {
                if (scene.activeCamera === null) throw new Error("No active camera");
                return scene.activeCamera.globalPosition;
            }
        },
        {
            name: "camera_projection",
            type: UniformEnumType.Matrix,
            get: () => {
                if(scene.activeCamera === null) throw new Error("No active camera");
                return scene.activeCamera.getProjectionMatrix();
            }
        },
        {
            name: "camera_inverseProjection",
            type: UniformEnumType.Matrix,
            get: () => {
                if(scene.activeCamera === null) throw new Error("No active camera");
                return scene.activeCamera.getProjectionMatrix().clone().invert();
            }
        },
        {
            name: "camera_view",
            type: UniformEnumType.Matrix,
            get: () => {
                if(scene.activeCamera === null) throw new Error("No active camera");
                return scene.activeCamera.getViewMatrix();
            }
        },
        {
            name: "camera_inverseView",
            type: UniformEnumType.Matrix,
            get: () => {
                if(scene.activeCamera === null) throw new Error("No active camera");
                return scene.activeCamera.getViewMatrix().clone().invert();
            }
        },
        {
            name: "camera_near",
            type: UniformEnumType.Float,
            get: () => {
                if(scene.activeCamera === null) throw new Error("No active camera");
                return scene.activeCamera.minZ;
            }
        },
        {
            name: "camera_far",
            type: UniformEnumType.Float,
            get: () => {
                if(scene.activeCamera === null) throw new Error("No active camera");
                return scene.activeCamera.maxZ;
            }
        }
    ];
}

export function getStellarObjectsUniforms(stars: Transformable[]): ShaderUniforms {
    return [
        {
            name: "star_positions",
            type: UniformEnumType.Vector3Array,
            get: () => stars.map(star => star.getTransform().getAbsolutePosition())
        },
        {
            name: "star_colors",
            type: UniformEnumType.Vector3Array,
            get: () => stars.map(star => star instanceof Star ? star.model.surfaceColor : Vector3.One())
        },
        {
            name: "nbStars",
            type: UniformEnumType.Int,
            get: () => stars.length
        }
    ];
}

export function getObjectUniforms(object: Transformable & BoundingSphere): ShaderUniforms {
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
