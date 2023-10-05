import { Vector3 } from "@babylonjs/core/Maths/math";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { AbstractThruster } from "./abstractThruster";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { getDownwardDirection, getForwardDirection, getUpwardDirection } from "../controller/uberCore/transforms/basicTransform";

export class MainThruster extends AbstractThruster {
    protected readonly maxAuthority = 3e3;

    constructor(mesh: AbstractMesh, direction: Vector3, parentAggregate: PhysicsAggregate) {
        super(mesh, direction, parentAggregate);
    }

    public setThrottle(throttle: number): void {
        this.throttle = throttle;
    }

    public updateThrottle(delta: number): void {
        this.throttle = Math.max(Math.min(1, this.throttle + delta), 0);
    }

    public applyForce(): void {
        const thrustDirection = getDownwardDirection(this.mesh);
        const force = thrustDirection.scale(200 * this.throttle);

        // make the ship spin (apply force at the position of the thruster then apply the same force at the center of mass in the opposite direction)
        this.parentAggregate.body.applyForce(force, this.mesh.getAbsolutePosition());
    }
}
