import { Scene } from "@babylonjs/core/scene";
import { BasicTransform } from "./basicTransform";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export class NewtonianTransform extends BasicTransform {
    speed: Vector3 = Vector3.Zero();
    acceleration: Vector3 = Vector3.Zero();
    rotationSpeed: Vector3 = Vector3.Zero();
    rotationAcceleration: Vector3 = Vector3.Zero();

    constructor(name: string, scene: Scene) {
        super(name, scene);
    }

    public update(deltaTime: number): Vector3 {
        this.speed.addInPlace(this.acceleration.scale(deltaTime));
        this.translate(this.speed.scale(deltaTime));

        this.rotationSpeed.addInPlace(this.rotationAcceleration.scale(deltaTime));
        this.roll(this.rotationSpeed.x);
        this.pitch(this.rotationSpeed.y);
        this.yaw(this.rotationSpeed.z);

        return this.getAbsolutePosition();
    }
}
