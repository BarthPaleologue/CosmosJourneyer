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

import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Axis, PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core";
import { Space } from "@babylonjs/core/Maths/math.axis";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Transformable } from "../../../architecture/transformable";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { computeRingRotationPeriod } from "../../../utils/ringRotation";
import { Settings } from "../../../settings";
import { MetalSectionMaterial } from "./metalSectionMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { HelixHabitatMaterial } from "./helixHabitatMaterial";
import { createEnvironmentAggregate } from "../../../utils/physics";
import { createHelix } from "../../../utils/helixBuilder";
import { seededSquirrelNoise } from "squirrel-noise";

export class HelixHabitat implements Transformable {
    private readonly root: TransformNode;

    private readonly rng: (index: number) => number;

    private readonly radius: number;

    private readonly attachment: Mesh;
    private attachmentAggregate: PhysicsAggregate | null = null;

    private readonly helix1: Mesh;
    private readonly helix2: Mesh;

    private helix1Aggregate: PhysicsAggregate | null = null;
    private helix2Aggregate: PhysicsAggregate | null = null;

    private readonly helixMaterial: HelixHabitatMaterial;
    private readonly metalSectionMaterial: MetalSectionMaterial;

    private readonly arms: Mesh[] = [];
    private readonly armAggregates: PhysicsAggregate[] = [];

    constructor(requiredHabitableSurface: number, seed: number, scene: Scene) {
        this.root = new TransformNode("HelixHabitatRoot", scene);

        this.rng = seededSquirrelNoise(seed);

        this.radius = 5e3 + this.rng(0) * 10e3;
        const deltaRadius = 400 + this.rng(1) * 100;

        const thicknessMultipler = 1.0 + Math.floor(this.rng(3) * 2);

        const requiredHabitableSurfacePerHelix = requiredHabitableSurface / 2;

        const nbSpires = Math.ceil(requiredHabitableSurfacePerHelix / (2 * Math.PI * this.radius * deltaRadius * thicknessMultipler));

        this.radius = requiredHabitableSurfacePerHelix / (2 * Math.PI * nbSpires * deltaRadius * thicknessMultipler);

        const pitch = 2 * this.radius * (1 + 0.3 * (this.rng(2) * 2 - 1));

        const totalLength = pitch * nbSpires;

        const attachmentNbSides = 6 + 2 * Math.floor(this.rng(4) * 2);

        this.metalSectionMaterial = new MetalSectionMaterial(scene);

        this.attachment = MeshBuilder.CreateCylinder(
            "HelixHabitatAttachment",
            {
                diameterTop: 100,
                diameterBottom: 100,
                height: totalLength + deltaRadius * 4,
                tessellation: attachmentNbSides
            },
            scene
        );
        this.attachment.convertToFlatShadedMesh();
        this.attachment.material = this.metalSectionMaterial;
        this.attachment.rotate(Axis.Y, Math.PI / attachmentNbSides, Space.WORLD);
        this.attachment.parent = this.getTransform();

        const path = [];
        const tessellation = 360;
        const turns = nbSpires * tessellation;
        for (let i = 0; i < turns; i++) {
            const angle = Math.PI / 2 + (i * Math.PI * 2.0) / tessellation;
            const y = (i * pitch) / tessellation;
            path.push(new Vector3(this.radius * Math.sin(angle), y - (nbSpires * pitch) / 2, this.radius * Math.cos(angle)));
        }

        this.helix1 = createHelix(this.radius, deltaRadius, deltaRadius * thicknessMultipler, tessellation, nbSpires, pitch, scene);

        this.helix2 = this.helix1.clone();
        this.helix2.rotate(Axis.Y, Math.PI, Space.WORLD);

        this.helix1.parent = this.getTransform();
        this.helix2.parent = this.getTransform();

        this.helixMaterial = new HelixHabitatMaterial(this.radius, deltaRadius, thicknessMultipler, scene);

        this.helix1.material = this.helixMaterial;
        this.helix2.material = this.helixMaterial;

        const nbArms = (attachmentNbSides * nbSpires) / 2;
        for (let i = 0; i <= nbArms; i++) {
            const arm = MeshBuilder.CreateCylinder(
                `HelixHabitatArm${i}`,
                {
                    height: 2 * this.radius,
                    diameter: deltaRadius / 3,
                    tessellation: 6
                },
                scene
            );
            arm.convertToFlatShadedMesh();
            arm.rotate(Axis.Z, Math.PI / 2, Space.LOCAL);
            arm.material = this.metalSectionMaterial;

            const y = (i / nbArms) * totalLength - totalLength / 2;

            const theta = (y / pitch) * Math.PI * 2;

            arm.position.y = y;
            arm.rotate(Axis.Y, theta, Space.WORLD);

            arm.parent = this.getTransform();

            this.arms.push(arm);
        }
    }

    update(stellarObjects: Transformable[], cameraWorldPosition: Vector3, deltaSeconds: number) {
        this.getTransform().rotate(Axis.Y, deltaSeconds / computeRingRotationPeriod(this.radius, Settings.G_EARTH));
        this.helixMaterial.update(stellarObjects);
        this.metalSectionMaterial.update(stellarObjects);

        const distanceToCamera = Vector3.Distance(cameraWorldPosition, this.getTransform().getAbsolutePosition());

        if (distanceToCamera < 350e3 && this.attachmentAggregate === null) {
            this.attachmentAggregate = createEnvironmentAggregate(this.attachment, PhysicsShapeType.MESH);
            this.helix1Aggregate = createEnvironmentAggregate(this.helix1, PhysicsShapeType.MESH);
            this.helix2Aggregate = createEnvironmentAggregate(this.helix2, PhysicsShapeType.MESH);

            this.arms.forEach(arm => {
                const armAggregate = createEnvironmentAggregate(arm, PhysicsShapeType.MESH);
                this.armAggregates.push(armAggregate);
            });
        } else if (distanceToCamera > 360e3 && this.attachmentAggregate !== null) {
            this.attachmentAggregate?.dispose();
            this.attachmentAggregate = null;

            this.helix1Aggregate?.dispose();
            this.helix1Aggregate = null;

            this.helix2Aggregate?.dispose();
            this.helix2Aggregate = null;

            this.armAggregates.forEach(armAggregate => armAggregate.dispose());
            this.armAggregates.length = 0;
        }
    }

    getTransform(): TransformNode {
        return this.root;
    }

    dispose() {
        this.root.dispose();

        this.attachment.dispose();

        this.attachmentAggregate?.dispose();
        this.attachmentAggregate = null;

        this.helixMaterial.dispose();
        this.metalSectionMaterial.dispose();
        
        this.helix1.dispose();
        this.helix2.dispose();
        
        this.helix1Aggregate?.dispose();
        this.helix1Aggregate = null;

        this.helix2Aggregate?.dispose();
        this.helix2Aggregate = null;

        this.arms.forEach((arm) => arm.dispose());
        this.arms.length = 0;

        this.armAggregates.forEach(armAggregate => armAggregate.dispose());
        this.armAggregates.length = 0;
    }
}
