import { Vector3 } from "@babylonjs/core/Maths/math";
import { Mesh, TransformNode } from "@babylonjs/core/Meshes";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeMesh } from "@babylonjs/core/Physics/v2/physicsShape";
import { Scene } from "@babylonjs/core/scene";

export class HoverThruster {
    private mesh: Mesh;

    private leverage: number | null = null;

    constructor(mesh: Mesh) {
        this.mesh = mesh;
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

    getThrustDirection(): Vector3 {
        return this.mesh.getDirection(Vector3.Up());
    }

    getPosition(): Vector3 {
        return this.mesh.position;
    }

    getAbsolutePosition(): Vector3 {
        return this.mesh.getAbsolutePosition();
    }
}