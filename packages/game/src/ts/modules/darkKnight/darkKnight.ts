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

import { PBRMetallicRoughnessMaterial } from "@babylonjs/core/Materials/PBR/pbrMetallicRoughnessMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import type { Scene } from "@babylonjs/core/scene";

import type { SystemContent } from "@/frontend/systemEntity/systemEntity";

import { CollisionMask } from "@/settings";

export class DarkKnight implements SystemContent {
    readonly radius: number;

    private readonly mesh: Mesh;

    private readonly material: PBRMetallicRoughnessMaterial;

    private aggregate: PhysicsAggregate | null = null;

    private readonly scene: Scene;

    constructor(scene: Scene) {
        this.radius = 100e3;

        this.mesh = MeshBuilder.CreateSphere("DarkKnight", { diameter: this.radius * 2, segments: 256 }, scene);
        this.mesh.receiveShadows = true;

        this.material = new PBRMetallicRoughnessMaterial("DarkKnightMaterial", scene);
        this.material.metallic = 1;
        this.material.roughness = 0.0;

        this.mesh.material = this.material;

        this.scene = scene;
    }

    getTransform(): TransformNode {
        return this.mesh;
    }

    update(observerPosition: Vector3) {
        const position = this.getTransform().getAbsolutePosition();
        const distance2 = Vector3.DistanceSquared(observerPosition, position);

        const activationThreshold = this.radius * 5;
        const deactivationThreshold = this.radius * 6;

        if (distance2 < activationThreshold ** 2 && this.aggregate === null) {
            this.aggregate = new PhysicsAggregate(this.mesh, PhysicsShapeType.SPHERE, { mass: 0 }, this.scene);
            this.aggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
            this.aggregate.shape.filterCollideMask = CollisionMask.EVERYTHING & ~CollisionMask.ENVIRONMENT;
            this.aggregate.body.disablePreStep = false;
        } else if (distance2 > deactivationThreshold ** 2 && this.aggregate !== null) {
            this.aggregate.dispose();
            this.aggregate = null;
        }
    }

    dispose(): void {
        this.aggregate?.dispose();
        this.mesh.dispose();
        this.material.dispose();
    }
}
