import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math";
import { Mesh, TransformNode } from "@babylonjs/core/Meshes";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeBox } from "@babylonjs/core/Physics/v2/physicsShape";
import { Scene } from "@babylonjs/core/scene";
import { DirectionnalParticleSystem } from "../utils/particleSystem";

export class Thruster {
    private mesh: Mesh;
    private torque: Vector3;

    private particleSystem: DirectionnalParticleSystem;

    private throttle = 0;

    readonly maxForce = 100;

    constructor(mesh: Mesh) {
        this.mesh = mesh;
        this.particleSystem = new DirectionnalParticleSystem(mesh, this.getThrustDirection().negateInPlace());

        const minY = this.mesh.getBoundingInfo().boundingBox.extendSize.y;
        this.particleSystem.minEmitBox = new Vector3(-0.8, -minY, -0.8);
        this.particleSystem.maxEmitBox = new Vector3(0.8, -minY, 0.8);

        this.torque = Vector3.Cross(this.mesh.position, Vector3.Up());
    }

    initPhysics(parentNode: TransformNode, parentAggregate: PhysicsAggregate, scene: Scene) {
        const shape = new PhysicsShapeBox(Vector3.Zero(), Quaternion.Identity(), this.mesh.getBoundingInfo().boundingBox.extendSize.scale(2), scene);
        parentAggregate.shape.addChildFromParent(parentNode, shape, this.mesh);
    }

    getBaseTorque(): Vector3 {
        return this.torque;
    }

    getTorque(): Vector3 {
        return this.getBaseTorque().scale(this.throttle);
    }

    getThrustDirection(): Vector3 {
        return this.mesh.getDirection(Vector3.Up());
    }

    getThrustForce(): Vector3 {
        return this.getThrustDirection().scale(this.throttle * this.maxForce);
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
        this.particleSystem.applyAcceleration(this.getThrustDirection().scaleInPlace(-100));
        this.particleSystem.emitRate = this.throttle * 10000;
    }
}
