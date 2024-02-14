//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { UberScene } from "../uberCore/uberScene";
import { SamplerEnumType, ShaderSamplers, ShaderUniforms, UniformEnumType } from "../uberCore/postProcesses/types";
import { BoundingSphere } from "../architecture/boundingSphere";
import { Star } from "../stellarObjects/star/star";
import { Transformable } from "../architecture/transformable";
import { Scene } from "@babylonjs/core/scene";
import { Color3 } from "@babylonjs/core/Maths/math.color";

export function getActiveCameraUniforms(scene: Scene): ShaderUniforms {
    return [
        {
            name: "camera_position",
            type: UniformEnumType.VECTOR_3,
            get: () => {
                if (scene.activeCamera === null) throw new Error("No active camera");
                return scene.activeCamera.globalPosition;
            }
        },
        {
            name: "camera_projection",
            type: UniformEnumType.MATRIX,
            get: () => {
                if (scene.activeCamera === null) throw new Error("No active camera");
                return scene.activeCamera.getProjectionMatrix();
            }
        },
        {
            name: "camera_inverseProjection",
            type: UniformEnumType.MATRIX,
            get: () => {
                if (scene.activeCamera === null) throw new Error("No active camera");
                return scene.activeCamera.getProjectionMatrix().clone().invert();
            }
        },
        {
            name: "camera_view",
            type: UniformEnumType.MATRIX,
            get: () => {
                if (scene.activeCamera === null) throw new Error("No active camera");
                return scene.activeCamera.getViewMatrix();
            }
        },
        {
            name: "camera_inverseView",
            type: UniformEnumType.MATRIX,
            get: () => {
                if (scene.activeCamera === null) throw new Error("No active camera");
                return scene.activeCamera.getViewMatrix().clone().invert();
            }
        },
        {
            name: "camera_near",
            type: UniformEnumType.FLOAT,
            get: () => {
                if (scene.activeCamera === null) throw new Error("No active camera");
                return scene.activeCamera.minZ;
            }
        },
        {
            name: "camera_far",
            type: UniformEnumType.FLOAT,
            get: () => {
                if (scene.activeCamera === null) throw new Error("No active camera");
                return scene.activeCamera.maxZ;
            }
        },
        {
            name: "camera_fov",
            type: UniformEnumType.FLOAT,
            get: () => {
                if (scene.activeCamera === null) throw new Error("No active camera");
                return scene.activeCamera.fov;
            }
        }
    ];
}

export function getStellarObjectsUniforms(stars: Transformable[]): ShaderUniforms {
    return [
        {
            name: "star_positions",
            type: UniformEnumType.VECTOR_3_ARRAY,
            get: () => stars.map((star) => star.getTransform().getAbsolutePosition())
        },
        {
            name: "star_colors",
            type: UniformEnumType.COLOR_3_ARRAY,
            get: () => stars.map((star) => (star instanceof Star ? star.model.color : Color3.White()))
        },
        {
            name: "nbStars",
            type: UniformEnumType.INT,
            get: () => stars.length
        }
    ];
}

export function getObjectUniforms(object: Transformable & BoundingSphere): ShaderUniforms {
    return [
        {
            name: "object_position",
            type: UniformEnumType.VECTOR_3,
            get: () => object.getTransform().getAbsolutePosition()
        },
        {
            name: "object_radius",
            type: UniformEnumType.FLOAT,
            get: () => object.getBoundingRadius()
        },
        {
            name: "object_rotationAxis",
            type: UniformEnumType.VECTOR_3,
            get: () => object.getTransform().up
        }
    ];
}

export function getSamplers(scene: UberScene): ShaderSamplers {
    return [
        {
            name: "textureSampler",
            type: SamplerEnumType.AUTO,
            get: () => undefined
        },
        {
            name: "depthSampler",
            type: SamplerEnumType.TEXTURE,
            get: () => scene.getDepthRenderer().getDepthMap()
        }
    ];
}
