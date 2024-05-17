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

import { Transformable } from "../architecture/transformable";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Scene } from "@babylonjs/core";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Viewport } from "@babylonjs/core/Maths/math.viewport";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { setOffAxisProjection } from "./offAxisProjection";

export class StereoCameras implements Transformable {
    private readonly transform: TransformNode;

    readonly leftEye: FreeCamera;
    readonly rightEye: FreeCamera;

    /**
     * The distance between the two cameras in meters (IPD)
     * @private
     */
    private defaultIPD = 0.065;

    private defaultDistanceToScreen = 0.8;

    private screenHalfHeight = 0.17;

    private useOffAxisProjection = true;

    private useEyeTracking = false;

    /**
     * The position of the left eye given by the eye tracking
     */
    private eyeTrackingLeftPosition = Vector3.Zero();

    /**
     * The position of the right eye given by the eye tracking
     */
    private eyeTrackingRightPosition = Vector3.Zero();

    private readonly scene: Scene;

    constructor(scene: Scene) {
        // This transform will be used as the parent of both eyes
        this.transform = new TransformNode("HeadTransform", scene);

        // left eye is on the left
        this.leftEye = new FreeCamera("LeftEye", new Vector3(-this.defaultIPD / 2, 0, 0), scene);
        this.leftEye.viewport = new Viewport(0, 0.0, 0.5, 1);
        this.leftEye.minZ = 0.01;
        this.leftEye.parent = this.transform;
        this.leftEye.onProjectionMatrixChangedObservable.add((camera) => {
            const cameraOffset = !this.useEyeTracking ? new Vector3(-this.defaultIPD / 2, 0, -this.defaultDistanceToScreen) : this.eyeTrackingLeftPosition;
            setOffAxisProjection(camera, cameraOffset, this.screenHalfHeight, scene.useRightHandedSystem);
        });

        // right eye is on the right
        this.rightEye = new FreeCamera("RightEye", new Vector3(this.defaultIPD / 2, 0, 0), scene);
        this.rightEye.viewport = new Viewport(0.5, 0, 0.5, 1);
        this.rightEye.minZ = 0.01;
        this.rightEye.parent = this.transform;
        this.rightEye.onProjectionMatrixChangedObservable.add((camera) => {
            const cameraOffset = !this.useEyeTracking ? new Vector3(this.defaultIPD / 2, 0, -this.defaultDistanceToScreen) : this.eyeTrackingRightPosition;
            setOffAxisProjection(camera, cameraOffset, this.screenHalfHeight, scene.useRightHandedSystem);
        });

        this.scene = scene;
    }

    /**
     * Updates the projection matrices of the cameras with off-axis projection
     * @param camera
     * @param cameraOffset The camera position in local space
     */
    private updateCameraProjection(camera: Camera, cameraOffset: Vector3) {
        const engine = camera.getEngine();
        const canvas = engine.getRenderingCanvas();
        if (canvas === null) {
            throw new Error("Canvas is null!");
        }

        const aspectRatio = canvas.width / canvas.height;

        camera.position.x = cameraOffset.x;
        camera.position.y = cameraOffset.y;
        camera.position.z = -Math.abs(cameraOffset.z);

        if (this.scene.useRightHandedSystem) {
            camera.position.x *= -1;
            camera.position.z *= -1;
        }

        // the distance to the focal plane is the distance of the eye to the screen plane
        const distanceToFocalPlane = Math.abs(camera.position.z);

        camera.fov = 2 * Math.atan(this.screenHalfHeight / distanceToFocalPlane);

        const projectionMatrix = Matrix.PerspectiveFovLH(
            camera.fov,
            aspectRatio,
            camera.minZ,
            camera.maxZ,
            engine.isNDCHalfZRange,
            camera.projectionPlaneTilt,
            engine.useReverseDepthBuffer
        );
        if (this.useOffAxisProjection) {
            projectionMatrix.addAtIndex(8, cameraOffset.x / (this.screenHalfHeight * aspectRatio));
            projectionMatrix.addAtIndex(9, cameraOffset.y / this.screenHalfHeight);
        }
        camera._projectionMatrix.copyFrom(projectionMatrix);
    }

    setEyeTrackingEnabled(useEyeTracking: boolean) {
        this.useEyeTracking = useEyeTracking;
    }

    isEyeTrackingEnabled(): boolean {
        return this.useEyeTracking;
    }

    setOffAxisProjectionEnabled(enabled: boolean) {
        this.useOffAxisProjection = enabled;
    }

    isOffAxisProjectionEnabled(): boolean {
        return this.useOffAxisProjection;
    }

    setEyeTrackingPositions(leftEyePosition: Vector3, rightEyePosition: Vector3) {
        this.eyeTrackingLeftPosition = leftEyePosition;
        this.eyeTrackingRightPosition = rightEyePosition;
    }

    /**
     * Set the distance between the two cameras in meters (IPD)
     * @param distance The distance between the two cameras in meters
     */
    setDefaultIPD(distance: number) {
        this.defaultIPD = distance;
    }

    /**
     * Returns the distance between the two cameras in meters (IPD)
     */
    getDefaultIPD(): number {
        return this.defaultIPD;
    }

    setScreenHalfHeight(screenHalfHeight: number) {
        this.screenHalfHeight = screenHalfHeight;
    }

    getScreenHalfHeight(): number {
        return this.screenHalfHeight;
    }

    getTransform(): TransformNode {
        return this.transform;
    }

    updateCameraProjections() {
        this.leftEye.getProjectionMatrix(true);
        this.rightEye.getProjectionMatrix(true);
    }

    dispose() {
        this.leftEye.dispose();
        this.rightEye.dispose();
        this.transform.dispose();
    }
}
