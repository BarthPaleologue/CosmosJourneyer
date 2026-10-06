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

import type { Material } from "@babylonjs/core/Materials/material";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import type { Scene } from "@babylonjs/core/scene";

import type { SystemContent } from "@/frontend/systemEntity/systemEntity";

import { CollisionMask } from "@/settings";

export type MonolithModel = {
    type: "monolith";
};

export class Monolith implements SystemContent {
    private readonly mesh: Mesh;

    private readonly material: Material;

    private aggregate: PhysicsAggregate | null = null;

    private readonly scene: Scene;

    constructor(scene: Scene) {
        const height = 6;
        this.mesh = CreateBox("Monolith", { width: 2, height, depth: 0.5 }, scene);
        this.mesh.position.y = height / 2;
        this.mesh.bakeCurrentTransformIntoVertices();

        const material = new PBRMaterial("MonolithMaterial", scene);
        material.metallic = 0;
        material.roughness = 0.3;
        material.albedoColor.set(0, 0, 0);

        this.material = material;
        this.mesh.material = this.material;

        this.scene = scene;
    }

    update(observerPosition: Vector3) {
        const position = this.getTransform().getAbsolutePosition();
        const distance2 = Vector3.DistanceSquared(observerPosition, position);

        const activationThreshold = 10e3;
        const deactivationThreshold = 12e3;

        if (distance2 < activationThreshold ** 2 && this.aggregate === null) {
            this.aggregate = new PhysicsAggregate(this.mesh, PhysicsShapeType.BOX, { mass: 0 }, this.scene);
            this.aggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
            this.aggregate.shape.filterCollideMask = CollisionMask.EVERYTHING & ~CollisionMask.ENVIRONMENT;
            this.aggregate.body.disablePreStep = false;
        } else if (distance2 > deactivationThreshold ** 2 && this.aggregate !== null) {
            this.aggregate.dispose();
            this.aggregate = null;
        }
    }

    getTransform() {
        return this.mesh;
    }

    dispose() {
        this.aggregate?.dispose();
        this.mesh.dispose();
        this.material.dispose();
    }
}
