import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { UberCamera } from "./uberCamera";
import { Scene } from "@babylonjs/core/scene";

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

        window.addEventListener("wheel", (e) => {
            this.increaseRadius(e.deltaY * Math.log(this.radius) * 0.01);
        });

        this.onViewMatrixChangedObservable.add(() => this.updatePosition());

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

    public increaseRadius(deltaRadius: number) {
        this.radius = Math.min(Math.max(this.radius + deltaRadius, 10), 1000);
        this.updatePosition();
    }

    public setRadius(radius: number) {
        this.radius = radius;
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
