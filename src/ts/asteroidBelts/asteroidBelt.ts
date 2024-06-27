//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { Scene } from "@babylonjs/core/scene";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { IPatch } from "../planets/telluricPlanet/terrain/instancePatch/iPatch";
import { Objects } from "../assets/objects";
import { AsteroidPatch } from "./asteroidPatch";

export class AsteroidBelt {

    readonly parent: TransformNode;

    readonly averageRadius: number;
    readonly spread: number;

    readonly minRadius: number;
    readonly maxRadius: number;

    readonly resolution = 5;
    readonly patchSize = 12;

    readonly windowMaxRadius = 4;

    private readonly patches = new Map<string, { patch: IPatch, patchPhysicsAggregate: PhysicsAggregate, cellX: number, cellZ: number }>();

    readonly scene: Scene;

    constructor(parent: TransformNode, averageRadius: number, spread: number, scene: Scene) {
        this.parent = parent;

        this.averageRadius = averageRadius;
        this.spread = spread;

        this.minRadius = averageRadius - spread;
        this.maxRadius = averageRadius + spread;

        this.scene = scene;
    }

    public update(cameraWorldPosition: Vector3, deltaSeconds: number) {
        const planetInverseWorld = this.parent.getWorldMatrix().clone().invert();

        const cameraLocalPosition = Vector3.TransformCoordinates(cameraWorldPosition, planetInverseWorld);

        const cameraCellX = Math.round(cameraLocalPosition.x / this.patchSize);
        const cameraCellY = Math.round(cameraLocalPosition.y / this.patchSize);
        const cameraCellZ = Math.round(cameraLocalPosition.z / this.patchSize);

        // remove patches too far away
        for (const [key, value] of this.patches) {
            const patchCellX = value.cellX;
            const patchCellZ = value.cellZ;
            const patch = value.patch;
            const patchPhysicsAggregate = value.patchPhysicsAggregate;

            if ((cameraCellX - patchCellX) ** 2 + cameraCellY * cameraCellY + (cameraCellZ - patchCellZ) ** 2 >= this.windowMaxRadius * this.windowMaxRadius) {
                patch.clearInstances();
                patch.dispose();
                patchPhysicsAggregate.dispose();

                this.patches.delete(key);
            }
        }

        // create new patches
        for (let x = -this.windowMaxRadius; x <= this.windowMaxRadius; x++) {
            for (let z = -this.windowMaxRadius; z <= this.windowMaxRadius; z++) {
                const cellX = cameraCellX + x;
                const cellZ = cameraCellZ + z;

                const radiusSquared = (cellX * this.patchSize) ** 2 + (cellZ * this.patchSize) ** 2;
                if (radiusSquared < this.minRadius * this.minRadius || radiusSquared > this.maxRadius * this.maxRadius) continue;

                if (this.patches.has(`${cellX};${cellZ}`)) continue;

                if ((cameraCellX - cellX) ** 2 + cameraCellY * cameraCellY + (cameraCellZ - cellZ) ** 2 >= this.windowMaxRadius * this.windowMaxRadius) continue;

                const matrixBuffer = AsteroidBelt.CreateAsteroidBuffer(new Vector3(cellX * this.patchSize, 0, cellZ * this.patchSize), this.resolution, this.patchSize, this.minRadius, this.maxRadius);
                const patch = new AsteroidPatch(matrixBuffer);
                patch.createInstances(Objects.ROCK);
                patch.getTransform().parent = this.parent;

                const patchPhysicsAggregate = new PhysicsAggregate(patch.getBaseMesh(), PhysicsShapeType.MESH, { mass: 10 }, this.scene);
                patchPhysicsAggregate.body.disablePreStep = false;
                patchPhysicsAggregate.body.updateBodyInstances();
                patchPhysicsAggregate.body.setAngularDamping(0);
                for(let i = 0; i < patch.getNbInstances(); i++) {
                    patchPhysicsAggregate.body.setAngularVelocity(new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5), i);
                }

                this.patches.set(`${cellX};${cellZ}`, { patch: patch, patchPhysicsAggregate: patchPhysicsAggregate, cellX: cellX, cellZ: cellZ });
            }
        }
    }

    static CreateAsteroidBuffer(position: Vector3, resolution: number, patchSize: number, minRadius: number, maxRadius: number): Float32Array {
        const matrixBuffer = new Float32Array(resolution * resolution * 16);
        const cellSize = patchSize / resolution;
        let index = 0;
        for (let x = 0; x < resolution; x++) {
            for (let z = 0; z < resolution; z++) {
                const randomCellPositionX = Math.random() * cellSize;
                const randomCellPositionZ = Math.random() * cellSize;
                const positionX = position.x + x * cellSize - patchSize / 2 + randomCellPositionX;
                const positionZ = position.z + z * cellSize - patchSize / 2 + randomCellPositionZ;

                if(positionX * positionX + positionZ * positionZ < minRadius * minRadius) continue;
                if(positionX * positionX + positionZ * positionZ > maxRadius * maxRadius) continue;

                const positionY = position.y + (Math.random() - 0.5) * 3.0;
                const scaling = 1; //0.7 + Math.random() * 0.6; see https://forum.babylonjs.com/t/havok-instances-break-when-changing-the-scaling-of-individual-instances/51632

                const matrix = Matrix.Compose(
                    new Vector3(scaling, scaling, scaling),
                    Quaternion.RotationAxis(new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(), Math.random() * 2 * Math.PI),
                    new Vector3(positionX, positionY, positionZ)
                );
                matrix.copyToArray(matrixBuffer, 16 * index);

                index += 1;
            }
        }

        return matrixBuffer.subarray(0, index * 16);
    }
}