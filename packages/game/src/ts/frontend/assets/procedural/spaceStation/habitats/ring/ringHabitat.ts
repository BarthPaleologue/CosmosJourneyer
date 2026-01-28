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

        const attachmentTessellation = 4 + 2 * Math.floor(this.rng(1) * 2);

        this.metalSectionMaterial = new MetalSectionMaterial(
            "RingHabitatMetalSectionMaterial",
            textures.materials.metalPanels,
            scene,
        );

        this.habitableSurface = height * (2 * Math.PI * (this.radius + deltaRadius / 2));

        const attachmentLength = height * 1.5;
        const attachmentRadius = 50;
        this.attachment = MeshBuilder.CreateCylinder(
            "RingHabitatAttachment",
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

        const circumference = 2 * Math.PI * this.radius;

        const tesselation = Math.ceil(circumference / deltaRadius);
        this.ring = createRing(this.radius, deltaRadius, height, tesselation, scene);

        this.ringMaterial = new RingHabitatMaterial(
            this.radius,
            deltaRadius,
            yScaling * deltaRadius,
            textures.materials.spaceStation,
            scene,
        );

        this.ring.material = this.ringMaterial;

        this.ring.parent = this.getTransform();

        const ringLightPoints: Array<{ position: Vector3; rotation: Quaternion }> = [];
        for (let sideIndex = 0; sideIndex < tesselation; sideIndex++) {
            for (let ring = 0; ring < yScaling; ring++) {
                const lightHeight = ring * deltaRadius + deltaRadius / 2 - height / 2;
                const theta = ((2 * Math.PI) / tesselation) * sideIndex + Math.PI / tesselation;
                const radius1 = this.radius + deltaRadius / 2 + lightRadius;
                const radius2 = this.radius - deltaRadius / 2 - lightRadius;
                const lightPosition1 = new Vector3(radius1 * Math.cos(theta), lightHeight, radius1 * Math.sin(theta));
                const lightPosition2 = new Vector3(radius2 * Math.cos(theta), lightHeight, radius2 * Math.sin(theta));

                ringLightPoints.push({ position: lightPosition1, rotation: Quaternion.Identity() });
                ringLightPoints.push({ position: lightPosition2, rotation: Quaternion.Identity() });
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

            ringLightPoints.push({
                position: lightPosition1,
                rotation: Quaternion.FromUnitVectorsToRef(
                    Vector3.UpReadOnly,
                    new Vector3(-lightPosition1.x, 0, -lightPosition1.z).normalize(),
                    Quaternion.Identity(),
                ),
            });
            ringLightPoints.push({
                position: lightPosition2,
                rotation: Quaternion.FromUnitVectorsToRef(
                    Vector3.UpReadOnly,
                    new Vector3(-lightPosition2.x, 0, -lightPosition2.z).normalize(),
                    Quaternion.Identity(),
                ),
            });
        }

        const nbArms = attachmentTessellation / 2;
        const armRadius = deltaRadius / 6;
        const armTessellation = 6;
        const armLightPoints: Array<{ position: Vector3; rotation: Quaternion }> = [];
        for (let i = 0; i <= nbArms; i++) {
            const arm = MeshBuilder.CreateCylinder(
                `RingHabitatArm${i}`,
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

            const theta = (i / nbArms) * Math.PI * 2;
            const rotation = Quaternion.RotationAxis(Axis.Y, theta).multiply(
                Quaternion.RotationAxis(Axis.Z, Math.PI / 2),
            );
            arm.rotationQuaternion = rotation;
            arm.parent = this.getTransform();

            const lightYStep = 350;
            for (let lightY = lightYStep; lightY <= this.radius - lightYStep; lightY += lightYStep) {
                for (let sideIndex = 0; sideIndex < armTessellation; sideIndex += 2) {
                    const phi = ((2 * Math.PI) / armTessellation) * sideIndex + Math.PI / armTessellation;
                    const position = new Vector3(
                        (armRadius + lightRadius) * Math.cos(phi) * Math.cos(Math.PI / armTessellation),
                        lightY,
                        (armRadius + lightRadius) * Math.sin(phi) * Math.cos(Math.PI / armTessellation),
                    );

                    position.rotateByQuaternionToRef(rotation, position);

                    armLightPoints.push({ position, rotation });
                }
            }

            this.arms.push(arm);
        }

        const lightPoints = attachmentLightPoints.concat(ringLightPoints).concat(armLightPoints);
        const lightInstanceBuffer = new Float32Array(lightPoints.length * 16);
        for (const [i, { position, rotation }] of lightPoints.entries()) {
            lightInstanceBuffer.set(Matrix.Compose(Vector3.OneReadOnly, rotation, position).asArray(), i * 16);

            const light = new PointLight("RingHabitatLight", position, scene, true);
            light.range = 200;
            light.diffuse = Color3.FromHexString(Settings.FACILITY_LIGHT_COLOR);
            light.parent = this.getTransform();
            this.lights.push(light);
        }

        lightInstances.thinInstanceSetBuffer("matrix", lightInstanceBuffer, 16, true);
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
