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

import { createHelix } from "@/frontend/assets/procedural/helpers/helixBuilder";
import { type Textures } from "@/frontend/assets/textures";
import { createEnvironmentAggregate } from "@/frontend/helpers/havok";
import { type Transformable } from "@/frontend/universe/architecture/transformable";

import { getRngFromSeed } from "@/utils/getRngFromSeed";
import { EarthG } from "@/utils/physics/constants";
import { getRotationPeriodForArtificialGravity } from "@/utils/physics/physics";

import { Settings } from "@/settings";

import { MetalSectionMaterial } from "../../metalSectionMaterial";
import { HelixHabitatMaterial } from "./helixHabitatMaterial";

export class HelixHabitat implements Transformable {
    private readonly root: TransformNode;

    private readonly rng: (index: number) => number;

    private readonly radius: number;

    private readonly attachment: Mesh;
    private attachmentAggregate: PhysicsAggregate | null = null;

    private readonly helices: Array<AbstractMesh> = [];
    private readonly helixAggregates: Map<AbstractMesh, PhysicsAggregate> = new Map();

    private readonly helixMaterial: HelixHabitatMaterial;
    private readonly metalSectionMaterial: Material;

    private readonly arms: Mesh[] = [];
    private readonly armAggregates: PhysicsAggregate[] = [];

    private readonly lights: Array<PointLight> = [];

    constructor(requiredHabitableSurface: number, seed: number, textures: Textures, scene: Scene) {
        this.root = new TransformNode("HelixHabitatRoot", scene);

        this.rng = getRngFromSeed(seed);

        this.radius = 5e3 + this.rng(0) * 10e3;
        const deltaRadius = 400 + this.rng(1) * 100;

        const thicknessFactor = 2.0 + Math.floor(this.rng(3) * 2);

        const helixThickness = deltaRadius * thicknessFactor;

        const perSpirePerimeter = 2 * Math.PI * this.radius;
        const perSpireSurface = perSpirePerimeter * helixThickness;

        const helixCount = 2;

        const requiredHabitableSurfacePerHelix = requiredHabitableSurface / helixCount;
        const nbSpires = Math.ceil(requiredHabitableSurfacePerHelix / perSpireSurface);

        this.radius = requiredHabitableSurfacePerHelix / (2 * Math.PI * nbSpires * helixThickness);

        const pitch = 2 * this.radius * (1 + 0.3 * (this.rng(2) * 2 - 1));

        const totalLength = pitch * nbSpires;

        const attachmentNbSides = 6 + 2 * Math.floor(this.rng(4) * 2);

        this.metalSectionMaterial = new MetalSectionMaterial(
            "HelixHabitatMetalSectionMaterial",
            textures.materials.metalPanels,
            scene,
        );

        this.attachment = MeshBuilder.CreateCylinder(
            "HelixHabitatAttachment",
            {
                diameterTop: 100,
                diameterBottom: 100,
                height: totalLength + deltaRadius * 4,
                tessellation: attachmentNbSides,
            },
            scene,
        );
        this.attachment.convertToFlatShadedMesh();
        this.attachment.material = this.metalSectionMaterial;
        this.attachment.rotate(Axis.Y, Math.PI / attachmentNbSides, Space.WORLD);
        this.attachment.parent = this.getTransform();

        this.helixMaterial = new HelixHabitatMaterial(
            this.radius,
            deltaRadius,
            thicknessFactor,
            textures.materials.spaceStation,
            scene,
        );

        const tessellation = 360;
        const helix1 = createHelix(
            "HabitatHelix1",
            this.radius,
            deltaRadius,
            helixThickness,
            tessellation,
            nbSpires,
            pitch,
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

        const sectionCount = Math.floor((2 * Math.PI * this.radius) / deltaRadius);

        const maxRadius = this.radius + deltaRadius / 2;
        const minRadius = this.radius - deltaRadius / 2;

        for (let helixIndex = 0; helixIndex < this.helices.length; helixIndex++) {
            for (let spireIndex = 0; spireIndex < nbSpires; spireIndex++) {
                for (let sectionIndex = 0; sectionIndex < sectionCount; sectionIndex++) {
                    const angle =
                        (sectionIndex * Math.PI * 2.0) / sectionCount + (helixIndex * (Math.PI * 2)) / helixCount;
                    for (const radius of [maxRadius, minRadius]) {
                        for (let ring = 0; ring < thicknessFactor; ring++) {
                            const yOffset =
                                (spireIndex + sectionIndex / sectionCount) * pitch -
                                (nbSpires * pitch) / 2 +
                                ring * deltaRadius -
                                helixThickness / 2 +
                                deltaRadius / 2;

                            const lightPosition = new Vector3(
                                radius * Math.cos(angle),
                                yOffset,
                                radius * Math.sin(angle),
                            );

                            lightInstances.thinInstanceAdd(
                                Matrix.Translation(lightPosition.x, lightPosition.y, lightPosition.z),
                            );

                            const light = new PointLight(
                                `Helix${helixIndex}_Habitat_Light_Spire${spireIndex}_Point${sectionIndex}`,
                                lightPosition,
                                this.getTransform().getScene(),
                            );
                            light.parent = this.getTransform();
                            light.range = 200;
                            this.lights.push(light);
                        }
                    }

                    const yBase = (spireIndex + sectionIndex / sectionCount) * pitch - (nbSpires * pitch) / 2;
                    for (const yOffset of [-helixThickness / 2, helixThickness / 2]) {
                        const lightPosition = new Vector3(
                            this.radius * Math.cos(angle),
                            yBase + yOffset,
                            this.radius * Math.sin(angle),
                        );

                        lightInstances.thinInstanceAdd(
                            Matrix.Compose(
                                Vector3.OneReadOnly,
                                Quaternion.FromUnitVectorsToRef(
                                    Vector3.UpReadOnly,
                                    new Vector3(-lightPosition.x, 0, -lightPosition.z).normalize(),
                                    Quaternion.Identity(),
                                ),
                                lightPosition,
                            ),
                        );

                        const light = new PointLight(
                            `HelixHabitatLight_Center1_Spire${spireIndex}_Point${sectionIndex}`,
                            lightPosition,
                            this.getTransform().getScene(),
                        );
                        light.parent = this.getTransform();
                        light.range = 200;
                        this.lights.push(light);
                    }
                }
            }
        }

        const nbArms = (attachmentNbSides * nbSpires) / 2;
        for (let i = 0; i <= nbArms; i++) {
            const arm = MeshBuilder.CreateCylinder(
                `HelixHabitatArm${i}`,
                {
                    height: 2 * this.radius,
                    diameter: deltaRadius / 3,
                    tessellation: 6,
                },
                scene,
            );
            arm.convertToFlatShadedMesh();
            arm.rotate(Axis.Z, Math.PI / 2, Space.LOCAL);
            arm.material = this.metalSectionMaterial;

            const y = (i / nbArms) * totalLength - totalLength / 2;

            const theta = -(2.0 * Math.PI * nbSpires * i) / nbArms;

            arm.position.y = y;
            arm.rotate(Axis.Y, theta, Space.WORLD);

            arm.parent = this.getTransform();

            this.arms.push(arm);
        }
    }

    getLights(): Array<PointLight> {
        return this.lights;
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
