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
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import type { PhysicsShape } from "@babylonjs/core/Physics/v2/physicsShape";
import { PhysicsShapeContainer, PhysicsShapeMesh } from "@babylonjs/core/Physics/v2/physicsShape";
import type { Scene } from "@babylonjs/core/scene";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";

import type { FoilMaterial } from "@/frontend/assets/materials/foil";
import { getBoundingRadius } from "@/frontend/helpers/boundingRadius";
import type { SystemContent } from "@/frontend/systemEntity/systemEntity";

import { CollisionMask } from "@/settings";

import { TelescopePrimaryMirror } from "./primaryMirror";
import type { PrimaryMirrorModel, SpaceTelescopeModel } from "./spaceTelescopeModel";

export class SpaceTelescope implements SystemContent {
    private readonly transform: TransformNode;
    private readonly primaryMirror: TelescopePrimaryMirror;
    private readonly materials: ReadonlyArray<PBRMaterial>;
    private physics: { aggregate: PhysicsAggregate; shapes: ReadonlyArray<PhysicsShape> } | null = null;
    readonly radius: number;

    /** Models are validated by the content factory before allocating Babylon resources. */
    constructor(model: DeepReadonly<SpaceTelescopeModel>, insulation: FoilMaterial, scene: Scene) {
        this.transform = new TransformNode("spaceTelescope", scene);
        const gold = new PBRMaterial("telescopeGold", scene);
        // A small diffuse contribution keeps the gold legible against the dark stellar environment.
        gold.metallic = 0.95;
        gold.roughness = 0.02;
        gold.albedoColor.set(1, 0.7766, 0.3362);
        const structure = new PBRMaterial("telescopeStructure", scene);
        structure.metallic = 0;
        structure.roughness = 1;
        structure.albedoColor.set(0, 0, 0);
        this.materials = [gold, structure];

        this.primaryMirror = new TelescopePrimaryMirror(model.primaryMirror, gold, scene);
        const optics = createOpticalAssembly(model.primaryMirror, this.primaryMirror, gold, structure, scene);
        optics.parent = this.transform;
        const insulationSheets = createInsulationSheets(model.insulationSheets, insulation, structure, scene);
        insulationSheets.parent = this.transform;
        for (const mesh of this.transform.getChildMeshes()) {
            mesh.receiveShadows = true;
        }
        this.radius = getBoundingRadius(this.transform);
    }

    getTransform(): TransformNode {
        return this.transform;
    }

    update(observerPosition: Vector3): void {
        const distanceSquared = Vector3.DistanceSquared(observerPosition, this.transform.getAbsolutePosition());
        if (distanceSquared < 10e3 ** 2 && this.physics === null) {
            this.createCollider();
        } else if (distanceSquared > 12e3 ** 2) {
            this.disposePhysics();
        }
    }

    private createCollider(): void {
        const scene = this.transform.getScene();
        const container = new PhysicsShapeContainer(scene);
        const shapes: PhysicsShape[] = [];
        for (const mesh of this.transform.getChildMeshes()) {
            if (!(mesh instanceof Mesh)) {
                continue;
            }
            const shape = new PhysicsShapeMesh(mesh, scene);
            shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
            shape.filterCollideMask = CollisionMask.EVERYTHING & ~CollisionMask.ENVIRONMENT;
            shape.material = { friction: 0.2, restitution: 0.2 };
            shapes.push(shape);
            if (mesh === this.primaryMirror.getTransform()) {
                const mirror = new PhysicsShapeContainer(scene);
                shapes.push(mirror);
                for (const segment of this.primaryMirror.segments) {
                    mirror.addChild(shape, segment.position, segment.rotation, Vector3.OneReadOnly);
                }
                container.addChildFromParent(this.transform, mirror, mesh);
            } else {
                container.addChildFromParent(this.transform, shape, mesh);
            }
        }
        const aggregate = new PhysicsAggregate(this.transform, container, { mass: 0 }, scene);
        aggregate.body.disablePreStep = false;
        this.physics = { aggregate, shapes };
    }

    private disposePhysics(): void {
        if (this.physics !== null) {
            const { aggregate, shapes } = this.physics;
            aggregate.dispose();
            // Aggregates do not own externally supplied shapes, nor do containers own their children.
            aggregate.shape.dispose();
            for (const shape of shapes.toReversed()) {
                shape.dispose();
            }
            this.physics = null;
        }
    }

    dispose(): void {
        this.disposePhysics();
        this.primaryMirror.dispose();
        this.transform.dispose();
        for (const material of this.materials) {
            material.dispose();
        }
    }
}

function createOpticalAssembly(
    mirror: DeepReadonly<PrimaryMirrorModel>,
    primaryMirror: TelescopePrimaryMirror,
    gold: PBRMaterial,
    structure: PBRMaterial,
    scene: Scene,
): TransformNode {
    const optics = new TransformNode("opticalAssembly", scene);
    const focalLength = mirror.shape.focalLength;
    const attachmentWidth = mirror.apertureRadius * 1.2;
    const primary = primaryMirror.getTransform();
    primary.parent = optics;
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
    receptor.parent = optics;
    const secondary = CreateCylinder("secondaryMirror", { diameter: 1, height: 0.01, tessellation: 32 }, scene);
    secondary.position.y = focalLength;
    secondary.material = gold;
    secondary.parent = optics;
    const secondaryShield = CreateCylinder(
        "secondaryMirrorShield",
        { diameter: 1.35, height: 0.2, tessellation: 32 },
        scene,
    );
    secondaryShield.position.y = focalLength + 0.1;
    secondaryShield.material = structure;
    secondaryShield.parent = optics;
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
        attachment.parent = optics;
    }
    const centralUnit = CreateCylinder(
        "centralUnit",
        { diameter: attachmentWidth * 0.6, height: 1, tessellation: 32 },
        scene,
    );
    centralUnit.position.y = -1;
    centralUnit.material = structure;
    centralUnit.parent = optics;
    return optics;
}

function createInsulationSheets(
    model: DeepReadonly<SpaceTelescopeModel["insulationSheets"]>,
    insulation: FoilMaterial,
    structure: PBRMaterial,
    scene: Scene,
): TransformNode {
    const { size, count, spacing, distance } = model;
    const insulationRig = new TransformNode("insulationRig", scene);
    insulationRig.position.y = -distance;
    for (let i = 0; i < count; i++) {
        const sheet = CreatePlane(`insulationSheet${i}`, { width: size, height: size }, scene);
        sheet.rotation.x = Math.PI / 2;
        sheet.position.y = -i * spacing;
        sheet.material = insulation.get();
        sheet.parent = insulationRig;
        for (let j = 0; j < 2; j++) {
            const rod = CreateCylinder(
                `insulationDiagonal${i}_${j}`,
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
                    `insulationCorner${x}_${z}`,
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
    return insulationRig;
}
