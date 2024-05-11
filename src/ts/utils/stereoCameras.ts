import { Transformable } from "../architecture/transformable";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Viewport } from "@babylonjs/core/Maths/math.viewport";

export class StereoCameras implements Transformable {
    private readonly transform: TransformNode;

    readonly leftEye: FreeCamera;
    readonly rightEye: FreeCamera;

    /**
     * The distance between the two cameras in meters (IPD)
     * @private
     */
    private interPupillaryDistance = 0.065;

    constructor(canvas: HTMLCanvasElement, engine: Engine, scene: Scene) {
        // This transform will be used as the parent of both eyes
        this.transform = new TransformNode("HeadTransform", scene);

        // left eye is on the left
        this.leftEye = new FreeCamera("LeftEye", new Vector3(-this.interPupillaryDistance / 2, 0, 0), scene);
        this.leftEye.viewport = new Viewport(0, 0.0, 0.5, 1);
        this.leftEye.parent = this.transform;
        this.leftEye.onProjectionMatrixChangedObservable.add(() => {
            const aspectRatio = canvas.width / canvas.height;
            this.leftEye._projectionMatrix.copyFrom(
                Matrix.PerspectiveFovLH(
                    this.leftEye.fov,
                    aspectRatio,
                    this.leftEye.minZ,
                    this.leftEye.maxZ,
                    engine.isNDCHalfZRange,
                    this.leftEye.projectionPlaneTilt,
                    engine.useReverseDepthBuffer
                )
            );
        });

        // right eye is on the right
        this.rightEye = new FreeCamera("RightEye", new Vector3(this.interPupillaryDistance / 2, 0, 0), scene);
        this.rightEye.viewport = new Viewport(0.5, 0, 0.5, 1);
        this.rightEye.parent = this.transform;
        this.rightEye.onProjectionMatrixChangedObservable.add(() => {
            const aspectRatio = canvas.width / canvas.height;
            this.rightEye._projectionMatrix.copyFrom(
                Matrix.PerspectiveFovLH(
                    this.rightEye.fov,
                    aspectRatio,
                    this.rightEye.minZ,
                    this.rightEye.maxZ,
                    engine.isNDCHalfZRange,
                    this.rightEye.projectionPlaneTilt,
                    engine.useReverseDepthBuffer
                )
            );
        });
    }

    /**
     * Set the distance between the two cameras in meters (IPD)
     * @param distance The distance between the two cameras in meters
     */
    setInterPupillaryDistance(distance: number) {
        this.interPupillaryDistance = distance;
        this.leftEye.position.x = -this.interPupillaryDistance / 2;
        this.rightEye.position.x = this.interPupillaryDistance / 2;
    }

    /**
     * Returns the distance between the two cameras in meters (IPD)
     */
    getInterPupillaryDistance(): number {
        return this.interPupillaryDistance;
    }

    getTransform(): TransformNode {
        return this.transform;
    }

    dispose() {
        this.leftEye.dispose();
        this.rightEye.dispose();
        this.transform.dispose();
    }
}