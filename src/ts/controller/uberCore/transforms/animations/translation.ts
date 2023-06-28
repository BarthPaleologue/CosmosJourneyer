import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { BasicTransform } from "../basicTransform";
import { easeInOutInterpolation } from "./interpolations";

export class TransformTranslationAnimation {
    private clock = 0;
    private duration: number;
    private distanceAcc = 0;
    private readonly totalDistance;
    private readonly direction: Vector3;
    private readonly transform: BasicTransform;

    constructor(transform: BasicTransform, targetPosition: Vector3, duration: number) {
        this.transform = transform;
        this.duration = duration;
        this.totalDistance = targetPosition.subtract(transform.getAbsolutePosition()).length();
        this.direction = targetPosition.subtract(transform.getAbsolutePosition()).normalizeToNew();
    }

    update(deltaTime: number) {
        if (this.isFinished()) return;

        this.clock += deltaTime;

        const dDistance = this.totalDistance * easeInOutInterpolation(this.clock / this.duration) - this.distanceAcc;
        this.distanceAcc += dDistance;

        this.transform.translate(this.direction.scale(dDistance));
    }

    isFinished(): boolean {
        return this.clock >= this.duration;
    }
}