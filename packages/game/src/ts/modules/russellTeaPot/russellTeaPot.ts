//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import type { AssetContainer, InstantiatedEntries } from "@babylonjs/core/assetContainer";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import type { PhysicsShape, PhysicsShapeContainer } from "@babylonjs/core/Physics/v2/physicsShape";
import { PhysicsShapeConvexHull } from "@babylonjs/core/Physics/v2/physicsShape";
import { err, ok } from "@cosmos-journeyer/typescript";
import type { Result } from "@cosmos-journeyer/typescript";

import type { ModuleAssets } from "@/frontend/assets/moduleAssets";
import { getBoundingRadius } from "@/frontend/helpers/boundingRadius";
import { createPhysicsShapesFromHierarchy } from "@/frontend/helpers/havok";
import type { SystemContent } from "@/frontend/systemEntity/systemEntity";

import { CollisionMask } from "@/settings";

import { russellTeapotAssetId } from "./russellTeaPotModel";

/**
 * Instance-owned presentation of the Russell teapot.
 *
 * The container belongs to the module asset registry, while this class owns only
 * the instantiated nodes and its root transform. Disposing an instance therefore
 * leaves the shared geometries and materials available for future star systems.
 */
export class RussellTeaPot implements SystemContent {
    private readonly transform: TransformNode;
    private readonly instances: InstantiatedEntries;
    private readonly shapeContainer: PhysicsShapeContainer;
    private readonly shapes: ReadonlyArray<PhysicsShape>;
    private aggregate: PhysicsAggregate | null = null;
    readonly radius: number;

    /**
     * @param moduleAssets Assets loaded for the game modules.
     * @returns A teapot instance, or an error if its container was not loaded.
     */
    public static New(moduleAssets: ModuleAssets): Result<RussellTeaPot, Error> {
        const container = moduleAssets.getContainer(russellTeapotAssetId);
        if (container === undefined) {
            return err(new Error(`Missing Russell teapot asset "${russellTeapotAssetId}"`));
        }

        return ok(new RussellTeaPot(container));
    }

    /**
     * @param container Loaded teapot container owned by the module asset registry.
     */
    private constructor(container: AssetContainer) {
        this.transform = new TransformNode("russellTeaPot", container.scene);
        this.instances = container.instantiateModelsToScene();
        for (const rootNode of this.instances.rootNodes) {
            rootNode.parent = this.transform;
        }
        for (const mesh of this.transform.getChildMeshes()) {
            mesh.receiveShadows = true;
        }
        this.radius = getBoundingRadius(this.transform);

        // A convex hull is precise enough for an unassuming teapot and much cheaper than its detailed mesh.
        const physicsShapes = createPhysicsShapesFromHierarchy(
            this.transform,
            container.scene,
            (mesh, scene) => new PhysicsShapeConvexHull(mesh, scene),
        );
        for (const shape of physicsShapes.shapes) {
            shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
            shape.filterCollideMask = CollisionMask.EVERYTHING & ~CollisionMask.ENVIRONMENT;
            shape.material = { friction: 0.2, restitution: 0.2 };
        }
        this.shapeContainer = physicsShapes.container;
        this.shapes = physicsShapes.shapes;
    }

    public getTransform(): TransformNode {
        return this.transform;
    }

    public update(observerPosition: Vector3): void {
        const distanceSquared = Vector3.DistanceSquared(observerPosition, this.transform.getAbsolutePosition());

        const activationThreshold = this.radius * 30;
        const deactivationThreshold = this.radius * 35;

        if (distanceSquared < activationThreshold ** 2 && this.aggregate === null) {
            this.aggregate = new PhysicsAggregate(
                this.transform,
                this.shapeContainer,
                { mass: 0 },
                this.transform.getScene(),
            );
            this.aggregate.body.disablePreStep = false;
        } else if (distanceSquared > deactivationThreshold ** 2 && this.aggregate !== null) {
            this.aggregate.dispose();
            this.aggregate = null;
        }
    }

    public dispose(): void {
        this.aggregate?.dispose();
        this.aggregate = null;
        this.shapeContainer.dispose();
        for (const shape of this.shapes.toReversed()) {
            shape.dispose();
        }
        this.instances.dispose();
        this.transform.dispose();
    }
}
