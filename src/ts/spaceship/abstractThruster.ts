import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Axis, Vector3 } from "@babylonjs/core/Maths/math";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { AbstractMesh, MeshBuilder } from "@babylonjs/core/Meshes";
import { DirectionnalParticleSystem } from "../utils/particleSystem";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";

export abstract class AbstractThruster {
    readonly mesh: AbstractMesh;

    readonly helperMesh: AbstractMesh;

    protected throttle = 0;

    readonly localNozzleDown: Vector3;

    readonly plume: DirectionnalParticleSystem;

    readonly parentAggregate: PhysicsAggregate;

    readonly leverage: number;

    protected abstract maxAuthority: number;

    constructor(mesh: AbstractMesh, direction: Vector3, parentAggregate: PhysicsAggregate) {
        this.mesh = mesh;

        this.leverage = this.mesh.position.length();

        this.localNozzleDown = direction;
        this.plume = new DirectionnalParticleSystem(mesh, this.localNozzleDown);

        this.parentAggregate = parentAggregate;

        const thrusterHelper = MeshBuilder.CreateCylinder(this.mesh.name + "Helper", { height: 0.5, diameterTop: 0, diameterBottom: 0.5 }, mesh.getScene());
        const cubeMaterial = new StandardMaterial("cubeMat", mesh.getScene());
        cubeMaterial.diffuseColor = Color3.White();
        cubeMaterial.emissiveColor = Color3.White();
        cubeMaterial.useLogarithmicDepth = true;
        thrusterHelper.material = cubeMaterial;
        thrusterHelper.parent = mesh;

        this.helperMesh = thrusterHelper;
        this.helperMesh.isVisible = false;
    }

    public getThrottle(): number {
        return this.throttle;
    }

    public setMaxAuthority(maxAuthority: number): void {
        this.maxAuthority = maxAuthority;
    }

    public getMaxAuthority(): number {
        return this.maxAuthority;
    }

    /**
     * Returns the authority of the thruster in the given direction
     * @param direction The direction (in local space)
     * @returns
     */
    public getAuthority(direction: Vector3): number {
        return this.getAuthority01(direction) * this.throttle * this.maxAuthority;
    }

    /**
     * Returns the theoretical authority of the thruster in the given direction between 0 and 1 (independent of throttle)
     * @param direction The direction (in local space)
     * @returns
     */
    public getAuthority01(direction: Vector3): number {
        return Math.max(0, Vector3.Dot(this.localNozzleDown.negate(), direction));
    }

    public getAuthorityAroundAxis01(rotationAxis: Vector3): number {
        const thrusterPosition = this.mesh.position;
        const thrusterPositionOnAxis = rotationAxis.scale(Vector3.Dot(thrusterPosition, rotationAxis));
        const thrusterPositionToAxis = thrusterPosition.subtract(thrusterPositionOnAxis);
        const leverage = thrusterPositionToAxis.length();
        const thrusterRotationAxis = Vector3.Cross(thrusterPositionToAxis, this.localNozzleDown);
        const authorityAroundAxis = Math.max(0, Vector3.Dot(thrusterRotationAxis, rotationAxis)) / leverage;
        return authorityAroundAxis;
    }

    public getAuthorityAroundAxis(rotationAxis: Vector3): number {
        return this.getAuthorityAroundAxis01(rotationAxis) * this.leverage * this.throttle * this.maxAuthority;
    }

    public update(): void {
        this.plume.emitRate = this.throttle * 1000;
        this.plume.setDirection(this.parentAggregate.transformNode.getDirection(Axis.Z).negate());
        //const parentAcceleration = this.parentAggregate.body.getL
        //this.plume.applyAcceleration(this.parent.acceleration.negate());

        if (this.throttle > 0) {
            this.helperMesh.scaling = new Vector3(0.8, 0.8, 0.8);
        } else {
            this.helperMesh.scaling = new Vector3(0.5, 0.5, 0.5);
        }
    }

    public abstract applyForce(): void;
}
