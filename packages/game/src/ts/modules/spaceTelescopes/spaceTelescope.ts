//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024-2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { CreateTube } from "@babylonjs/core/Meshes/Builders/tubeBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";

import type { SystemContent } from "@/frontend/systemEntity/systemEntity";

import { createInsulationSheetMaterial } from "./insulationSheet";
import { createPrimaryMirror } from "./primaryMirror";
import type { SpaceTelescopeModel } from "./spaceTelescopeModel";

export class SpaceTelescope implements SystemContent {
    private readonly transform: TransformNode;
    private readonly materials: ReadonlyArray<PBRMaterial>;
    readonly radius: number;

    /** Models are validated by the content factory before allocating Babylon resources. */
    constructor(model: DeepReadonly<SpaceTelescopeModel>, scene: Scene) {
        this.transform = new TransformNode("spaceTelescope", scene);
        const mirror = model.primaryMirror;
        const focalLength = mirror.shape.focalLength;
        const attachmentWidth = mirror.apertureRadius * 1.2;
        const gold = new PBRMaterial("telescopeGold", scene);
        // A small diffuse contribution keeps the gold legible against the dark stellar environment.
        gold.metallic = 0.95;
        gold.roughness = 0.02;
        gold.albedoColor.set(1, 0.7766, 0.3362);
        const structure = new PBRMaterial("telescopeStructure", scene);
        structure.metallic = 0;
        structure.roughness = 1;
        structure.albedoColor.set(0, 0, 0);
        const insulation = createInsulationSheetMaterial(scene, model.heatShield.size);
        this.materials = [gold, structure, insulation];

        const primary = createPrimaryMirror(mirror, scene);
        primary.material = gold;
        primary.parent = this.transform;
        const receptor = CreateCylinder(
            "receptor",
            {
                diameter: 1,
                diameterTop: 0.5,
                height: 1,
                tessellation: 32,
            },
            scene,
        );
        receptor.material = structure;
        receptor.parent = this.transform;
        const secondary = CreateCylinder("secondaryMirror", { diameter: 1, height: 0.01, tessellation: 32 }, scene);
        secondary.position.y = focalLength;
        secondary.material = gold;
        secondary.parent = this.transform;
        const secondaryShield = CreateCylinder(
            "secondaryMirrorShield",
            { diameter: 1.35, height: 0.2, tessellation: 32 },
            scene,
        );
        secondaryShield.position.y = focalLength + 0.1;
        secondaryShield.material = structure;
        secondaryShield.parent = this.transform;
        const bounds = primary.getBoundingInfo().boundingBox;
        const extentY = (bounds.maximum.y - bounds.minimum.y) / 2;
        for (let i = 0; i < 3; i++) {
            const attachment = CreateTube(
                `secondarySupport${i}`,
                {
                    path: [
                        new Vector3(0, -1, 0),
                        new Vector3(-attachmentWidth, extentY, 0),
                        new Vector3(-0.6, focalLength + 0.1, 0),
                    ],
                    radius: 0.1,
                    tessellation: 32,
                },
                scene,
            );
            attachment.convertToFlatShadedMesh();
            attachment.rotation.y = (i * 2 * Math.PI) / 3;
            attachment.material = structure;
            attachment.parent = this.transform;
        }
        const centralUnit = CreateCylinder(
            "centralUnit",
            { diameter: attachmentWidth * 0.6, height: 1, tessellation: 32 },
            scene,
        );
        centralUnit.position.y = -1;
        centralUnit.material = structure;
        centralUnit.parent = this.transform;

        const { size, count, spacing, distance } = model.heatShield;
        const insulationRig = new TransformNode("insulationRig", scene);
        insulationRig.position.y = -distance;
        insulationRig.parent = this.transform;
        for (let i = 0; i < count; i++) {
            const sheet = CreatePlane(`insulationSheet${i}`, { width: size, height: size }, scene);
            sheet.rotation.x = Math.PI / 2;
            sheet.position.y = -i * spacing;
            sheet.material = insulation;
            sheet.parent = insulationRig;
            for (let j = 0; j < 2; j++) {
                const rod = CreateCylinder(
                    `shieldDiagonal${i}_${j}`,
                    {
                        diameter: 0.1,
                        height: size * Math.SQRT2 + 0.1,
                        tessellation: 6,
                    },
                    scene,
                );
                rod.rotation.set(0, Math.PI / 4 + (j * Math.PI) / 2, Math.PI / 2);
                rod.position.y = sheet.position.y;
                rod.material = structure;
                rod.parent = insulationRig;
            }
        }
        if (count > 1) {
            for (const x of [-1, 1]) {
                for (const z of [-1, 1]) {
                    const rod = CreateCylinder(
                        `shieldCorner${x}_${z}`,
                        {
                            diameter: 0.1,
                            height: (count - 1) * spacing + 0.1,
                            tessellation: 6,
                        },
                        scene,
                    );
                    rod.position.set(x * (size / 2 - 0.1), (-(count - 1) * spacing) / 2, z * (size / 2 - 0.1));
                    rod.material = structure;
                    rod.parent = insulationRig;
                }
            }
        }
        for (const mesh of this.transform.getChildMeshes()) {
            mesh.receiveShadows = true;
        }
        const hierarchyBounds = this.transform.getHierarchyBoundingVectors();
        this.radius = Math.max(hierarchyBounds.min.length(), hierarchyBounds.max.length());
    }

    getTransform(): TransformNode {
        return this.transform;
    }

    dispose(): void {
        this.transform.dispose();
        for (const material of this.materials) {
            material.dispose(false, true);
        }
    }
}
