//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { type Camera } from "@babylonjs/core/Cameras/camera";
import { type Effect } from "@babylonjs/core/Materials/effect";

export const CameraUniformNames = {
    CAMERA_POSITION: "camera_position",
    CAMERA_PROJECTION: "camera_projection",
    CAMERA_VIEW: "camera_view",
    CAMERA_INVERSE_PROJECTION_VIEW: "camera_inverseProjectionView",
    CAMERA_NEAR: "camera_near",
    CAMERA_FAR: "camera_far",
    CAMERA_FOV: "camera_fov",
};

export function setCameraUniforms(effect: Effect, camera: Camera): void {
    const projection = camera.getProjectionMatrix();
    const view = camera.getViewMatrix();

    effect.setVector3(CameraUniformNames.CAMERA_POSITION, camera.globalPosition);
    effect.setMatrix(CameraUniformNames.CAMERA_PROJECTION, projection);
    effect.setMatrix(CameraUniformNames.CAMERA_VIEW, camera.getViewMatrix());
    effect.setMatrix(CameraUniformNames.CAMERA_INVERSE_PROJECTION_VIEW, view.multiply(projection).clone().invert());

    effect.setFloat(CameraUniformNames.CAMERA_NEAR, camera.minZ);
    effect.setFloat(CameraUniformNames.CAMERA_FAR, camera.maxZ);
    effect.setFloat(CameraUniformNames.CAMERA_FOV, camera.fov);
}
