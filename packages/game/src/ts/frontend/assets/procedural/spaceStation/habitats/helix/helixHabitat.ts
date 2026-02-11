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
import { Axis, Space } from "@babylonjs/core/Maths/math.axis";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { type Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { type PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { type Scene } from "@babylonjs/core/scene";

import type { HelixHabitatModel } from "@/backend/universe/orbitalObjects/orbitalFacilities/sections/habitats/helix";

import { createHelix } from "@/frontend/assets/procedural/helpers/helixBuilder";
import { type Textures } from "@/frontend/assets/textures";
import { createEnvironmentAggregate } from "@/frontend/helpers/havok";
import { type Transformable } from "@/frontend/universe/architecture/transformable";

import { EarthG } from "@/utils/physics/constants";
import { getRotationPeriodForArtificialGravity } from "@/utils/physics/physics";

import { Settings } from "@/settings";

import { MetalSectionMaterial } from "../../metalSectionMaterial";
import { HelixHabitatMaterial } from "./helixHabitatMaterial";

export class HelixHabitat implements Transformable {
    private readonly root: TransformNode;

    private readonly radius: number;
    private readonly deltaRadius: number;

    private readonly attachment: Mesh;
    private attachmentAggregate: PhysicsAggregate | null = null;

    private readonly helices: Array<AbstractMesh> = [];
    private readonly helixAggregates: Map<AbstractMesh, PhysicsAggregate> = new Map();

    private readonly helixMaterial: HelixHabitatMaterial;
    private readonly metalSectionMaterial: Material;

    private readonly arms: Array<Mesh> = [];
    private readonly armAggregates: Array<PhysicsAggregate> = [];

    private readonly lights: Array<PointLight> = [];

    constructor(model: HelixHabitatModel, textures: Textures, scene: Scene) {
        this.root = new TransformNode("HelixHabitatRoot", scene);

        this.radius = model.baseRadius;
        this.deltaRadius = model.deltaRadius;

        const helixCount = model.helixCount;
        const thicknessFactor = model.thicknessFactor;

        const helixThickness = this.deltaRadius * thicknessFactor;
        const perTurnPerimeter = 2 * Math.PI * this.radius;
        const perTurnHabitableSurface = perTurnPerimeter * helixThickness;

        const requiredHabitableSurface = model.surface.agriculture + model.surface.housing;

        const requiredHabitableSurfacePerHelix = requiredHabitableSurface / helixCount;
        const turnCount = Math.ceil(requiredHabitableSurfacePerHelix / perTurnHabitableSurface);

        this.radius = requiredHabitableSurfacePerHelix / (2 * Math.PI * turnCount * helixThickness);

        const helixPitch = 2 * this.radius * model.helixPitchMultiplier;

        const helixLength = helixPitch * turnCount;

        const attachmentTessellation = model.attachmentTessellation;

        this.metalSectionMaterial = new MetalSectionMaterial(
            "HelixHabitatMetalSectionMaterial",
            textures.materials.metalPanels,
            scene,
        );

        const attachmentLength = helixLength + this.deltaRadius * 4;
        const attachmentRadius = 50;
        this.attachment = MeshBuilder.CreateCylinder(
            "HelixHabitatAttachment",
            {
                diameter: attachmentRadius * 2,
                height: attachmentLength,
                tessellation: attachmentTessellation,
            },
            scene,
        );
        this.attachment.convertToFlatShadedMesh();
        this.attachment.material = this.metalSectionMaterial;
        this.attachment.rotate(Axis.Y, Math.PI / attachmentTessellation, Space.WORLD);
        this.attachment.parent = this.getTransform();

        const lightRadius = 5;
        const lightInstances = MeshBuilder.CreateCylinder(
            "RingHabitatLightTemplate",
            { height: 60, diameter: lightRadius * 2, tessellation: 6 },
            scene,
        );
        lightInstances.parent = this.getTransform();

        const lightMaterial = new StandardMaterial("ringHabitatLightMaterial", scene);
        lightMaterial.emissiveColor = Color3.FromHexString(Settings.FACILITY_LIGHT_COLOR);
        lightMaterial.disableLighting = true;
        lightInstances.material = lightMaterial;

        // point lights along attachment
        const lightYStep = 350;
        const attachmentLightPoints: Array<{ position: Vector3; rotation: Quaternion }> = [];
        for (let y = -attachmentLength / 2 + 50; y <= attachmentLength / 2 - 50; y += lightYStep) {
            for (let sideIndex = 0; sideIndex < attachmentTessellation; sideIndex += 2) {
                const theta = ((2 * Math.PI) / attachmentTessellation) * sideIndex;
                const position = new Vector3(
                    (attachmentRadius + lightRadius) * Math.cos(theta) * Math.cos(Math.PI / attachmentTessellation),
                    y,
                    (attachmentRadius + lightRadius) * Math.sin(theta) * Math.cos(Math.PI / attachmentTessellation),
                );

                attachmentLightPoints.push({ position, rotation: Quaternion.Identity() });
            }
        }

        this.helixMaterial = new HelixHabitatMaterial(
            this.radius,
            this.deltaRadius,
            thicknessFactor,
            textures.materials.spaceStation,
            scene,
        );

        const tessellation = Math.floor((turnCount * perTurnPerimeter) / this.deltaRadius);
        const helix1 = createHelix(
            "HabitatHelix1",
            this.radius,
            this.deltaRadius,
            helixThickness,
            tessellation,
            turnCount,
            helixPitch,
            scene,
        );
        helix1.material = this.helixMaterial;
        helix1.parent = this.getTransform();
        this.helices.push(helix1);

        for (let i = 1; i < helixCount; i++) {
            const helix = helix1.clone(`HabitatHelix${i + 1}`);
            helix.rotate(Axis.Y, (i * Math.PI * 2) / helixCount, Space.WORLD);
            this.helices.push(helix);
        }

        const helixLightPoints = this.getLightPoints(helixCount, turnCount, helixThickness, helixPitch);

        const armCount = (attachmentTessellation * turnCount) / 2;
        const armTessellation = 6;
        const armRadius = this.deltaRadius / 6;
        const armLightPoints: Array<{ position: Vector3; rotation: Quaternion }> = [];
        for (let helixIndex = 0; helixIndex < this.helices.length; helixIndex++) {
            for (let armIndex = 0; armIndex <= armCount; armIndex++) {
                const arm = MeshBuilder.CreateCylinder(
                    `HelixHabitatArm${armIndex}`,
                    {
                        height: this.radius,
                        diameter: armRadius * 2,
                        tessellation: armTessellation,
                    },
                    scene,
                );
                arm.position.y = this.radius / 2;
                arm.bakeCurrentTransformIntoVertices();
                arm.convertToFlatShadedMesh();
                arm.material = this.metalSectionMaterial;

                const angle =
                    -(2.0 * Math.PI * turnCount * armIndex) / armCount -
                    (helixIndex * (Math.PI * 2)) / helixCount +
                    Math.PI;

                const rotation = Quaternion.RotationAxis(Axis.Y, angle).multiply(
                    Quaternion.RotationAxis(Axis.Z, Math.PI / 2),
                );
                arm.rotationQuaternion = rotation;

                arm.position.y = (armIndex / armCount) * helixLength - helixLength / 2;
                arm.parent = this.getTransform();

                const lightYStep = 350;
                for (let lightY = lightYStep; lightY <= this.radius; lightY += lightYStep) {
                    for (let sideIndex = 0; sideIndex < armTessellation; sideIndex += 2) {
                        const theta = ((2 * Math.PI) / armTessellation) * sideIndex + Math.PI / armTessellation;
                        const position = new Vector3(
                            (armRadius + lightRadius) * Math.cos(theta) * Math.cos(Math.PI / armTessellation),
                            lightY,
                            (armRadius + lightRadius) * Math.sin(theta) * Math.cos(Math.PI / armTessellation),
                        );

                        position.rotateByQuaternionToRef(rotation, position);
                        position.y += arm.position.y;

                        armLightPoints.push({ position, rotation });
                    }
                }

                this.arms.push(arm);
            }
        }

        const lightPoints = attachmentLightPoints.concat(helixLightPoints).concat(armLightPoints);
        const lightInstanceBuffer = new Float32Array(lightPoints.length * 16);
        for (const [i, { position, rotation }] of lightPoints.entries()) {
            lightInstanceBuffer.set(Matrix.Compose(Vector3.OneReadOnly, rotation, position).asArray(), i * 16);
            const light = new PointLight(`HelixHabitatLight${i}`, position, scene, true);
            light.range = 200;
            light.parent = this.getTransform();
            light.diffuse = Color3.FromHexString(Settings.FACILITY_LIGHT_COLOR);
            this.lights.push(light);
        }
        lightInstances.thinInstanceSetBuffer("matrix", lightInstanceBuffer, 16, true);
    }

    getLights(): Array<PointLight> {
        return this.lights;
    }

    private getLightPoints(
        helixCount: number,
        turnCount: number,
        helixThickness: number,
        helixPitch: number,
    ): Array<{ position: Vector3; rotation: Quaternion }> {
        const sectionCount = Math.floor((2 * Math.PI * this.radius) / this.deltaRadius);

        const maxRadius = this.radius + this.deltaRadius / 2;
        const minRadius = this.radius - this.deltaRadius / 2;

        const thicknessFactor = Math.floor(helixThickness / this.deltaRadius);

        const results: Array<{ position: Vector3; rotation: Quaternion }> = [];

        for (let helixIndex = 0; helixIndex < helixCount; helixIndex++) {
            for (let turnIndex = 0; turnIndex < turnCount; turnIndex++) {
                for (let sectionIndex = 0; sectionIndex <= sectionCount; sectionIndex++) {
                    const angle =
                        (sectionIndex * Math.PI * 2.0) / sectionCount + (helixIndex * (Math.PI * 2)) / helixCount;
                    for (const radius of [maxRadius, minRadius]) {
                        for (let ring = 0; ring < thicknessFactor; ring++) {
                            const yOffset =
                                (turnIndex + sectionIndex / sectionCount) * helixPitch -
                                (turnCount * helixPitch) / 2 +
                                ring * this.deltaRadius -
                                helixThickness / 2 +
                                this.deltaRadius / 2;

                            const position = new Vector3(radius * Math.cos(angle), yOffset, radius * Math.sin(angle));

                            results.push({ position, rotation: Quaternion.Identity() });
                        }
                    }

                    const yBase = (turnIndex + sectionIndex / sectionCount) * helixPitch - (turnCount * helixPitch) / 2;
                    for (const yOffset of [-helixThickness / 2, helixThickness / 2]) {
                        const position = new Vector3(
                            this.radius * Math.cos(angle),
                            yBase + yOffset,
                            this.radius * Math.sin(angle),
                        );

                        results.push({
                            position,
                            rotation: Quaternion.FromUnitVectorsToRef(
                                Vector3.UpReadOnly,
                                new Vector3(-position.x, 0, -position.z).normalize(),
                                Quaternion.Identity(),
                            ),
                        });
                    }
                }
            }
        }

        return results;
    }

    update(cameraWorldPosition: Vector3, deltaSeconds: number) {
        this.getTransform().rotate(Axis.Y, deltaSeconds / getRotationPeriodForArtificialGravity(this.radius, EarthG));

        const distanceToCamera = Vector3.Distance(cameraWorldPosition, this.getTransform().getAbsolutePosition());

        if (distanceToCamera < 350e3 && this.attachmentAggregate === null) {
            this.attachmentAggregate = createEnvironmentAggregate(
                this.attachment,
                PhysicsShapeType.MESH,
                this.getTransform().getScene(),
            );

            for (const helix of this.helices) {
                const helixAggregate = createEnvironmentAggregate(
                    helix,
                    PhysicsShapeType.MESH,
                    this.getTransform().getScene(),
                );
                this.helixAggregates.set(helix, helixAggregate);
            }

            this.arms.forEach((arm) => {
                const armAggregate = createEnvironmentAggregate(
                    arm,
                    PhysicsShapeType.MESH,
                    this.getTransform().getScene(),
                );
                this.armAggregates.push(armAggregate);
            });
        } else if (distanceToCamera > 360e3 && this.attachmentAggregate !== null) {
            this.attachmentAggregate.dispose();
            this.attachmentAggregate = null;

            for (const helixAggregate of this.helixAggregates.values()) {
                helixAggregate.dispose();
            }
            this.helixAggregates.clear();

            this.armAggregates.forEach((armAggregate) => {
                armAggregate.dispose();
            });
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

        for (const helixAggregate of this.helixAggregates.values()) {
            helixAggregate.dispose();
        }
        this.helixAggregates.clear();

        for (const helix of this.helices) {
            helix.dispose();
        }
        this.helices.length = 0;

        this.arms.forEach((arm) => {
            arm.dispose();
        });
        this.arms.length = 0;

        this.armAggregates.forEach((armAggregate) => {
            armAggregate.dispose();
        });
        this.armAggregates.length = 0;
    }
}
