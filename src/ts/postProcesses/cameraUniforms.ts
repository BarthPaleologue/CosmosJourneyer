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

import { ShaderUniforms, UniformEnumType } from "../uberCore/postProcesses/types";
import { UberPostProcess } from "../uberCore/postProcesses/uberPostProcess";

export const CAMERA_UNIFORM_NAMES = ["camera_position", "camera_projection", "camera_inverseProjection", "camera_view", "camera_inverseView", "camera_near", "camera_far", "camera_fov"];

export function getCameraUniforms(postProcess: UberPostProcess): ShaderUniforms {
    return [
        {
            name: "camera_position",
            type: UniformEnumType.VECTOR_3,
            get: () => {
                return postProcess.getCamera().globalPosition;
            }
        },
        {
            name: "camera_projection",
            type: UniformEnumType.MATRIX,
            get: () => {
                return postProcess.getCamera().getProjectionMatrix();
            }
        },
        {
            name: "camera_inverseProjection",
            type: UniformEnumType.MATRIX,
            get: () => {
                return postProcess.getCamera().getProjectionMatrix().clone().invert();
            }
        },
        {
            name: "camera_view",
            type: UniformEnumType.MATRIX,
            get: () => {
                return postProcess.getCamera().getViewMatrix();
            }
        },
        {
            name: "camera_inverseView",
            type: UniformEnumType.MATRIX,
            get: () => {
                return postProcess.getCamera().getViewMatrix().clone().invert();
            }
        },
        {
            name: "camera_near",
            type: UniformEnumType.FLOAT,
            get: () => {
                return postProcess.getCamera().minZ;
            }
        },
        {
            name: "camera_far",
            type: UniformEnumType.FLOAT,
            get: () => {
                return postProcess.getCamera().maxZ;
            }
        },
        {
            name: "camera_fov",
            type: UniformEnumType.FLOAT,
            get: () => {
                return postProcess.getCamera().fov;
            }
        }
    ];
}