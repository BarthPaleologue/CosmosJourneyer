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

    readonly leverage: number;

    private maxAuthority = 1;

    constructor(mesh: AbstractMesh, direction: Vector3, parent: NewtonianTransform) {
        this.mesh = mesh;

        this.leverage = this.mesh.position.length();

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
        this.throttle = 0;
    }

    public getThrottle(): number {
        return this.throttle;
    }

    public setMaxAuthority(maxAuthority: number): void {
        this.maxAuthority = maxAuthority;
    }

    public getAuthority(direction: Vector3): number {
        return this.getAuthority01(direction) * this.throttle * this.maxAuthority;
    }

    public getAuthority01(direction: Vector3): number {
        return Math.max(0, Vector3.Dot(this.direction, direction.negate()));
    }

    public getAuthorityAroundAxis01(rotationAxis: Vector3): number {
        const thrusterPosition = this.mesh.position;
        const thrusterRotationAxis = Vector3.Cross(thrusterPosition, this.direction);
        const authorityAroundAxis = Math.max(0, Vector3.Dot(thrusterRotationAxis, rotationAxis)) / this.leverage;
        return authorityAroundAxis;
    }

    public getAuthorityAroundAxis(rotationAxis: Vector3): number {
        return this.getAuthorityAroundAxis01(rotationAxis) * this.leverage * this.throttle * this.maxAuthority;
    }

    public update(): void {
        this.plume.emitRate = this.throttle * 1000;
        this.plume.setDirection(this.parent.getForwardDirection().negate());
        this.plume.applyAcceleration(this.parent.acceleration.negate());
    }
}
