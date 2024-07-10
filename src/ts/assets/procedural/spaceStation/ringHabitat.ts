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
import { RingHabitatMaterial } from "./ringHabitatMaterial";
import { Transformable } from "../../../architecture/transformable";
import { computeRingRotationPeriod } from "../../../utils/ringRotation";
import { Settings } from "../../../settings";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MetalSectionMaterial } from "./metalSectionMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { createEnvironmentAggregate } from "../../../utils/physics";
import { createRing } from "../../../utils/ringBuilder";
import { seededSquirrelNoise } from "squirrel-noise";

export class RingHabitat implements Transformable {
    private readonly root: TransformNode;

    private readonly rng: (index: number) => number;

    private readonly radius: number;

    private readonly ringMaterial: RingHabitatMaterial;
    private readonly metalSectionMaterial: MetalSectionMaterial;

    private readonly ring: Mesh;
    private ringAggregate: PhysicsAggregate | null = null;

    private readonly attachment: Mesh;
    private attachmentAggregate: PhysicsAggregate | null = null;

    private readonly arms: Mesh[] = [];
    private readonly armAggregates: PhysicsAggregate[] = [];

    readonly habitableSurface: number;

    constructor(requiredHabitableSurface: number, seed: number, scene: Scene) {
        this.root = new TransformNode("RingHabitatRoot", scene);

        this.rng = seededSquirrelNoise(seed);

        this.radius = 5e3 + this.rng(0) * 10e3;

        const deltaRadius = 500;

        const requiredHeight = requiredHabitableSurface / (2 * Math.PI * (this.radius + deltaRadius / 2));
        const yScaling = Math.ceil(requiredHeight / deltaRadius);
        const height = yScaling * deltaRadius;

        // adjust the radius to fit the required habitable surface
        this.radius = requiredHabitableSurface / (height * 2 * Math.PI) - deltaRadius / 2;

        const attachmentNbSides = 4 + 2 * Math.floor(this.rng(1) * 2);

        this.metalSectionMaterial = new MetalSectionMaterial(scene);

        this.habitableSurface = height * (2 * Math.PI * (this.radius + deltaRadius / 2));

        this.attachment = MeshBuilder.CreateCylinder(
            "RingHabitatAttachment",
            {
                diameterTop: 100,
                diameterBottom: 100,
                height: height * 1.5,
                tessellation: attachmentNbSides
            },
            scene
        );
        this.attachment.convertToFlatShadedMesh();
        this.attachment.material = this.metalSectionMaterial;
        this.attachment.rotate(Axis.Y, Math.PI / attachmentNbSides, Space.WORLD);
        this.attachment.parent = this.getTransform();

        const circumference = 2 * Math.PI * this.radius;

        const nbSteps = Math.ceil(circumference / deltaRadius);
        this.ring = createRing(this.radius, deltaRadius, height, nbSteps, scene);

        this.ringMaterial = new RingHabitatMaterial(circumference, deltaRadius, yScaling, scene);

        this.ring.material = this.ringMaterial;

        this.ring.parent = this.getTransform();

        const nbArms = attachmentNbSides / 2;
        for (let i = 0; i <= nbArms; i++) {
            const arm = MeshBuilder.CreateCylinder(
                `RingHabitatArm${i}`,
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

            const theta = (i / nbArms) * Math.PI * 2;

            arm.rotate(Axis.Y, theta, Space.WORLD);

            arm.parent = this.getTransform();

            this.arms.push(arm);
        }
    }

    update(stellarObjects: Transformable[], cameraWorldPosition: Vector3, deltaSeconds: number) {
        this.getTransform().rotate(Axis.Y, deltaSeconds / computeRingRotationPeriod(this.radius, Settings.G_EARTH));
        this.ringMaterial.update(stellarObjects);
        this.metalSectionMaterial.update(stellarObjects);

        const distanceToCamera = Vector3.Distance(cameraWorldPosition, this.getTransform().getAbsolutePosition());
        if(distanceToCamera < 350e3 && this.attachmentAggregate === null) {
            this.attachmentAggregate = createEnvironmentAggregate(this.attachment, PhysicsShapeType.MESH);
            this.arms.forEach(arm => {
                const armAggregate = createEnvironmentAggregate(arm, PhysicsShapeType.MESH);
                this.armAggregates.push(armAggregate);
            });
            this.ringAggregate = createEnvironmentAggregate(this.ring, PhysicsShapeType.MESH);
        } else if(distanceToCamera > 360e3 && this.attachmentAggregate !== null) {
            this.attachmentAggregate?.dispose();
            this.attachmentAggregate = null;

            this.armAggregates.forEach(armAggregate => armAggregate.dispose());
            this.armAggregates.length = 0;

            this.ringAggregate?.dispose();
            this.ringAggregate = null;
        }
    }

    getTransform(): TransformNode {
        return this.root;
    }

    dispose() {
        this.root.dispose();
        this.attachment.dispose();
        this.attachmentAggregate?.dispose();
        this.ring.dispose();
        this.ringAggregate?.dispose();
        this.ringMaterial.dispose();
        this.metalSectionMaterial.dispose();
        this.arms.forEach((arm) => arm.dispose());
        this.armAggregates.forEach((armAggregate) => armAggregate.dispose());
    }
}
