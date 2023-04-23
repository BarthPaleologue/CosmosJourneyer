import { Vector3 } from "@babylonjs/core/Maths/math";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { DirectionnalParticleSystem } from "../utils/particleSystem";
import { NewtonianTransform } from "../uberCore/transforms/newtonianTransform";
import { Thruster } from "./thruster";

export class MainThruster implements Thruster {
    readonly mesh: AbstractMesh;

    readonly plume: DirectionnalParticleSystem;

    private readonly maxAuthority = 2e3;

    private throttle = 0;

    private direction: Vector3;

    readonly parent: NewtonianTransform;

    constructor(mesh: AbstractMesh, direction: Vector3, parent: NewtonianTransform) {
        this.mesh = mesh;

        this.direction = direction;
        this.plume = new DirectionnalParticleSystem(mesh, this.direction);
        this.parent = parent;
    }

    public setThrottle(throttle: number): void {
        this.throttle = throttle;
    }

    public updateThrottle(delta: number): void {
        this.throttle = Math.max(Math.min(1, this.throttle + delta), 0);
    }

    public getThrottle(): number {
        return this.throttle;
    }

    public getAuthority(direction: Vector3): number {
        return this.getAuthority01(direction) * this.maxAuthority * this.throttle;
    }

    public getAuthority01(direction: Vector3): number {
        return Math.max(0, Vector3.Dot(this.direction, direction.negate()));
    }

    public update(): void {
        this.plume.emitRate = this.throttle * 1000;
        this.plume.setDirection(this.parent.getForwardDirection().negate());
        this.plume.applyAcceleration(this.parent.acceleration.negate());
    }
}
