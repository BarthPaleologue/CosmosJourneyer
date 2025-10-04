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

import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { type PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { type Scene } from "@babylonjs/core/scene";

import { type Textures } from "@/frontend/assets/textures";
import { createEnvironmentAggregate } from "@/frontend/helpers/havok";
import { type Transformable } from "@/frontend/universe/architecture/transformable";

import { getRngFromSeed } from "@/utils/getRngFromSeed";
import { EarthG } from "@/utils/physics/constants";
import { getRotationPeriodForArtificialGravity } from "@/utils/physics/physics";

import { CylinderHabitatMaterial } from "./cylinderHabitatMaterial";

export class CylinderHabitat implements Transformable {
    private readonly root: TransformNode;

    private readonly rng: (index: number) => number;

    private readonly radius: number;

    private readonly cylinderMaterial: CylinderHabitatMaterial;

    private readonly cylinder: Mesh;
    private cylinderAggregate: PhysicsAggregate | null = null;

    readonly habitableSurface: number;

    constructor(requiredHabitableSurface: number, seed: number, textures: Textures, scene: Scene) {
        this.root = new TransformNode("CylinderHabitatRoot", scene);

        this.rng = getRngFromSeed(seed);

        this.radius = 2e3 + this.rng(0) * 2e3;

        const height = requiredHabitableSurface / (2 * Math.PI * (this.radius / 2));

        this.habitableSurface = height * 2 * Math.PI * (this.radius / 2);

        const tesselation = 32;

        this.cylinder = MeshBuilder.CreateCylinder(
            "CylinderHabitat",
            {
                diameter: this.radius * 2,
                height: height,
                tessellation: tesselation,
            },
            scene,
        );
        this.cylinder.convertToFlatShadedMesh();

        this.cylinderMaterial = new CylinderHabitatMaterial(
            this.radius,
            height,
            tesselation,
            textures.materials.spaceStation,
            scene,
        );

        this.cylinder.material = this.cylinderMaterial;

        this.cylinder.parent = this.getTransform();
    }

    update(cameraWorldPosition: Vector3, deltaSeconds: number) {
        this.getTransform().rotate(Axis.Y, deltaSeconds / getRotationPeriodForArtificialGravity(this.radius, EarthG));

        const distanceToCamera = Vector3.Distance(cameraWorldPosition, this.getTransform().getAbsolutePosition());

        if (distanceToCamera < 350e3 && this.cylinderAggregate === null) {
            this.cylinderAggregate = createEnvironmentAggregate(
                this.cylinder,
                PhysicsShapeType.MESH,
                this.getTransform().getScene(),
            );
        } else if (distanceToCamera > 360e3 && this.cylinderAggregate !== null) {
            this.cylinderAggregate.dispose();
            this.cylinderAggregate = null;
        }
    }

    getTransform(): TransformNode {
        return this.root;
    }

    dispose() {
        this.root.dispose();
        this.cylinder.dispose();

        this.cylinderAggregate?.dispose();
        this.cylinderAggregate = null;

        this.cylinderMaterial.dispose();
    }
}
