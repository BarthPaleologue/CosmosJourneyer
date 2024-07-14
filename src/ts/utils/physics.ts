
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { CollisionMask } from "../settings";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Scene } from "@babylonjs/core";

export function createEnvironmentAggregate(mesh: AbstractMesh, physicsShapeType: PhysicsShapeType, scene: Scene): PhysicsAggregate {
    const aggregate = new PhysicsAggregate(mesh, physicsShapeType, { mass: 0 }, scene);
    aggregate.body.disablePreStep = false;
    aggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
    aggregate.shape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS;

    return aggregate;
}