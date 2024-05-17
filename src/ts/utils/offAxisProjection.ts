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

import { Camera } from "@babylonjs/core/Cameras/camera";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";

/**
 * Updates the projection matrices of the cameras with off-axis projection
 * @param camera 
 * @param cameraOffset The camera position in local space
 */
export function setOffAxisProjection(camera: Camera, cameraOffset: Vector3, screenHalfHeight: number, useRightHandedSystem: boolean) {
    const engine = camera.getEngine();
    const canvas = engine.getRenderingCanvas();
    if (canvas === null) {
        throw new Error("Canvas is null!");
    }

    const aspectRatio = canvas.width / canvas.height;

    camera.position.x = cameraOffset.x;
    camera.position.y = cameraOffset.y;
    camera.position.z = -Math.abs(cameraOffset.z);

    if(useRightHandedSystem) {
        camera.position.x *= -1;
    }

    // the distance to the focal plane is the distance of the eye to the screen plane
    const distanceToFocalPlane = Math.abs(camera.position.z);

    camera.fov = 2 * Math.atan(screenHalfHeight / distanceToFocalPlane);

    if(useRightHandedSystem) {
        const projectionMatrix = Matrix.PerspectiveFovRH(camera.fov, aspectRatio, camera.minZ, camera.maxZ, engine.isNDCHalfZRange, camera.projectionPlaneTilt, engine.useReverseDepthBuffer);
        projectionMatrix.addAtIndex(8, camera.position.x / (screenHalfHeight * aspectRatio));
        projectionMatrix.addAtIndex(9, -camera.position.y / screenHalfHeight);
        camera._projectionMatrix.copyFrom(projectionMatrix);
    } else {
        const projectionMatrix = Matrix.PerspectiveFovLH(camera.fov, aspectRatio, camera.minZ, camera.maxZ, engine.isNDCHalfZRange, camera.projectionPlaneTilt, engine.useReverseDepthBuffer);
        projectionMatrix.addAtIndex(8, camera.position.x / (screenHalfHeight * aspectRatio));
        projectionMatrix.addAtIndex(9, camera.position.y / screenHalfHeight);
        camera._projectionMatrix.copyFrom(projectionMatrix);
    }
}