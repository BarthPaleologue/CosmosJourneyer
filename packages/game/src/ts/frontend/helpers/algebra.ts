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

import { type Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import type { Vector3Like } from "@/utils/types";

export function wrapVector3(vector: Vector3Like, target = new Vector3()): Vector3 {
    return target.copyFromFloats(vector.x, vector.y, vector.z);
}

export function flattenVector3Array(vector3Array: ReadonlyArray<Vector3Like>): number[] {
    const result: number[] = [];
    for (const vector3 of vector3Array) {
        result.push(vector3.x, vector3.y, vector3.z);
    }
    return result;
}

export function flattenColor3Array(color3Array: Color3[]): number[] {
    const result: number[] = [];
    for (const color3 of color3Array) {
        result.push(color3.r, color3.g, color3.b);
    }
    return result;
}
