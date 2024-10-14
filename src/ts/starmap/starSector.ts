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

import { hashVec3 } from "../utils/hashVec3";
import { centeredRand } from "extended-random";
import { UniverseDensity } from "../settings";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { BoundingBox } from "@babylonjs/core/Culling/boundingBox";

import { StarSystemCoordinates } from "../utils/coordinates/universeCoordinates";
import { getRngFromSeed } from "../utils/getRngFromSeed";

export function vector3ToString(v: Vector3): string {
    return `${v.x},${v.y},${v.z}`;
}

export type BuildData = {
    name: string;
    coordinates: StarSystemCoordinates;
    sectorString: string;
    position: Vector3;
};

export class StarSector {
    /**
     * The star instances of the sector
     */
    readonly starInstances: InstancedMesh[] = [];

    readonly blackHoleInstances: InstancedMesh[] = [];

    readonly coordinates: Vector3;

    /**
     * The position of the sector relative to the center of the starmap
     */
    readonly position: Vector3;

    /**
     * The size of all sectors
     */
    static readonly SIZE = 20;

    readonly density;

    readonly nbStars: number;

    /**
     * The random number generator of the sector
     */
    readonly rng: (step: number) => number;

    constructor(coordinates: Vector3) {
        this.coordinates = coordinates;
        this.position = coordinates.scale(StarSector.SIZE);
        this.rng = getRngFromSeed(hashVec3(coordinates.x, coordinates.y, coordinates.z));

        this.density = UniverseDensity(coordinates.x, coordinates.y, coordinates.z);

        this.nbStars = 40 * this.density * this.rng(0);
    }

    generate(): BuildData[] {
        const sectorString = this.getKey();
        const data: BuildData[] = [];
        for (let i = 0; i < this.nbStars; i++) {
            const localPosition = this.getLocalPositionOfStar(i);
            const coordinates: StarSystemCoordinates = {
                starSectorX: this.coordinates.x,
                starSectorY: this.coordinates.y,
                starSectorZ: this.coordinates.z,
                localX: localPosition.x,
                localY: localPosition.y,
                localZ: localPosition.z
            };
            data.push({
                name: `starInstance|${this.coordinates.x}|${this.coordinates.y}|${this.coordinates.z}|${i}`,
                coordinates: coordinates,
                sectorString: sectorString,
                position: this.getPositionOfStar(i)
            });
        }
        return data;
    }

    /**
     * Returns the local position of a star in the sector (between -0.5 and 0.5)
     * @param starIndex The index of the star in the sector
     */
    getLocalPositionOfStar(starIndex: number): Vector3 {
        if (starIndex >= this.nbStars) throw new Error(`Star index ${starIndex} is out of bounds for sector ${this.coordinates}`);
        return new Vector3(centeredRand(this.rng, 10 * starIndex + 1) / 2, centeredRand(this.rng, 10 * starIndex + 2) / 2, centeredRand(this.rng, 10 * starIndex + 3) / 2);
    }

    /**
     * Returns the local positions of all stars in the sector (between -0.5 and 0.5)
     */
    getLocalPositionsOfStars(): Vector3[] {
        const positions: Vector3[] = [];
        for (let i = 0; i < this.nbStars; i++) {
            positions.push(this.getLocalPositionOfStar(i));
        }
        return positions;
    }

    /**
     * Returns the position of a star in the universe
     * @param starIndex The index of the star in the sector
     */
    getPositionOfStar(starIndex: number): Vector3 {
        return this.getLocalPositionOfStar(starIndex).scaleInPlace(StarSector.SIZE).addInPlace(this.position);
    }

    /**
     * Returns the positions of all stars of the sector in the universe
     */
    getPositionOfStars(): Vector3[] {
        const positions: Vector3[] = [];
        for (let i = 0; i < this.nbStars; i++) {
            positions.push(this.getPositionOfStar(i));
        }
        return positions;
    }

    /**
     * Returns a string that uniquely identifies this sector (its position relative to the global node)
     * @returns a string that uniquely identifies this sector
     */
    getKey(): string {
        return vector3ToString(this.coordinates);
    }

    static GetBoundingBox(position: Vector3, globalNodePosition: Vector3): BoundingBox {
        return new BoundingBox(
            new Vector3(-1, -1, -1).scaleInPlace(StarSector.SIZE / 2),
            new Vector3(1, 1, 1).scaleInPlace(StarSector.SIZE / 2),
            Matrix.Translation(position.x + globalNodePosition.x, position.y + globalNodePosition.y, position.z + globalNodePosition.z)
        );
    }
}
