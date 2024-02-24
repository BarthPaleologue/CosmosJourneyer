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

import { hashVec3 } from "../utils/hashVec3";
import { seededSquirrelNoise } from "squirrel-noise";
import { centeredRand } from "extended-random";
import { UniverseDensity } from "../settings";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { BoundingBox } from "@babylonjs/core/Culling/boundingBox";
import { SystemSeed } from "../utils/systemSeed";

export function vector3ToString(v: Vector3): string {
    return `${v.x},${v.y},${v.z}`;
}

export type BuildData = {
    name: string;
    seed: SystemSeed;
    sectorString: string;
    scale: number;
    position: Vector3;
};

export class StarSector {
    /**
     * The star instances of the sector
     */
    readonly starInstances: InstancedMesh[] = [];

    readonly blackHoleInstances: InstancedMesh[] = [];

    /**
     * The position of the sector relative to the center of the starmap
     */
    readonly position: Vector3;

    /**
     * The size of all sectors
     */
    static readonly SIZE = 1;

    readonly density;

    readonly nbStars: number;

    /**
     * The random number generator of the sector
     */
    readonly rng: (step: number) => number;

    constructor(positionInStarMap: Vector3) {
        this.position = positionInStarMap;
        this.rng = seededSquirrelNoise(hashVec3(positionInStarMap.x, positionInStarMap.y, positionInStarMap.z));

        this.density = UniverseDensity(positionInStarMap.x, positionInStarMap.y, positionInStarMap.z);

        this.nbStars = 40 * this.density * this.rng(0);
    }

    generate(): BuildData[] {
        const sectorString = this.getKey();
        const data: BuildData[] = [];
        for (let i = 0; i < this.nbStars; i++) {
            const systemSeed = new SystemSeed(this.position.x, this.position.y, this.position.z, i);
            data.push({
                name: `starInstance|${this.position.x}|${this.position.y}|${this.position.z}|${i}`,
                seed: systemSeed,
                sectorString: sectorString,
                scale: 0.5 + this.rng(100 * i) / 2,
                position: this.getPositionOfStar(i),
            });
        }
        return data;
    }

    getPositionOfStar(starIndex: number): Vector3 {
        if(starIndex >= this.nbStars) throw new Error(`Star index ${starIndex} is out of bounds for sector ${this.position}`);
        return new Vector3(centeredRand(this.rng, 10 * starIndex + 1) / 2, centeredRand(this.rng, 10 * starIndex + 2) / 2, centeredRand(this.rng, 10 * starIndex + 3) / 2).addInPlace(
            this.position
        );
    }

    /**
     * Returns a string that uniquely identifies this sector (its position relative to the global node)
     * @returns a string that uniquely identifies this sector
     */
    getKey(): string {
        return vector3ToString(this.position);
    }

    static GetBoundingBox(position: Vector3, globalNodePosition: Vector3): BoundingBox {
        return new BoundingBox(
            new Vector3(-1, -1, -1).scaleInPlace(StarSector.SIZE / 2),
            new Vector3(1, 1, 1).scaleInPlace(StarSector.SIZE / 2),
            Matrix.Translation(position.x + globalNodePosition.x, position.y + globalNodePosition.y, position.z + globalNodePosition.z)
        );
    }
}
