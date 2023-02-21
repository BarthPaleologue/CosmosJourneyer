import { UberCamera } from "./uberCamera";
import { Scene, Vector3 } from "@babylonjs/core";

export class UberOrbitCamera extends UberCamera {
    private cameraTarget: Vector3;
    private radius: number;
    private phi: number;
    private theta: number;

    constructor(name: string, target: Vector3, scene: Scene, radius = 1, phi = 0, theta = 0) {
        super(name, Vector3.Zero(), scene);
        this.cameraTarget = target;
        this.radius = radius;
        this.phi = phi;
        this.theta = theta;

        this.updatePosition();
    }

    public rotateTheta(deltaTheta: number) {
        this.theta = Math.max(Math.min(this.theta + deltaTheta, 3), 0.14);
        this.updatePosition();
    }

    public rotatePhi(deltaPhi: number) {
        this.phi += deltaPhi;
        this.updatePosition();
    }

    public setTarget(target: Vector3) {
        super.setTarget(target);
        this.cameraTarget = target;
    }

    private updatePosition() {
        this.position.x = this.cameraTarget.x + this.radius * Math.sin(this.theta) * Math.sin(this.phi);
        this.position.z = this.cameraTarget.z + this.radius * Math.sin(this.theta) * Math.cos(this.phi);
        this.position.y = this.cameraTarget.y + this.radius * Math.cos(this.theta);
        this.setTarget(this.cameraTarget);
    }
}
