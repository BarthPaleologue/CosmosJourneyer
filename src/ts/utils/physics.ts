
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { CollisionMask } from "../settings";

export function createEnvironmentAggregate(mesh: Mesh, physicsShapeType: PhysicsShapeType): PhysicsAggregate {
    const aggregate = new PhysicsAggregate(mesh, physicsShapeType, { mass: 0 });
    aggregate.body.disablePreStep = false;
    aggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
    aggregate.shape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS;

    return aggregate;
}