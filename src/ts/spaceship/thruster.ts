import { Vector3 } from "@babylonjs/core/Maths/math";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { DirectionnalParticleSystem } from "../utils/particleSystem";
import { NewtonianTransform } from "../uberCore/transforms/newtonianTransform";

export class Thruster {
    readonly plume: DirectionnalParticleSystem;
    readonly mesh: AbstractMesh;

    readonly maxAuthority = 2e3;

    private throttle = 0;

    private direction: Vector3;

    private parent: NewtonianTransform;

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

    public getDirection(): Vector3 {
        return this.direction;
    }

    /**
     * Returns the authority of the thruster in the given direction
     * @param direction The direction (in local space)
     * @returns
     */
    public getAuthority(direction: Vector3): number {
        return Math.max(0, Vector3.Dot(this.direction, direction.negate())) * this.maxAuthority * this.throttle;
    }

    /**
     * Returns the theoretical authority of the thruster in the given direction between 0 and 1 (independent of throttle)
     * @param direction The direction (in local space)
     * @returns
     */
    public getAuthority01(direction: Vector3): number {
        return Math.max(0, Vector3.Dot(this.direction, direction.negate()));
    }

    public update(): void {
        this.plume.emitRate = this.throttle * 1000;
        this.plume.setDirection(this.parent.getForwardDirection().negate());
        this.plume.applyAcceleration(this.parent.acceleration.negate());
    }
}
