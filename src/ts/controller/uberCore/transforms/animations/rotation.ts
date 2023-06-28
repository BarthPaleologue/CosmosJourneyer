import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { BasicTransform } from "../basicTransform";
import { easeInOutInterpolation } from "./interpolations";

export class TransformRotationAnimation {
    private clock = 0;
    private duration: number;
    private thetaAcc = 0;
    private readonly totalTheta;
    private readonly axis;
    private readonly transform: BasicTransform;

    constructor(transform: BasicTransform, axis: Vector3, theta: number, duration: number) {
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

        this.transform.rotate(this.axis, dtheta);
    }

    isFinished(): boolean {
        return this.clock >= this.duration;
    }
}
