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

import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { RingHabitatMaterial } from "./ringHabitatMaterial";
import { MetalSectionMaterial } from "./metalSectionMaterial";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene } from "@babylonjs/core/scene";
import { Axis, PhysicsShapeType } from "@babylonjs/core";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Transformable } from "../../../architecture/transformable";
import { computeRingRotationPeriod } from "../../../utils/ringRotation";
import { Settings } from "../../../settings";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Space } from "@babylonjs/core/Maths/math.axis";
import { LandingPad } from "../landingPad/landingPad";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { createEnvironmentAggregate } from "../../../utils/physics";
import { createRing } from "../../../utils/ringBuilder";

export class DockingBay {
    private readonly root: TransformNode;

    private readonly radius: number;

    private readonly ringMaterial: RingHabitatMaterial;
    private readonly metalSectionMaterial: MetalSectionMaterial;

    private readonly ring: Mesh;
    private ringAggregate: PhysicsAggregate | null = null;

    private readonly arms: Mesh[] = [];
    private readonly armAggregates: PhysicsAggregate[] = [];

    readonly landingPads: LandingPad[] = [];

    constructor(scene: Scene) {
        this.root = new TransformNode("DockingBayRoot", scene);

        this.radius = 500;

        const deltaRadius = this.radius / 3;

        this.metalSectionMaterial = new MetalSectionMaterial(scene);

        const heightFactor = 2 + Math.floor(Math.random() * 2);

        const circumference = 2 * Math.PI * this.radius;

        const nbSteps = Math.ceil(circumference / deltaRadius);
        this.ring = createRing(this.radius, deltaRadius, heightFactor * deltaRadius, nbSteps, scene);

        this.ringMaterial = new RingHabitatMaterial(circumference, deltaRadius, heightFactor, scene);
        this.ring.material = this.ringMaterial;

        this.ring.parent = this.getTransform();

        this.ringAggregate = createEnvironmentAggregate(this.ring, PhysicsShapeType.MESH);

        const yExtent = this.ring.getBoundingInfo().boundingBox.extendSize.y;

        const nbArms = 6;
        for (let i = 0; i <= nbArms; i++) {
            const armDiameter = deltaRadius / 4;
            const arm = MeshBuilder.CreateCylinder(
                `RingHabitatArm${i}`,
                {
                    height: 2 * this.radius,
                    diameter: armDiameter,
                    tessellation: 4
                },
                scene
            );
            arm.convertToFlatShadedMesh();
            arm.rotate(Axis.Z, Math.PI / 2, Space.LOCAL);
            arm.material = this.metalSectionMaterial;

            const theta = (i / nbArms) * Math.PI * 2;

            arm.rotate(Axis.Y, theta, Space.WORLD);

            arm.translate(Axis.Y, -yExtent + armDiameter / 2, Space.WORLD);

            arm.parent = this.getTransform();

            this.arms.push(arm);

            const armAggregate = createEnvironmentAggregate(arm, PhysicsShapeType.BOX);
            this.armAggregates.push(armAggregate);
        }

        const nbPads = nbSteps;
        let padNumber = 0;
        for (let i = 0; i < nbPads; i++) {
            const landingPad = new LandingPad(padNumber++, scene);
            landingPad.getTransform().parent = this.getTransform();

            landingPad.getTransform().rotate(Axis.Z, Math.PI / 2, Space.LOCAL);

            landingPad.getTransform().rotate(Axis.X, ((i + 0.5) * 2.0 * Math.PI) / nbPads, Space.LOCAL);

            landingPad.getTransform().rotate(Axis.Y, Math.PI / 2, Space.LOCAL);

            landingPad.getTransform().translate(Vector3.Up(), -this.radius + deltaRadius / 2 + 10, Space.LOCAL);

            this.landingPads.push(landingPad);
        }
    }

    update(stellarObjects: Transformable[], cameraWorldPosition: Vector3, deltaSeconds: number) {
        this.getTransform().rotate(Axis.Y, deltaSeconds / computeRingRotationPeriod(this.radius, Settings.G_EARTH * 0.1));
        this.ringMaterial.update(stellarObjects);
        this.metalSectionMaterial.update(stellarObjects);
        this.landingPads.forEach((landingPad) => landingPad.update(stellarObjects));

        const distanceToCamera = Vector3.Distance(cameraWorldPosition, this.getTransform().getAbsolutePosition());

        if (distanceToCamera < 350e3 && this.ringAggregate === null) {
            this.ringAggregate = createEnvironmentAggregate(this.ring, PhysicsShapeType.MESH);
            this.arms.forEach((arm) => {
                const armAggregate = createEnvironmentAggregate(arm, PhysicsShapeType.BOX);
                this.armAggregates.push(armAggregate);
            });
        } else if (distanceToCamera > 360e3 && this.ringAggregate !== null) {
            this.ringAggregate.dispose();
            this.ringAggregate = null;

            this.armAggregates.forEach((armAggregate) => armAggregate.dispose());
            this.armAggregates.length = 0;
        }
    }

    getTransform(): TransformNode {
        return this.root;
    }

    dispose() {
        this.root.dispose();
        this.ring.dispose();

        this.ringAggregate?.dispose();
        this.ringAggregate = null;

        this.ringMaterial.dispose();
        this.metalSectionMaterial.dispose();
        this.arms.forEach((arm) => arm.dispose());

        this.armAggregates.forEach((armAggregate) => armAggregate.dispose());
        this.armAggregates.length = 0;

        this.landingPads.forEach((landingPad) => landingPad.dispose());
    }
}
