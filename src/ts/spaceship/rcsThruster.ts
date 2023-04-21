import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Thruster } from "./thruster";
import { NewtonianTransform } from "../uberCore/transforms/newtonianTransform";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { DirectionnalParticleSystem } from "../utils/particleSystem";

export class RCSThruster implements Thruster {
    readonly mesh: AbstractMesh;

    private throttle = 0;

    private direction: Vector3;

    readonly plume: DirectionnalParticleSystem;

    readonly parent: NewtonianTransform;

    readonly maxAuthority = 100;

    constructor(mesh: AbstractMesh, direction: Vector3, parent: NewtonianTransform) {
        this.mesh = mesh;

        this.direction = direction;
        this.plume = new DirectionnalParticleSystem(mesh, this.direction);
        this.plume.maxSize = 0.3;
        this.plume.minSize = 0.3;

        this.plume.minLifeTime = 0.2;
        this.plume.maxLifeTime = 0.2;

        this.parent = parent;
    }

    public activate(): void {
        this.throttle = 1;
    }

    public deactivate(): void {
        if (this.throttle === 1) console.trace("deactivated");
        this.throttle = 0;
    }

    public getThrottle(): number {
        return this.throttle;
    }

    public getAuthority(direction: Vector3): number {
        return this.getAuthority01(direction) * this.throttle * this.maxAuthority;
    }

    public getAuthority01(direction: Vector3): number {
        return Math.max(0, Vector3.Dot(this.direction, direction.negate()));
    }

    public update(): void {
        this.plume.emitRate = this.throttle * 1000;
        if (this.throttle > 0) console.log(this.throttle);
        this.plume.setDirection(this.parent.getForwardDirection().negate());
        this.plume.applyAcceleration(this.parent.acceleration.negate());
    }
}
