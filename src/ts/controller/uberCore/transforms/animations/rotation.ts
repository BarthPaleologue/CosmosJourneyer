import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { easeInOutInterpolation } from "./interpolations";
import { TransformNode } from "@babylonjs/core/Meshes";
import { rotate } from "../basicTransform";

export class TransformRotationAnimation {
    private clock = 0;
    private duration: number;
    private thetaAcc = 0;
    private readonly totalTheta;
    private readonly axis;
    private readonly transform: TransformNode;

    constructor(transform: TransformNode, axis: Vector3, theta: number, duration: number) {
        this.transform = transform;
        this.axis = axis;
        this.totalTheta = theta;
        this.duration = duration;
    }

    update(deltaTime: number) {
        if (this.isFinished()) return;

        this.clock += deltaTime;

        const dtheta = this.totalTheta * easeInOutInterpolation(this.clock / this.duration) - this.thetaAcc;
        this.thetaAcc += dtheta;

        rotate(this.transform, this.axis, dtheta);
    }

    isFinished(): boolean {
        return this.clock >= this.duration;
    }
}
