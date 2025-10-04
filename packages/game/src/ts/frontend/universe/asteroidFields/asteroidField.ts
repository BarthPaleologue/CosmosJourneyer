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

import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { type IDisposable, type Scene } from "@babylonjs/core/scene";

import { type Asteroid } from "@/frontend/assets/objects/asteroids";

import { getRngFromSeed } from "@/utils/getRngFromSeed";

import { AsteroidPatch } from "./asteroidPatch";

/**
 * An asteroid field is basically a collection of instance chunks that can be created and destroyed depending on where the player is.
 * This allows to only render the asteroids close to the player, saving immense resources.
 */
export class AsteroidField implements IDisposable {
    readonly seed: number;
    readonly rng: (step: number) => number;

    readonly parent: TransformNode;

    readonly averageRadius: number;
    readonly spread: number;

    readonly innerRadius: number;
    readonly outerRadius: number;

    readonly resolution = 15;
    readonly patchSize = 30000;

    readonly patchThickness = 2000;

    readonly neighborCellsRenderRadius = 2;

    private readonly patches = new Map<string, { patch: AsteroidPatch; cellX: number; cellZ: number }>();

    readonly scene: Scene;

    /**
     * Creates a new asteroid field around a given transform
     * @param seed The seed of the asteroid field
     * @param parent A parent transform node for the asteroids
     * @param innerRadius The minimum distance from the parent at which asteroids can spawn
     * @param outerRadius The maximum distance from the parent at which asteroids can spawn
     * @param scene The scene where the asteroid field exists
     */
    constructor(seed: number, parent: TransformNode, innerRadius: number, outerRadius: number, scene: Scene) {
        this.seed = seed;
        this.rng = getRngFromSeed(this.seed);

        this.parent = parent;

        this.innerRadius = innerRadius;
        this.outerRadius = outerRadius;

        this.averageRadius = (innerRadius + outerRadius) / 2;
        this.spread = outerRadius - innerRadius;

        this.scene = scene;
    }

    /**
     * Updates the asteroid field. The position of the camera is used to determine which chunks to load and unload.
     * The delta seconds are used to fade in and out the chunks
     * @param cameraWorldPosition The position of the camera in world space
     * @param deltaSeconds The seconds elapsed since last frame
     */
    public update(cameraWorldPosition: Vector3, asteroids: ReadonlyArray<Asteroid>, deltaSeconds: number) {
        const planetInverseWorld = this.parent.getWorldMatrix().clone().invert();

        const cameraLocalPosition = Vector3.TransformCoordinates(cameraWorldPosition, planetInverseWorld);

        const cameraCellX = Math.round(cameraLocalPosition.x / this.patchSize);
        const cameraCellY = Math.round(cameraLocalPosition.y / this.patchSize) / 5.0;
        const cameraCellZ = Math.round(cameraLocalPosition.z / this.patchSize);

        // remove patches too far away
        for (const [key, value] of this.patches) {
            const patchCellX = value.cellX;
            const patchCellZ = value.cellZ;
            const patch = value.patch;

            if (
                (cameraCellX - patchCellX) ** 2 + cameraCellY * cameraCellY + (cameraCellZ - patchCellZ) ** 2 >=
                this.neighborCellsRenderRadius * this.neighborCellsRenderRadius
            ) {
                patch.clearInstances();
                patch.dispose();

                this.patches.delete(key);
            } else {
                patch.update(cameraWorldPosition, asteroids, deltaSeconds);
            }
        }

        // create new patches
        for (let x = -this.neighborCellsRenderRadius; x <= this.neighborCellsRenderRadius; x++) {
            for (let z = -this.neighborCellsRenderRadius; z <= this.neighborCellsRenderRadius; z++) {
                const cellX = cameraCellX + x;
                const cellZ = cameraCellZ + z;

                const radiusSquared = (cellX * this.patchSize) ** 2 + (cellZ * this.patchSize) ** 2;
                if (
                    radiusSquared < this.innerRadius * this.innerRadius ||
                    radiusSquared > this.outerRadius * this.outerRadius
                )
                    continue;

                if (this.patches.has(`${cellX};${cellZ}`)) continue;

                if (
                    (cameraCellX - cellX) ** 2 + cameraCellY * cameraCellY + (cameraCellZ - cellZ) ** 2 >=
                    this.neighborCellsRenderRadius * this.neighborCellsRenderRadius
                )
                    continue;

                const cellCoords = new Vector3(cellX * this.patchSize, 0, cellZ * this.patchSize);

                const [positions, rotations, typeIndices, rotationAxes, rotationSpeeds] =
                    AsteroidField.CreateAsteroidBuffer(
                        cellCoords,
                        this.resolution,
                        this.patchSize,
                        this.patchThickness,
                        this.innerRadius,
                        this.outerRadius,
                        asteroids.length - 1,
                        this.rng,
                    );
                const patch = new AsteroidPatch(
                    positions,
                    rotations,
                    typeIndices,
                    rotationAxes,
                    rotationSpeeds,
                    this.parent,
                );
                patch.createInstances();

                this.patches.set(`${cellX};${cellZ}`, { patch: patch, cellX: cellX, cellZ: cellZ });
            }
        }
    }

