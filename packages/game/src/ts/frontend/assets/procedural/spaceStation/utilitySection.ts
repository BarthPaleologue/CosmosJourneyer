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
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { type Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsMotionType, PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import { PhysicsShapeSphere, type PhysicsShape } from "@babylonjs/core/Physics/v2/physicsShape";
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

    private readonly tanks: Array<AbstractMesh> = [];
    private tankBodies: Array<PhysicsBody> = [];
    private readonly tankShape: PhysicsShape;

    constructor(seed: number, assets: RenderingAssets, scene: Scene) {
        this.metalSectionMaterial = new MetalSectionMaterial(
            "UtilitySectionMetalMaterial",
            assets.textures.materials.metalPanels,
            scene,
        );

        this.rng = getRngFromSeed(seed);

        const attachmentRadius = 50;
        const tesselation = 6;

        this.attachment = MeshBuilder.CreateCylinder(
            "UtilitySectionRoot",
            {
                height: 700,
                diameter: attachmentRadius * 2,
                tessellation: 6,
            },
            scene,
        );
        this.attachment.convertToFlatShadedMesh();
        this.attachment.material = this.metalSectionMaterial;

        const tankRadius = 40;
        const tankBase = MeshBuilder.CreateIcoSphere("box", { radius: tankRadius }, scene);
        tankBase.parent = this.getTransform();
        tankBase.material = assets.materials.tank;

        this.tankShape = new PhysicsShapeSphere(Vector3.Zero(), tankRadius, scene);

        if (this.rng(0) < 0.3) {
            for (let ring = -3; ring <= 3; ring++) {
                for (let sideIndex = 0; sideIndex < tesselation; sideIndex++) {
                    const radius = attachmentRadius * Math.cos(Math.PI / tesselation) + tankRadius;
                    const theta = Math.PI / tesselation + ((2 * Math.PI) / tesselation) * sideIndex;

                    const tank = tankBase.createInstance(`tankInstance${ring}_${sideIndex}`);
                    tank.position.set(radius * Math.cos(theta), ring * tankRadius * 2, radius * Math.sin(theta));

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
        this.tankBodies.forEach((tankBody) => {
            tankBody.dispose();
        });
        this.tankShape.dispose();
    }
}
