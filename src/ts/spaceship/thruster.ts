import { Vector3 } from "@babylonjs/core/Maths/math";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { DirectionnalParticleSystem } from "../utils/particleSystem";

class LOCAL_DIRECTION {
    static readonly FORWARD = new Vector3(0, 0, 1);
    static readonly BACKWARD = new Vector3(0, 0, -1);
    static readonly UP = new Vector3(0, 1, 0);
    static readonly DOWN = new Vector3(0, -1, 0);
    static readonly RIGHT = new Vector3(1, 0, 0);
    static readonly LEFT = new Vector3(-1, 0, 0);
}

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
        //console.log(this.direction.toString(), direction.toString());
        return Math.max(0, Vector3.Dot(this.direction, direction.negate()));
    }

    public getForwardAuthority01(): number {
        return this.getAuthority01(LOCAL_DIRECTION.FORWARD);
    }

    public getBackwardAuthority01(): number {
        return this.getAuthority01(LOCAL_DIRECTION.BACKWARD);
    }

    public getUpwardAuthority01(): number {
        return this.getAuthority01(LOCAL_DIRECTION.UP);
    }

    public getDownwardAuthority01(): number {
        return this.getAuthority01(LOCAL_DIRECTION.DOWN);
    }

    public getRightAuthority01(): number {
        return this.getAuthority01(LOCAL_DIRECTION.RIGHT);
    }

    public getLeftAuthority01(): number {
        return this.getAuthority01(LOCAL_DIRECTION.LEFT);
    }

    public update(): void {
        this.plume.emitRate = this.throttle * 1000;
        /*this.plume.setDirection(this.transform.getForwardDirection().negate());
        this.plume.applyAcceleration(this.transform.acceleration.negate());*/
    }
}