    dispose() {
        for (const value of this.patches.values()) {
            value.patch.dispose();
        }

        this.patches.clear();
    }

    /**
     * Creates a matrix buffer for an asteroid patch. The patch has a given square size, subdivided in cells by the resolution parameter. Each cell contains one instance. The min and max radius ensure the asteroid don't spread to far
     * @param position The position of the patch in the local space of the parent transform of any field
     * @param resolution The subdivision of the chunk, each cell contains a single instance
     * @param patchSize The overall planar size of the patch
     * @param patchThickness The vertical spread of the patch
     * @param minRadius The minimum radius at which the field starts
     * @param maxRadius The maximum radius at which the field ends
     * @param rng A random number generator
     * @returns A new matrix 4x4 buffer
     */
    static CreateAsteroidBuffer(
        position: Vector3,
        resolution: number,
        patchSize: number,
        patchThickness: number,
        minRadius: number,
        maxRadius: number,
        maxTypeIndex: number,
        rng: (index: number) => number,
    ): [Vector3[], Quaternion[], number[], Vector3[], number[]] {
        const positions = [];
        const rotations = [];
        const asteroidTypeIndices = [];

        const rotationAxes = [];
        const rotationSpeeds = [];

        const cellIndex = position.x * maxRadius * 2 + position.z;

        const cellSize = patchSize / resolution;
        for (let x = 0; x < resolution; x++) {
            for (let z = 0; z < resolution; z++) {
                const asteroidIndex = cellIndex / 1000e3 + (x * resolution + z) / 1000;
                const randomCellPositionX = rng(asteroidIndex) * cellSize;
                const randomCellPositionZ = rng(asteroidIndex + 4621) * cellSize;
                const positionX = position.x + x * cellSize - patchSize / 2 + randomCellPositionX;
                const positionZ = position.z + z * cellSize - patchSize / 2 + randomCellPositionZ;

                if (positionX * positionX + positionZ * positionZ < minRadius * minRadius) continue;
                if (positionX * positionX + positionZ * positionZ > maxRadius * maxRadius) continue;

                const positionY = position.y + (rng(asteroidIndex + 8781) - 0.5) * patchThickness;

                const asteroidTypeIndex = Math.floor(rng(asteroidIndex + 6549) * (maxTypeIndex + 1));

                positions.push(new Vector3(positionX, positionY, positionZ));

                const initialRotationAxis = new Vector3(
                    rng(asteroidIndex + 9512) - 0.5,
                    rng(asteroidIndex + 7456) - 0.5,
                    rng(asteroidIndex + 7410) - 0.5,
                ).normalize();
                const initialRotationAngle = rng(asteroidIndex + 4239) * 2 * Math.PI;

                rotations.push(Quaternion.RotationAxis(initialRotationAxis, initialRotationAngle));
                asteroidTypeIndices.push(asteroidTypeIndex);

                rotationAxes.push(
                    new Vector3(
                        rng(asteroidIndex + 9630) - 0.5,
                        rng(asteroidIndex + 3256) - 0.5,
                        rng(asteroidIndex + 8520) - 0.5,
                    ).normalize(),
                );
                rotationSpeeds.push(rng(asteroidIndex + 1569) * 0.2);
            }
        }

        return [positions, rotations, asteroidTypeIndices, rotationAxes, rotationSpeeds];
    }
}
