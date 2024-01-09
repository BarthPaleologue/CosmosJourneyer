import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { easeInOutInterpolation } from "./interpolations";
import { TransformNode } from "@babylonjs/core/Meshes";
import { translate } from "../basicTransform";
import { clamp } from "../../../utils/math";

export class TransformTranslationAnimation {
    private clock = 0;
    private readonly duration: number;
    private distanceAcc = 0;
    private readonly totalDistance;
    private readonly direction: Vector3;
    private readonly transform: TransformNode;

    constructor(transform: TransformNode, targetPosition: Vector3, duration: number) {
        this.transform = transform;
        this.duration = duration;
        this.totalDistance = targetPosition.subtract(transform.getAbsolutePosition()).length();
        this.direction = targetPosition.subtract(transform.getAbsolutePosition()).normalizeToNew();
    }

    update(deltaTime: number) {
        if (this.isFinished()) return;

        this.clock += deltaTime;

        const t = clamp(this.clock / this.duration, 0, 1);

        const dDistance = this.totalDistance * easeInOutInterpolation(t) - this.distanceAcc;
        this.distanceAcc += dDistance;

        translate(this.transform, this.direction.scale(dDistance));
    }

    isFinished(): boolean {
        return this.clock >= this.duration;
    }
}
