import { Transformable } from "../architecture/transformable";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene, Tools } from "@babylonjs/core";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Viewport } from "@babylonjs/core/Maths/math.viewport";
import { Camera } from "@babylonjs/core/Cameras/camera";

export class StereoCameras implements Transformable {
    private readonly transform: TransformNode;

    readonly leftEye: FreeCamera;
    readonly rightEye: FreeCamera;

    /**
     * The distance between the two cameras in meters (IPD)
     * @private
     */
    private interPupillaryDistance = 0.065;
    
    private distanceToFocalPlane = 0;

    private focalPlaneHalfHeight = 17;

    constructor(scene: Scene) {
        // This transform will be used as the parent of both eyes
        this.transform = new TransformNode("HeadTransform", scene);

        // left eye is on the left
        this.leftEye = new FreeCamera("LeftEye", new Vector3(-this.interPupillaryDistance / 2, 0, 0), scene);
        this.leftEye.viewport = new Viewport(0, 0.0, 0.5, 1);
        this.leftEye.fov = Tools.ToRadians(90);
        this.leftEye.parent = this.transform;
        this.leftEye.onProjectionMatrixChangedObservable.add(() => {
            this.updateCameraProjection(this.leftEye, -this.interPupillaryDistance / 2);
        });

        // right eye is on the right
        this.rightEye = new FreeCamera("RightEye", new Vector3(this.interPupillaryDistance / 2, 0, 0), scene);
        this.rightEye.viewport = new Viewport(0.5, 0, 0.5, 1);
        this.rightEye.fov = Tools.ToRadians(90);
        this.rightEye.parent = this.transform;
        this.rightEye.onProjectionMatrixChangedObservable.add(() => {
            this.updateCameraProjection(this.rightEye, this.interPupillaryDistance / 2);
        });
    }

    private updateCameraProjection(camera: Camera, cameraOffset: number) {
        const engine = camera.getEngine();
        const canvas = engine.getRenderingCanvas();
        if (canvas === null) {
            throw new Error("Canvas is null!");
        }

        const aspectRatio = canvas.width / canvas.height;
        
        camera.fov = Math.atan(this.focalPlaneHalfHeight / this.distanceToFocalPlane);

        const offset = cameraOffset;
        camera.position.x = offset;

        const projectionMatrix = Matrix.PerspectiveFovLH(camera.fov, aspectRatio, camera.minZ, camera.maxZ, engine.isNDCHalfZRange, camera.projectionPlaneTilt, engine.useReverseDepthBuffer);
        projectionMatrix.addAtIndex(8, offset / (this.focalPlaneHalfHeight * aspectRatio));
        camera._projectionMatrix.copyFrom(projectionMatrix);
    }

    /**
     * Set the distance between the two cameras in meters (IPD)
     * @param distance The distance between the two cameras in meters
     */
    setInterPupillaryDistance(distance: number) {
        this.interPupillaryDistance = distance;
    }

    /**
     * Returns the distance between the two cameras in meters (IPD)
     */
    getInterPupillaryDistance(): number {
        return this.interPupillaryDistance;
    }

    setDistanceToFocalPlane(distance: number) {
        this.distanceToFocalPlane = distance;
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
