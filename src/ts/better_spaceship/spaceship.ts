import { InstancedMesh, Mesh } from "@babylonjs/core/Meshes";
import { Assets } from "../controller/assets";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsShapeMesh } from "@babylonjs/core/Physics/v2/physicsShape";
import { Scene } from "@babylonjs/core/scene";

export class Spaceship {
    instanceRoot: InstancedMesh;

    aggregate: PhysicsAggregate | null = null;

    constructor(scene: Scene) {
        if (!Assets.IS_READY) throw new Error("Assets are not ready yet!");
        this.instanceRoot = Assets.CreateEndeavorSpaceShipInstance();
    }

    initPhysics(scene: Scene) {
        this.aggregate = new PhysicsAggregate(this.instanceRoot
            , PhysicsShapeType.CONTAINER, { mass: 10, restitution: 0.2 }, scene);
        for (const child of this.instanceRoot.getChildMeshes()) {
            const childShape = new PhysicsShapeMesh(child as Mesh, scene);
            this.aggregate.shape.addChildFromParent(this.instanceRoot, childShape, child);
        }
    }

    getAggregate(): PhysicsAggregate {
        if (this.aggregate === null) throw new Error("Aggregate is null!");
        return this.aggregate;
    }
}