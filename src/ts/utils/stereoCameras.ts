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
import { Viewport } from "@babylonjs/core/Maths/math.viewport";
import { setOffAxisProjection } from "./offAxisProjection";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export class StereoCameras implements Transformable {
    /**
     * The frame of reference for the left and right cameras.
     * @private
     */
    private readonly transform: TransformNode;

    /**
     * The camera used to render the left eye view.
     */
    readonly leftEye: FreeCamera;

    /**
     * The camera used to render the right eye view.
     */
    readonly rightEye: FreeCamera;

    /**
     * IPD stands for Inter-Pupillary Distance.
     * 
     * When not using the eye tracking data, this value is used instead to move apart the eye cameras.
     * The average IPD for a human is 65mm, you can change it to fit your own eye configuration.
     * @private
     */
    private defaultIPD = 0.065;

    private defaultDistanceToScreen = 0.8;

    private useEyeTracking = false;

    /**
     * The position of the left eye given by the eye tracking
     */
    private eyeTrackingLeftPosition = Vector3.Zero();

    /**
     * The position of the right eye given by the eye tracking
     */
    private eyeTrackingRightPosition = Vector3.Zero();

    constructor(screenHalfHeight: number, scene: Scene) {
        // This transform will be used as the parent of both eyes
        this.transform = new TransformNode("HeadTransform", scene);

        // left eye is on the left
        this.leftEye = new FreeCamera("LeftEye", new Vector3(-this.defaultIPD / 2, 0, 0), scene);
        this.leftEye.viewport = new Viewport(0, 0.0, 0.5, 1);
        this.leftEye.minZ = 0.01;
        this.leftEye.parent = this.transform;
        this.leftEye.onProjectionMatrixChangedObservable.add((camera) => {
            const cameraOffset = !this.useEyeTracking ? new Vector3(-this.defaultIPD / 2, 0, -this.defaultDistanceToScreen) : this.eyeTrackingLeftPosition;
            setOffAxisProjection(camera, cameraOffset, screenHalfHeight, scene.useRightHandedSystem);
        });

        // right eye is on the right
        this.rightEye = new FreeCamera("RightEye", new Vector3(this.defaultIPD / 2, 0, 0), scene);
        this.rightEye.viewport = new Viewport(0.5, 0, 0.5, 1);
        this.rightEye.minZ = 0.01;
        this.rightEye.parent = this.transform;
        this.rightEye.onProjectionMatrixChangedObservable.add((camera) => {
            const cameraOffset = !this.useEyeTracking ? new Vector3(this.defaultIPD / 2, 0, -this.defaultDistanceToScreen) : this.eyeTrackingRightPosition;
            setOffAxisProjection(camera, cameraOffset, screenHalfHeight, scene.useRightHandedSystem);
        });
    }

    setEyeTrackingEnabled(useEyeTracking: boolean) {
        this.useEyeTracking = useEyeTracking;
    }

    isEyeTrackingEnabled(): boolean {
        return this.useEyeTracking;
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
