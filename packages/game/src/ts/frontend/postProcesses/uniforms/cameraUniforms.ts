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
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";

import { OffsetViewToRef } from "@/frontend/helpers/floatingOrigin";

export const CameraUniformNames = {
    CAMERA_POSITION: "camera_position",
    CAMERA_PROJECTION: "camera_projection",
    CAMERA_INVERSE_PROJECTION: "camera_inverseProjection",
    CAMERA_VIEW: "camera_view",
    CAMERA_INVERSE_VIEW: "camera_inverseView",
    CAMERA_NEAR: "camera_near",
    CAMERA_FAR: "camera_far",
    CAMERA_FOV: "camera_fov",
};

const tempMatrix1 = new Matrix();
const tempMatrix2 = new Matrix();
const tempMatrix3 = new Matrix();

const tempVector1 = new Vector3();

export function setCameraUniforms(effect: Effect, camera: Camera, floatingOriginEnabled: boolean): void {
    const view = floatingOriginEnabled ? OffsetViewToRef(camera.getViewMatrix(), tempMatrix1) : camera.getViewMatrix();
    const cameraPosition = floatingOriginEnabled
        ? Vector3.ZeroReadOnly
        : camera.getWorldMatrix().getTranslationToRef(tempVector1);
    effect.setVector3(CameraUniformNames.CAMERA_POSITION, cameraPosition);
    effect.setMatrix(CameraUniformNames.CAMERA_PROJECTION, camera.getProjectionMatrix());
    effect.setMatrix(
        CameraUniformNames.CAMERA_INVERSE_PROJECTION,
        camera.getProjectionMatrix().invertToRef(tempMatrix2),
    );
    effect.setMatrix(CameraUniformNames.CAMERA_VIEW, view);
    effect.setMatrix(CameraUniformNames.CAMERA_INVERSE_VIEW, view.invertToRef(tempMatrix3));
    effect.setFloat(CameraUniformNames.CAMERA_NEAR, camera.minZ);
    effect.setFloat(CameraUniformNames.CAMERA_FAR, camera.maxZ);
    effect.setFloat(CameraUniformNames.CAMERA_FOV, camera.fov);
}
