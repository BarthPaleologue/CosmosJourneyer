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
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Axis, Space } from "@babylonjs/core/Maths/math.axis";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { type PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { type Scene } from "@babylonjs/core/scene";

import { createRing } from "@/frontend/assets/procedural/helpers/ringBuilder";
import { type Textures } from "@/frontend/assets/textures";
import { createEnvironmentAggregate } from "@/frontend/helpers/havok";
import { type Transformable } from "@/frontend/universe/architecture/transformable";

import { getRngFromSeed } from "@/utils/getRngFromSeed";
import { EarthG } from "@/utils/physics/constants";
import { getRotationPeriodForArtificialGravity } from "@/utils/physics/physics";

import { Settings } from "@/settings";

import { MetalSectionMaterial } from "../../metalSectionMaterial";
import { RingHabitatMaterial } from "./ringHabitatMaterial";

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

    private readonly lights: Array<PointLight> = [];

    constructor(requiredHabitableSurface: number, seed: number, textures: Textures, scene: Scene) {
        this.root = new TransformNode("RingHabitatRoot", scene);

        this.rng = getRngFromSeed(seed);

        this.radius = 5e3 + this.rng(0) * 10e3;

        const deltaRadius = 500;

        const requiredHeight = requiredHabitableSurface / (2 * Math.PI * (this.radius + deltaRadius / 2));
        const yScaling = Math.ceil(requiredHeight / deltaRadius);
        const height = yScaling * deltaRadius;

        // adjust the radius to fit the required habitable surface
        this.radius = requiredHabitableSurface / (height * 2 * Math.PI) - deltaRadius / 2;

        const attachmentNbSides = 4 + 2 * Math.floor(this.rng(1) * 2);

        this.metalSectionMaterial = new MetalSectionMaterial(
            "RingHabitatMetalSectionMaterial",
            textures.materials.metalPanels,
            scene,
        );

        this.habitableSurface = height * (2 * Math.PI * (this.radius + deltaRadius / 2));

        this.attachment = MeshBuilder.CreateCylinder(
            "RingHabitatAttachment",
            {
                diameterTop: 100,
                diameterBottom: 100,
                height: height * 1.5,
                tessellation: attachmentNbSides,
            },
            scene,
        );
        this.attachment.convertToFlatShadedMesh();
        this.attachment.material = this.metalSectionMaterial;
        this.attachment.rotate(Axis.Y, Math.PI / attachmentNbSides, Space.WORLD);
        this.attachment.parent = this.getTransform();

        const circumference = 2 * Math.PI * this.radius;

        const tesselation = Math.ceil(circumference / deltaRadius);
        this.ring = createRing(this.radius, deltaRadius, height, tesselation, scene);

        this.ringMaterial = new RingHabitatMaterial(
            this.radius,
            deltaRadius,
            yScaling,
            textures.materials.spaceStation,
            scene,
        );

        this.ring.material = this.ringMaterial;

        this.ring.parent = this.getTransform();

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

        for (let sideIndex = 0; sideIndex < tesselation; sideIndex++) {
            for (let ring = 0; ring < yScaling; ring++) {
                const lightHeight = ring * deltaRadius + deltaRadius / 2 - height / 2;
                const theta = ((2 * Math.PI) / tesselation) * sideIndex + Math.PI / tesselation;
                const radius1 = this.radius + deltaRadius / 2 + lightRadius;
                const radius2 = this.radius - deltaRadius / 2 - lightRadius;
                const lightPosition1 = new Vector3(radius1 * Math.cos(theta), lightHeight, radius1 * Math.sin(theta));
                const lightPosition2 = new Vector3(radius2 * Math.cos(theta), lightHeight, radius2 * Math.sin(theta));

                lightInstances.thinInstanceAdd(
                    Matrix.Translation(lightPosition1.x, lightPosition1.y, lightPosition1.z),
                );
                lightInstances.thinInstanceAdd(
                    Matrix.Translation(lightPosition2.x, lightPosition2.y, lightPosition2.z),
                );

                const light1 = new PointLight(`ringHabitatLight${ring}_${sideIndex}_1`, lightPosition1, scene);
                light1.range = 200;
                light1.parent = this.getTransform();
                this.lights.push(light1);

                const light2 = new PointLight(`ringHabitatLight${ring}_${sideIndex}_2`, lightPosition2, scene);
                light2.range = 200;
                light2.parent = this.getTransform();
                this.lights.push(light2);
            }
        }

        for (let sideIndex = 0; sideIndex < tesselation; sideIndex++) {
            const radius = this.radius;
            const theta = ((2 * Math.PI) / tesselation) * sideIndex + Math.PI / tesselation;

            const lightPosition1 = new Vector3(
                radius * Math.cos(theta),
                -height / 2 - lightRadius,
                radius * Math.sin(theta),
            );
            const lightPosition2 = new Vector3(
                radius * Math.cos(theta),
                height / 2 + lightRadius,
                radius * Math.sin(theta),
            );

            lightInstances.thinInstanceAdd(
                Matrix.Compose(
                    Vector3.OneReadOnly,
                    Quaternion.FromUnitVectorsToRef(
                        Vector3.UpReadOnly,
                        new Vector3(-lightPosition1.x, 0, -lightPosition1.z).normalize(),
                        Quaternion.Identity(),
                    ),
                    lightPosition1,
                ),
            );
            lightInstances.thinInstanceAdd(
                Matrix.Compose(
                    Vector3.OneReadOnly,
                    Quaternion.FromUnitVectorsToRef(
                        Vector3.UpReadOnly,
                        new Vector3(-lightPosition2.x, 0, -lightPosition2.z).normalize(),
                        Quaternion.Identity(),
                    ),
                    lightPosition2,
                ),
            );

            const light1 = new PointLight(`ringHabitatLightBottom${sideIndex}_1`, lightPosition1, scene);
            light1.range = 200;
            light1.parent = this.getTransform();
            this.lights.push(light1);

            const light2 = new PointLight(`ringHabitatLightTop${sideIndex}_2`, lightPosition2, scene);
            light2.range = 200;
            light2.parent = this.getTransform();
            this.lights.push(light2);
        }

        const nbArms = attachmentNbSides / 2;
        for (let i = 0; i <= nbArms; i++) {
            const arm = MeshBuilder.CreateCylinder(
                `RingHabitatArm${i}`,
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

            const theta = (i / nbArms) * Math.PI * 2;

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
            this.arms.forEach((arm) => {
                const armAggregate = createEnvironmentAggregate(
                    arm,
                    PhysicsShapeType.MESH,
                    this.getTransform().getScene(),
                );
                this.armAggregates.push(armAggregate);
            });
            this.ringAggregate = createEnvironmentAggregate(
                this.ring,
                PhysicsShapeType.MESH,
                this.getTransform().getScene(),
            );
        } else if (distanceToCamera > 360e3 && this.attachmentAggregate !== null) {
            this.attachmentAggregate.dispose();
            this.attachmentAggregate = null;

            this.armAggregates.forEach((armAggregate) => {
                armAggregate.dispose();
            });
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
        this.arms.forEach((arm) => {
            arm.dispose();
        });
        this.armAggregates.forEach((armAggregate) => {
            armAggregate.dispose();
        });
    }
}
