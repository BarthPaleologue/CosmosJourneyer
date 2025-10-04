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

import { type Material } from "@babylonjs/core/Materials/material";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { type Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsMotionType, PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import { type PhysicsShape } from "@babylonjs/core/Physics/v2/physicsShape";
import { type Scene } from "@babylonjs/core/scene";

import { type RenderingAssets } from "@/frontend/assets/renderingAssets";
import { type Transformable } from "@/frontend/universe/architecture/transformable";

import { getRngFromSeed } from "@/utils/getRngFromSeed";

import { CollisionMask } from "@/settings";

import { MetalSectionMaterial } from "./metalSectionMaterial";

export class UtilitySection implements Transformable {
    private readonly attachment: Mesh;

    readonly rng: (step: number) => number;

    private attachmentAggregate: PhysicsAggregate | null = null;

    private readonly metalSectionMaterial: Material;

    private readonly tanks: AbstractMesh[] = [];
    private readonly tankBodies: PhysicsBody[] = [];

    private readonly tankShape: PhysicsShape;

    constructor(seed: number, assets: RenderingAssets, scene: Scene) {
        this.metalSectionMaterial = new MetalSectionMaterial(
            "UtilitySectionMetalMaterial",
            assets.textures.materials.metalPanels,
            scene,
        );

        this.rng = getRngFromSeed(seed);

        this.attachment = MeshBuilder.CreateCylinder(
            "UtilitySectionRoot",
            {
                height: 700,
                diameter: 100,
                tessellation: 6,
            },
            scene,
        );
        this.attachment.convertToFlatShadedMesh();
        this.attachment.material = this.metalSectionMaterial;

        const boundingVectors = this.attachment.getHierarchyBoundingVectors();
        const boundingExtendSize = boundingVectors.max.subtract(boundingVectors.min).scale(0.5);

        this.tankShape = assets.objects.sphericalTank.shape;

        if (this.rng(0) < 0.3) {
            for (let ring = -3; ring <= 3; ring++) {
                for (let sideIndex = 0; sideIndex < 6; sideIndex++) {
                    const tank = assets.objects.sphericalTank.mesh.createInstance("SphericalTank");
                    tank.scalingDeterminant = 2.4;

                    const newBoundingVectors = tank.getHierarchyBoundingVectors();
                    const newBoundingExtendSize = newBoundingVectors.max.subtract(newBoundingVectors.min).scale(0.5);

                    tank.position.x = boundingExtendSize.x + newBoundingExtendSize.x;
                    tank.parent = this.getTransform();

                    tank.rotateAround(Vector3.Zero(), Axis.Y, Math.PI / 6 + (Math.PI / 3) * sideIndex);
                    tank.translate(Axis.Y, ring * 40);

                    this.tanks.push(tank);
                }
            }
        }
    }

    update(cameraWorldPosition: Vector3) {
        const distanceToCamera = cameraWorldPosition.subtract(this.getTransform().getAbsolutePosition()).length();

        if (distanceToCamera < 350e3 && this.attachmentAggregate === null) {
            this.attachmentAggregate = new PhysicsAggregate(this.attachment, PhysicsShapeType.MESH, { mass: 0 });
            this.attachmentAggregate.body.disablePreStep = false;
            this.attachmentAggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
            this.attachmentAggregate.shape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS;

            this.tanks.forEach((tank) => {
                const tankBody = new PhysicsBody(tank, PhysicsMotionType.STATIC, false, this.getTransform().getScene());
                tankBody.setMassProperties({ mass: 0 });
                tankBody.disablePreStep = false;
                tankBody.shape = this.tankShape;

                this.tankBodies.push(tankBody);
            });
        } else if (distanceToCamera > 360e3 && this.attachmentAggregate !== null) {
            this.attachmentAggregate.dispose();
            this.attachmentAggregate = null;

            this.tankBodies.forEach((tankBody) => {
                tankBody.dispose();
            });
            this.tankBodies.length = 0;
        }
    }

    getTransform(): TransformNode {
        return this.attachment;
    }

    dispose() {
        this.attachment.dispose();
        this.attachmentAggregate?.dispose();
        this.metalSectionMaterial.dispose();
        this.tanks.forEach((tank) => {
            tank.dispose();
        });
        this.tankBodies.forEach((tankAggregate) => {
            tankAggregate.dispose();
        });
    }
}
