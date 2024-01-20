//  This file is part of CosmosJourneyer
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

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { seededSquirrelNoise } from "squirrel-noise";
import { hashVec3 } from "./hashVec3";
import { centeredRand } from "extended-random";
import { Settings } from "../settings";

export class SystemSeed {
    readonly starSectorCoordinates: Vector3;
    readonly index: number;

    readonly hash: number;

    constructor(starSectorCoordinates: Vector3, index: number) {
        this.starSectorCoordinates = starSectorCoordinates;
        this.index = index;

        if (!Number.isSafeInteger(this.starSectorCoordinates.x)) throw new Error("x coordinate of star sector is not a safe integer");
        if (!Number.isSafeInteger(this.starSectorCoordinates.y)) throw new Error("y coordinate of star sector is not a safe integer");
        if (!Number.isSafeInteger(this.starSectorCoordinates.z)) throw new Error("z coordinate of star sector is not a safe integer");

        const cellRNG = seededSquirrelNoise(hashVec3(starSectorCoordinates));
        this.hash = centeredRand(cellRNG, 1 + index) * Settings.SEED_HALF_RANGE;
    }

    toString(): string {
        return `${this.starSectorCoordinates.x},${this.starSectorCoordinates.y},${this.starSectorCoordinates.z},${this.index}`;
    }
}
