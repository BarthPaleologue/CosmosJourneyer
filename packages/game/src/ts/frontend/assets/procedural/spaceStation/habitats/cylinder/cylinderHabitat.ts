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
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { type PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { type Scene } from "@babylonjs/core/scene";

import { type Textures } from "@/frontend/assets/textures";
import { createEnvironmentAggregate } from "@/frontend/helpers/havok";
import { type Transformable } from "@/frontend/universe/architecture/transformable";

import { getRngFromSeed } from "@/utils/getRngFromSeed";
import { EarthG } from "@/utils/physics/constants";
import { getRotationPeriodForArtificialGravity } from "@/utils/physics/physics";

import { Settings } from "@/settings";

import { CylinderHabitatMaterial } from "./cylinderHabitatMaterial";

export class CylinderHabitat implements Transformable {
    private readonly root: TransformNode;

    private readonly rng: (index: number) => number;

    private readonly radius: number;

    private readonly cylinderMaterial: CylinderHabitatMaterial;

    private readonly cylinder: Mesh;
    private cylinderAggregate: PhysicsAggregate | null = null;

    readonly habitableSurface: number;

    private readonly lights: Array<PointLight> = [];

    constructor(requiredHabitableSurface: number, seed: number, textures: Textures, scene: Scene) {
        this.root = new TransformNode("CylinderHabitatRoot", scene);

        this.rng = getRngFromSeed(seed);

        this.radius = 2e3 + this.rng(0) * 2e3;

        const requiredHeight = requiredHabitableSurface / (2 * Math.PI * (this.radius / 2));

        const tessellation = 32;

        const circumference = 2 * Math.PI * this.radius;
        const nbSectors = tessellation;
        const sectorSize = circumference / nbSectors;
        const sectorYCount = Math.ceil(requiredHeight / sectorSize);
        const height = sectorYCount * sectorSize;
        this.habitableSurface = height * 2 * Math.PI * (this.radius / 2);

        this.cylinder = MeshBuilder.CreateCylinder(
            "CylinderHabitat",
            {
                diameter: this.radius * 2,
                height,
                tessellation,
            },
            scene,
        );
        this.cylinder.convertToFlatShadedMesh();

        this.cylinderMaterial = new CylinderHabitatMaterial(
            this.radius,
            height,
            tessellation,
            textures.materials.spaceStation,
            scene,
        );

        this.cylinder.material = this.cylinderMaterial;

        this.cylinder.parent = this.getTransform();

        const lightRadius = 5;
        const lightInstances = MeshBuilder.CreateCylinder(
            "CylinderHabitatLightTemplate",
            { height: 60, diameter: lightRadius * 2, tessellation: 6 },
            scene,
        );
        lightInstances.parent = this.getTransform();

        const lightMaterial = new StandardMaterial("cylinderHabitatLightMaterial", scene);
        lightMaterial.emissiveColor = Color3.FromHexString(Settings.FACILITY_LIGHT_COLOR);
        lightMaterial.disableLighting = true;
        lightInstances.material = lightMaterial;

        const lightPoints: Array<{ position: Vector3; rotation: Quaternion }> = [];
        for (let sideIndex = 0; sideIndex < tessellation; sideIndex++) {
            const theta = ((2 * Math.PI) / tessellation) * sideIndex + Math.PI / tessellation;
            for (let ring = 0; ring < sectorYCount; ring++) {
                const lightHeight = ring * sectorSize + sectorSize / 2 - height / 2;

                const position = new Vector3(
                    (this.radius + lightRadius) * Math.cos(theta) * Math.cos(Math.PI / tessellation),
                    lightHeight,
                    (this.radius + lightRadius) * Math.sin(theta) * Math.cos(Math.PI / tessellation),
                );

                lightPoints.push({ position, rotation: Quaternion.Identity() });
            }

            const nbSectorsInRadius = Math.floor(this.radius / sectorSize);
            const baseX = Math.cos(theta) * Math.cos(Math.PI / tessellation);
            const baseZ = Math.sin(theta) * Math.cos(Math.PI / tessellation);
            const rotation = Quaternion.FromUnitVectorsToRef(
                Vector3.UpReadOnly,
                new Vector3(-baseX, 0, -baseZ).normalize(),
                Quaternion.Identity(),
            );
            for (let ring = 0; ring < nbSectorsInRadius; ring++) {
                const radius = ring * sectorSize + sectorSize / 2;
                const position = new Vector3(radius * baseX, -height / 2, radius * baseZ);

                lightPoints.push({ position, rotation });

                const position2 = position.clone();
                position2.y = height / 2;

                lightPoints.push({ position: position2, rotation });
            }
        }

        const lightInstanceBuffer = new Float32Array(lightPoints.length * 16);
        for (const [i, { position, rotation }] of lightPoints.entries()) {
            lightInstanceBuffer.set(Matrix.Compose(Vector3.OneReadOnly, rotation, position).asArray(), i * 16);
            const light = new PointLight(`CylinderHabitatLight${i}`, position, scene, true);
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

    update(cameraWorldPosition: Vector3, deltaSeconds: number) {
        this.getTransform().rotate(Axis.Y, deltaSeconds / getRotationPeriodForArtificialGravity(this.radius, EarthG));

        const distanceToCamera = Vector3.Distance(cameraWorldPosition, this.getTransform().getAbsolutePosition());

        if (distanceToCamera < 350e3 && this.cylinderAggregate === null) {
            this.cylinderAggregate = createEnvironmentAggregate(
                this.cylinder,
                PhysicsShapeType.MESH,
                this.getTransform().getScene(),
            );
        } else if (distanceToCamera > 360e3 && this.cylinderAggregate !== null) {
            this.cylinderAggregate.dispose();
            this.cylinderAggregate = null;
        }
    }

    getTransform(): TransformNode {
        return this.root;
    }

    dispose() {
        this.root.dispose();
        this.cylinder.dispose();

        this.cylinderAggregate?.dispose();
        this.cylinderAggregate = null;

        this.cylinderMaterial.dispose();
    }
}
