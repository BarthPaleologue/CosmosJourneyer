import { Vector3 } from "@babylonjs/core/Maths/math";
import { Mesh, TransformNode } from "@babylonjs/core/Meshes";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeMesh } from "@babylonjs/core/Physics/v2/physicsShape";
import { Scene } from "@babylonjs/core/scene";
import { DirectionnalParticleSystem } from "../utils/particleSystem";

export class HoverThruster {
    private mesh: Mesh;

    private leverage: number | null = null;

    private torque: Vector3;

    private particleSystem: DirectionnalParticleSystem;

    private throttle = 0;

    constructor(mesh: Mesh) {
        this.mesh = mesh;
        this.particleSystem = new DirectionnalParticleSystem(mesh, this.getThrustDirection().negateInPlace());
        this.particleSystem.minEmitBox = new Vector3(-0.8, 0, -0.8);
        this.particleSystem.maxEmitBox = new Vector3(0.8, 0, 0.8);

        this.torque = Vector3.Cross(this.mesh.position, Vector3.Up());
    }

    initPhysics(parentNode: TransformNode, parentAggregate: PhysicsAggregate, scene: Scene) {
        const shape = new PhysicsShapeMesh(this.mesh, scene);
        parentAggregate.shape.addChildFromParent(parentNode, shape, this.mesh);

        const parentCenterOfMass = parentAggregate.body.getMassProperties().centerOfMass;
        if(parentCenterOfMass === undefined) throw new Error("Parent center of mass is undefined!");
        this.leverage = this.mesh.position.subtract(parentCenterOfMass).length();
    }

    getLeverage(): number {
        if(this.leverage === null) throw new Error("Leverage is null!");
        return this.leverage;
    }

    getTorque(): Vector3 {
        return this.torque;
    }

    getThrustDirection(): Vector3 {
        return this.mesh.getDirection(Vector3.Up());
    }

    getPosition(): Vector3 {
        return this.mesh.position;
    }

    getAbsolutePosition(): Vector3 {
        return this.mesh.getAbsolutePosition();
    }

    setThrottle(throttle: number) {
        this.throttle = throttle;
    }

    getThrottle(): number {
        return this.throttle;
    }

    update() {
        this.particleSystem.setDirection(this.getThrustDirection().negateInPlace());
        this.particleSystem.applyAcceleration(this.getThrustDirection().scaleInPlace(-10));
        this.particleSystem.emitRate = this.throttle * 5000;
    }
}