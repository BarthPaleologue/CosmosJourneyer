import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Axis, Vector3 } from "@babylonjs/core/Maths/math";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { AbstractMesh, MeshBuilder } from "@babylonjs/core/Meshes";
import { DirectionnalParticleSystem } from "../utils/particleSystem";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { getDownwardDirection } from "../controller/uberCore/transforms/basicTransform";
import { LOCAL_DIRECTION } from "../controller/uberCore/localDirections";

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
     * Returns the theoretical authority of the thruster in the given direction between 0 and 1 (independent of throttle)
     * @param direction The direction (in local space)
     * @returns
     */
    public getAuthority01(direction: Vector3): number {
        return Math.max(0, Vector3.Dot(this.localNozzleDown.negate(), direction));
    }

    public getAuthorityAroundAxisNormalized(rotationAxis: Vector3): number {
        const thrusterPosition = this.mesh.position;
        const thrusterPositionOnAxis = rotationAxis.scale(Vector3.Dot(thrusterPosition, rotationAxis));

        const thrusterPositionToAxisNormalized = thrusterPosition.subtract(thrusterPositionOnAxis).normalize();

        const thrusterRotationAxis = Vector3.Cross(this.localNozzleDown.negate(), thrusterPositionToAxisNormalized);
        return Vector3.Dot(thrusterRotationAxis, rotationAxis);
    }

    public getRollAuthorityNormalized(): number {
        return this.getAuthorityAroundAxisNormalized(LOCAL_DIRECTION.FORWARD);
    }

    public getPitchAuthorityNormalized(): number {
        return this.getAuthorityAroundAxisNormalized(LOCAL_DIRECTION.RIGHT);
    }

    public update(): void {
        this.plume.emitRate = this.throttle * 1000;
        this.plume.setDirection(getDownwardDirection(this.parentAggregate.transformNode));
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
