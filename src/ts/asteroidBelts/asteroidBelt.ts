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

/**
 * An asteroid belts is basically a collection of thin instance chunks that can be created and destroyed depending on where the player is.
 * This allows to only render the asteroids close to the player, saving immense resources.
 */
export class AsteroidBelt {

    readonly parent: TransformNode;

    readonly averageRadius: number;
    readonly spread: number;

    readonly minRadius: number;
    readonly maxRadius: number;

    readonly resolution = 5;
    readonly patchSize = 12;

    readonly neighborCellsRenderRadius = 4;

    readonly fadeSpeed = 1;

    private readonly patches = new Map<string, { patch: IPatch, patchPhysicsAggregate: PhysicsAggregate, cellX: number, cellZ: number }>();

    readonly scene: Scene;

    /**
     * Creates a new asteroid belt around a given transform
     * @param parent A parent transform node for the asteroids
     * @param averageRadius The average distance to the parent of the asteroids
     * @param spread The spread of the distance to the parent around the average distance
     * @param scene The scene where the asteroid belt exists
     */
    constructor(parent: TransformNode, averageRadius: number, spread: number, scene: Scene) {
        this.parent = parent;

        this.averageRadius = averageRadius;
        this.spread = spread;

        this.minRadius = averageRadius - spread;
        this.maxRadius = averageRadius + spread;

        this.scene = scene;
    }

    /**
     * Updates the asteroid belt. The position of the camera is used to determine which chunks to load and unload.
     * The delta seconds are used to fade in and out the chunks
     * @param cameraWorldPosition The position of the camera in world space
     * @param deltaSeconds The seconds elapsed since last frame
     */
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

            if ((cameraCellX - patchCellX) ** 2 + cameraCellY * cameraCellY + (cameraCellZ - patchCellZ) ** 2 >= this.neighborCellsRenderRadius * this.neighborCellsRenderRadius) {
                patch.getBaseMesh().visibility = Math.max(0, patch.getBaseMesh().visibility - deltaSeconds * this.fadeSpeed);
                if (patch.getBaseMesh().visibility === 0) {
                    patch.clearInstances();
                    patch.dispose();
                    patchPhysicsAggregate.dispose();

                    this.patches.delete(key);
                }
            } else {

                patch.getBaseMesh().visibility = Math.min(1, patch.getBaseMesh().visibility + deltaSeconds * this.fadeSpeed);
            }
        }

        // create new patches
        for (let x = -this.neighborCellsRenderRadius; x <= this.neighborCellsRenderRadius; x++) {
            for (let z = -this.neighborCellsRenderRadius; z <= this.neighborCellsRenderRadius; z++) {
                const cellX = cameraCellX + x;
                const cellZ = cameraCellZ + z;

                const radiusSquared = (cellX * this.patchSize) ** 2 + (cellZ * this.patchSize) ** 2;
                if (radiusSquared < this.minRadius * this.minRadius || radiusSquared > this.maxRadius * this.maxRadius) continue;

                if (this.patches.has(`${cellX};${cellZ}`)) continue;

                if ((cameraCellX - cellX) ** 2 + cameraCellY * cameraCellY + (cameraCellZ - cellZ) ** 2 >= this.neighborCellsRenderRadius * this.neighborCellsRenderRadius) continue;

                const matrixBuffer = AsteroidBelt.CreateAsteroidBuffer(new Vector3(cellX * this.patchSize, 0, cellZ * this.patchSize), this.resolution, this.patchSize, this.minRadius, this.maxRadius);
                const patch = new AsteroidPatch(matrixBuffer);
                patch.createInstances(Objects.ROCK);
                patch.getTransform().parent = this.parent;
                patch.getBaseMesh().visibility = 0.0;

                const patchPhysicsAggregate = new PhysicsAggregate(patch.getBaseMesh(), PhysicsShapeType.MESH, { mass: 10 }, this.scene);
                patchPhysicsAggregate.body.disablePreStep = false;
                patchPhysicsAggregate.body.updateBodyInstances();
                patchPhysicsAggregate.body.setAngularDamping(0);
                for (let i = 0; i < patch.getNbInstances(); i++) {
                    patchPhysicsAggregate.body.setAngularVelocity(new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5), i);
                }

                this.patches.set(`${cellX};${cellZ}`, { patch: patch, patchPhysicsAggregate: patchPhysicsAggregate, cellX: cellX, cellZ: cellZ });
            }
        }
    }

    /**
     * Creates a matrix buffer for an asteroid patch. The patch has a given square size, subdivided in cells by the resolution parameter. Each cell contains one instance. The min and max radius ensure the asteroid don't spread to far
     * @param position The position of the patch in the local space of the parent transform of any belt
     * @param resolution The subdivision of the chunk, each cell contains a single instance
     * @param patchSize The overall planar size of the patch
     * @param minRadius The minimum radius at which the belt starts
     * @param maxRadius The maximum radius at which the belt ends
     * @returns A new matrix 4x4 buffer
     */
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

                if (positionX * positionX + positionZ * positionZ < minRadius * minRadius) continue;
                if (positionX * positionX + positionZ * positionZ > maxRadius * maxRadius) continue;

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