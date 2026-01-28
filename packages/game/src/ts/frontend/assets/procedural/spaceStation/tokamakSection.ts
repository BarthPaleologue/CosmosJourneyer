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

import { type PointLight } from "@babylonjs/core/Lights/pointLight";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateCylinder, Mesh } from "@babylonjs/core/Meshes";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { type PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { type Scene } from "@babylonjs/core/scene";

import { type RenderingAssets } from "@/frontend/assets/renderingAssets";
import { createEnvironmentAggregate } from "@/frontend/helpers/havok";
import { type Transformable } from "@/frontend/universe/architecture/transformable";

import { createRing } from "../helpers/ringBuilder";
import { RingHabitatMaterial } from "./habitats/ring/ringHabitatMaterial";

export class TokamakSection implements Transformable {
    private readonly attachment: Mesh;
    private attachmentAggregate: PhysicsAggregate | null = null;

    private readonly tokamak: Mesh;
    private tokamakAggregate: PhysicsAggregate | null = null;

    private readonly arms: Mesh[] = [];
    private readonly armAggregates: PhysicsAggregate[] = [];

    private readonly lights: Array<PointLight> = [];

    constructor(requiredNetEnergyOutput: number, assets: RenderingAssets, scene: Scene) {
        const attachmentRadius = 35;
        const tessellation = 6;
        const attachmentSize = 300;

        this.attachment = CreateCylinder(
            "TokamakSectionRoot",
            {
                height: attachmentSize,
                diameter: attachmentRadius * 2,
                tessellation,
                cap: Mesh.NO_CAP,
            },
            scene,
        );
        this.attachment.convertToFlatShadedMesh();
        this.attachment.material = assets.materials.metalSection;
        const efficiency = 0.4;

        const requiredEnergyOutput = requiredNetEnergyOutput / efficiency;

        // https://www.slac.stanford.edu/slac/sass/talks/simeon_iter.pdf
        const iterEnergyOutput = 500e6;
        const iterPlasmaVolume = 840;

        const fusionPowerDensity = iterEnergyOutput / iterPlasmaVolume;
        const plasmaVolume = requiredEnergyOutput / fusionPowerDensity;

        const aspectRatio = 12;
        const elongation = 1.5;

        const minorRadius = Math.cbrt(plasmaVolume / (2 * Math.PI ** 2 * aspectRatio * elongation));
        const majorRadius = aspectRatio * minorRadius;

        this.tokamak = createRing(majorRadius, 2 * minorRadius, 2 * minorRadius * elongation, 32, scene);
        this.tokamak.convertToFlatShadedMesh();
        this.tokamak.parent = this.getTransform();
        this.tokamak.material = new RingHabitatMaterial(
            majorRadius - minorRadius,
            2 * minorRadius,
            2 * minorRadius * elongation,
            assets.textures.materials.metalPanels,
            scene,
        );

        const armCount = tessellation / 2;
        const armLength = majorRadius - attachmentRadius * Math.cos(Math.PI / tessellation) - minorRadius;
        const armThickness = 20;

        for (let i = 0; i < armCount; i++) {
            const theta = (2 * Math.PI * i) / armCount;

            const arm = CreateCylinder(
                `TokamakArm${i}`,
                {
                    height: armLength,
                    diameter: armThickness,
                    tessellation: 6,
                    cap: Mesh.NO_CAP,
                },
                scene,
            );
            arm.translate(Vector3.UpReadOnly, armLength / 2 + attachmentRadius * Math.cos(Math.PI / tessellation));
            arm.bakeCurrentTransformIntoVertices();
            arm.convertToFlatShadedMesh();
            arm.material = assets.materials.metalSection;
            arm.parent = this.getTransform();

            arm.rotationQuaternion = Quaternion.RotationAxis(Axis.Y, theta).multiply(
                Quaternion.RotationAxis(Axis.X, Math.PI / 2),
            );

            this.arms.push(arm);
        }
    }

    getLights(): Array<PointLight> {
        return this.lights;
    }

    update(cameraWorldPosition: Vector3) {
        const distanceToCamera = Vector3.Distance(cameraWorldPosition, this.getTransform().getAbsolutePosition());

        const toggleDistance = 20e3;
        const hysteresisDistance = 10e3;

        if (distanceToCamera < toggleDistance && this.attachmentAggregate === null) {
            this.attachmentAggregate = createEnvironmentAggregate(
                this.attachment,
                PhysicsShapeType.MESH,
                this.getTransform().getScene(),
            );
            this.tokamakAggregate = createEnvironmentAggregate(
                this.tokamak,
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
        } else if (distanceToCamera > toggleDistance + hysteresisDistance && this.attachmentAggregate !== null) {
            this.attachmentAggregate.dispose();
            this.attachmentAggregate = null;

            this.tokamakAggregate?.dispose();
            this.tokamakAggregate = null;

            this.armAggregates.forEach((armAggregate) => {
                armAggregate.dispose();
            });
            this.armAggregates.length = 0;
        }
    }

    public getTransform(): TransformNode {
        return this.attachment;
    }

    public dispose() {
        this.attachment.dispose();
        this.attachmentAggregate?.dispose();
        this.attachmentAggregate = null;

        this.tokamak.dispose();
        this.tokamakAggregate?.dispose();
        this.tokamakAggregate = null;

        for (const light of this.lights) {
            light.dispose();
        }

        this.arms.forEach((arm) => {
            arm.dispose();
        });
        this.armAggregates.forEach((armAggregate) => {
            armAggregate.dispose();
        });
    }
}
