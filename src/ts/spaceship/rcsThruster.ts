import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { AbstractThruster } from "./abstractThruster";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { getDownwardDirection } from "../controller/uberCore/transforms/basicTransform";

export class RCSThruster extends AbstractThruster {
    protected override maxAuthority = 10;

    constructor(mesh: AbstractMesh, direction: Vector3, parentAggregate: PhysicsAggregate) {
        super(mesh, direction, parentAggregate);

        this.plume.maxSize = 0.3;
        this.plume.minSize = 0.3;

        this.plume.minLifeTime = 0.2;
        this.plume.maxLifeTime = 0.2;
    }

    public activate(): void {
        this.throttle = 1;
    }

    public setThrottle(throttle: number): void {
        if(throttle < 0 || throttle > 1) throw new Error("Throttle must be between 0 and 1");
        this.throttle = throttle;
    }

    public deactivate(): void {
        this.throttle = 0;
    }

    public applyForce(): void {
        const nozzleDirection = getDownwardDirection(this.mesh);
        const thrustDirection = nozzleDirection.negate();
        const force = thrustDirection.scale(this.maxAuthority * this.throttle);
        //console.log(this.maxAuthority, this.throttle, this.leverage);

        // make the ship spin (apply force at the position of the thruster then apply the same force at the center of mass in the opposite direction)
        this.parentAggregate.body.applyForce(force, this.mesh.getAbsolutePosition());
        this.parentAggregate.body.applyForce(force.negate(), this.parentAggregate.body.getObjectCenterWorld());
    }
}
