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

import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { type Material } from "@babylonjs/core/Materials/material";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
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
import type { StationSection } from "@/frontend/universe/orbitalFacility/stationSection";

import { getRngFromSeed } from "@/utils/getRngFromSeed";

import { CollisionMask, Settings } from "@/settings";

import { MetalSectionMaterial } from "./metalSectionMaterial";

export class UtilitySection implements StationSection {
    private readonly attachment: Mesh;

    readonly rng: (step: number) => number;

    private attachmentAggregate: PhysicsAggregate | null = null;

    private readonly metalSectionMaterial: Material;

    private readonly tanks: Array<AbstractMesh> = [];
    private tankBodies: Array<PhysicsBody> = [];
    private readonly tankShape: PhysicsShape;

    private readonly lights: Array<PointLight> = [];

    constructor(seed: number, assets: RenderingAssets, scene: Scene) {
        this.metalSectionMaterial = new MetalSectionMaterial(
            "UtilitySectionMetalMaterial",
            assets.textures.materials.metalPanels,
            scene,
        );

        this.rng = getRngFromSeed(seed);

        const attachmentRadius = 50;
        const tessellation = 6;
        const attachmentSize = 700;

        this.attachment = MeshBuilder.CreateCylinder(
            "UtilitySectionRoot",
            {
                height: attachmentSize,
                diameter: attachmentRadius * 2,
                tessellation,
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

        const hasTanks = this.rng(0) < 0.3;
        if (hasTanks) {
            for (let ring = -3; ring <= 3; ring++) {
                for (let sideIndex = 0; sideIndex < tessellation; sideIndex++) {
                    const radius = attachmentRadius * Math.cos(Math.PI / tessellation) + tankRadius;
                    const theta = Math.PI / tessellation + ((2 * Math.PI) / tessellation) * sideIndex;

                    const tank = tankBase.createInstance(`tankInstance${ring}_${sideIndex}`);
                    tank.position.set(radius * Math.cos(theta), ring * tankRadius * 2, radius * Math.sin(theta));

                    this.tanks.push(tank);
                }
            }
        }

        if (!hasTanks) {
            const lampHeight = 30;
            const lightRadius = 5;
            const lightInstances = MeshBuilder.CreateCylinder(
                "utilitySectionLightMesh",
                { height: lampHeight, diameter: lightRadius * 2, tessellation: 6 },
                scene,
            );
            lightInstances.parent = this.getTransform();
            const lightMaterial = new StandardMaterial("utilitySectionLightMaterial", scene);
            lightMaterial.disableLighting = true;
            lightMaterial.emissiveColor = Color3.FromHexString(Settings.FACILITY_LIGHT_COLOR);
            lightInstances.material = lightMaterial;
            for (let ring = -1; ring <= 1; ring++) {
                for (let sideIndex = 0; sideIndex < tessellation; sideIndex += 2) {
                    const radius = (attachmentRadius + lightRadius) * Math.cos(Math.PI / tessellation);
                    const theta = Math.PI / tessellation + ((2 * Math.PI) / tessellation) * sideIndex;

                    const lightPosition = new Vector3(
                        radius * Math.cos(theta),
                        ring * attachmentSize * 0.5 * 0.66,
                        radius * Math.sin(theta),
                    );

                    lightInstances.thinInstanceAdd(
                        Matrix.Translation(lightPosition.x, lightPosition.y, lightPosition.z),
                    );

                    const light = new PointLight(`utilitySectionLight${ring}_${sideIndex}`, lightPosition, scene, true);
                    light.parent = this.getTransform();
                    light.range = 200;
                    light.diffuse = Color3.FromHexString(Settings.FACILITY_LIGHT_COLOR);

                    this.lights.push(light);
                }
            }
        }
    }

    update(cameraWorldPosition: Vector3) {
        const distanceToCamera = cameraWorldPosition.subtract(this.getTransform().getAbsolutePosition()).length();

        const toggleDistance = 20e3;
        const hysteresisDistance = 5e3;

        if (distanceToCamera < toggleDistance && this.attachmentAggregate === null) {
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
        } else if (distanceToCamera > toggleDistance + hysteresisDistance && this.attachmentAggregate !== null) {
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

    getLights(): Array<PointLight> {
        return this.lights;
    }

    dispose() {
        for (const light of this.lights) {
            light.dispose();
        }
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
