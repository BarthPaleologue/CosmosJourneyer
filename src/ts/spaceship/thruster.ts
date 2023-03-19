import { Vector3 } from "@babylonjs/core/Maths/math";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { DirectionnalParticleSystem } from "../utils/particleSystem";

export class Thruster {
    readonly plume: DirectionnalParticleSystem;
    readonly mesh: AbstractMesh;

    readonly maxAuthority = 2e3;

    private throttle = 0;

    private direction: Vector3;

    constructor(mesh: AbstractMesh, direction: Vector3) {
        this.mesh = mesh;
        this.direction = direction;
        this.plume = new DirectionnalParticleSystem(mesh, this.direction);
    }

    public setThrottle(throttle: number): void {
        this.throttle = throttle;
    }

    public increaseThrottle(delta: number): void {
        console.assert(delta >= 0);
        this.throttle = Math.min(1, this.throttle + delta);
    }

    public decreaseThrottle(delta: number): void {
        console.assert(delta >= 0);
        this.throttle = Math.max(0, this.throttle - delta);
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
        return Math.max(0, Vector3.Dot(this.direction, direction.negate())) * this.maxAuthority;
    }

    public getForwardAuthority(): number {
        return this.getAuthority(new Vector3(0, 0, -1));
    }

    public getBackwardAuthority(): number {
        return this.getAuthority(new Vector3(0, 0, 1));
    }

    public getUpwardAuthority(): number {
        return this.getAuthority(new Vector3(0, 1, 0));
    }

    public getRightAuthority(): number {
        return this.getAuthority(new Vector3(1, 0, 0));
    }

    public update(): void {
        this.plume.emitRate = this.throttle * 5;
        /*this.plume.setDirection(this.transform.getForwardDirection().negate());
        this.plume.applyAcceleration(this.transform.acceleration.negate());*/
    }
}