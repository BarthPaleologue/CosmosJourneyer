//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeContainer } from "@babylonjs/core/Physics/v2/physicsShape";
import type { PhysicsShape } from "@babylonjs/core/Physics/v2/physicsShape";
import type { Scene } from "@babylonjs/core/scene";

import { CollisionMask } from "@/settings";

/**
 * Creates a physics shape for a mesh.
 */
export type PhysicsShapeFactory = (mesh: Mesh, scene: Scene) => PhysicsShape;

/**
 * Creates a shape container matching the meshes under a transform hierarchy.
 *
 * Each mesh descendant gets one shape positioned relatively to `root`; non-mesh
 * descendants are ignored. The caller owns the returned container and shapes, and
 * can configure them after creation.
 * @param root - Root of the hierarchy used for collision.
 * @param scene - Scene that owns the created physics resources.
 * @param createShape - Creates the shape used for each mesh.
 * @returns The container and the shapes it references.
 */
export function createPhysicsShapesFromHierarchy(
    root: TransformNode,
    scene: Scene,
    createShape: PhysicsShapeFactory,
): { container: PhysicsShapeContainer; shapes: Array<PhysicsShape> } {
    const container = new PhysicsShapeContainer(scene);
    const shapes: Array<PhysicsShape> = [];
    for (const mesh of root.getChildMeshes()) {
        if (!(mesh instanceof Mesh)) {
            continue;
        }

        const shape = createShape(mesh, scene);
        shapes.push(shape);
        container.addChildFromParent(root, shape, mesh);
    }

    return { container, shapes };
}

/**
 * Creates a massless environment collider that collides with dynamic objects.
 * @param mesh - Mesh whose geometry or physics is being updated.
 * @param physicsShapeType - Collision shape used for the environment mesh.
 * @param scene - Scene that owns the created resources.
 * @returns The configured aggregate, owned by the caller.
 */
export function createEnvironmentAggregate(
    mesh: AbstractMesh,
    physicsShapeType: PhysicsShapeType,
    scene: Scene,
): PhysicsAggregate {
    const aggregate = new PhysicsAggregate(mesh, physicsShapeType, { mass: 0 }, scene);
    aggregate.body.disablePreStep = false;
    aggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
    aggregate.shape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS;

    return aggregate;
}

/**
 * Switches an aggregate’s collision filter between every category and none.
 * @param aggregate - Physics aggregate whose collision mask is updated.
 * @param enabled - Whether collisions should be enabled.
 */
export function setCollisionsEnabled(aggregate: PhysicsAggregate, enabled: boolean): void {
    aggregate.shape.filterCollideMask = enabled ? CollisionMask.EVERYTHING : CollisionMask.NONE;
}
