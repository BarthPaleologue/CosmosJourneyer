import { Vector3 } from "@babylonjs/core/Maths/math";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { NewtonianTransform } from "../uberCore/transforms/newtonianTransform";
import { Thruster } from "./thruster";
import { AbstractThruster } from "./abstractThruster";

export class MainThruster extends AbstractThruster implements Thruster {
    protected readonly maxAuthority = 3e3;

    constructor(mesh: AbstractMesh, direction: Vector3, parent: NewtonianTransform) {
        super(mesh, direction, parent);
    }

    public setThrottle(throttle: number): void {
        this.throttle = throttle;
    }

    public updateThrottle(delta: number): void {
        this.throttle = Math.max(Math.min(1, this.throttle + delta), 0);
    }
}
