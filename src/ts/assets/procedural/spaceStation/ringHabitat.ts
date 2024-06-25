//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Axis, PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core";
import { Space } from "@babylonjs/core/Maths/math.axis";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { RingHabitatMaterial } from "./ringHabitatMaterial";
import { Transformable } from "../../../architecture/transformable";
import { computeRingRotationPeriod } from "../../../utils/ringRotation";
import { CollisionMask, Settings } from "../../../settings";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MetalSectionMaterial } from "./metalSectionMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { createTube } from "../../../utils/tubeBuilder";

export class RingHabitat implements Transformable {
    private readonly root: TransformNode;

    private readonly radius: number;

    private readonly ringMaterial: RingHabitatMaterial;
    private readonly metalSectionMaterial: MetalSectionMaterial;

    private readonly ring: Mesh;
    private readonly ringAggregate: PhysicsAggregate;

    private readonly attachment: Mesh;
    private readonly attachmentAggregate: PhysicsAggregate;

    private readonly arms: Mesh[] = [];
    private readonly armAggregates: PhysicsAggregate[] = [];

    constructor(scene: Scene) {
        this.root = new TransformNode("RingHabitatRoot", scene);

        this.radius = 5e3 + Math.random() * 10e3;

        const deltaRadius = 500;

        const attachmentNbSides = 4 + 2 * Math.floor(Math.random() * 2);

        this.metalSectionMaterial = new MetalSectionMaterial(scene);

        const heightFactor = 1 + Math.floor(Math.random() * 5);

        this.attachment = MeshBuilder.CreateCylinder(
            "RingHabitatAttachment",
            {
                diameterTop: 100,
                diameterBottom: 100,
                height: deltaRadius * heightFactor * 1.5,
                tessellation: attachmentNbSides
            },
            scene
        );
        this.attachment.convertToFlatShadedMesh();
        this.attachment.material = this.metalSectionMaterial;
        this.attachment.rotate(Axis.Y, Math.PI / attachmentNbSides, Space.WORLD);
        this.attachment.parent = this.getTransform();
        
        this.attachmentAggregate = new PhysicsAggregate(this.attachment, PhysicsShapeType.MESH, { mass: 0 });
        this.attachmentAggregate.body.disablePreStep = false;
        this.attachmentAggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
        this.attachmentAggregate.shape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS;

        const circumference = 2 * Math.PI * this.radius;

        const path: Vector3[] = [];
        const nbSteps = circumference / deltaRadius;
        for (let i = 0; i <= nbSteps; i++) {
            const theta = 2 * Math.PI * i / (nbSteps - 1);
            path.push(new Vector3(this.radius * Math.sin(theta), 0, this.radius * Math.cos(theta)));
        }


        this.ring = createTube(
            "RingHabitat",
            {
                path: path,
                radius: Math.sqrt(2) * deltaRadius / 2,
                tessellation: 4
            },
            scene
        );
        this.ring.scaling.y = heightFactor;
        this.ring.bakeCurrentTransformIntoVertices();
        this.ring.convertToFlatShadedMesh();

        this.ringMaterial = new RingHabitatMaterial(circumference, deltaRadius, heightFactor, scene);

        this.ring.material = this.ringMaterial;

        this.ring.parent = this.getTransform();

        this.ringAggregate = new PhysicsAggregate(this.ring, PhysicsShapeType.MESH, { mass: 0 });
        this.ringAggregate.body.disablePreStep = false;
        this.ringAggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
        this.ringAggregate.shape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS;

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

                
            const armAggregate = new PhysicsAggregate(arm, PhysicsShapeType.MESH, { mass: 0 });
            armAggregate.body.disablePreStep = false;
            armAggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
            armAggregate.shape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS;

            this.armAggregates.push(armAggregate);
        }
    }

    update(stellarObjects: Transformable[], deltaSeconds: number) {
        this.getTransform().rotate(Axis.Y, deltaSeconds / computeRingRotationPeriod(this.radius, Settings.G_EARTH));
        this.ringMaterial.update(stellarObjects);
        this.metalSectionMaterial.update(stellarObjects);
    }

    getTransform(): TransformNode {
        return this.root;
    }

    dispose() {
        this.root.dispose();
        this.attachment.dispose();
        this.attachmentAggregate.dispose();
        this.ring.dispose();
        this.ringAggregate.dispose();
        this.ringMaterial.dispose();
        this.metalSectionMaterial.dispose();
        this.arms.forEach((arm) => arm.dispose());
        this.armAggregates.forEach((armAggregate) => armAggregate.dispose());
    }
}
