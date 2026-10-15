//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import type { KeplerianObject, RelativeTransformFrame } from "./keplerianOrbitalSimulation";

/** Navigation heuristic: proximity outweighs mass enough to approach small orbiting facilities. */
export function getMostInfluentialObject(
    objects: Iterable<KeplerianObject>,
    position: Vector3,
): KeplerianObject | undefined {
    let bestObject: KeplerianObject | undefined;
    let greatestInfluence = Number.NEGATIVE_INFINITY;
    for (const object of objects) {
        const distanceSquared = Vector3.DistanceSquared(object.getTransform().getAbsolutePosition(), position);
        if (distanceSquared === 0) {
            return object;
        }
        const influence = object.mass / distanceSquared ** 5;
        if (influence > greatestInfluence) {
            bestObject = object;
            greatestInfluence = influence;
        }
    }
    return bestObject;
}

/** Avoid compensating rapid spins. A zero period denotes an object without rotation. */
export function getNavigationReferenceFrame(siderealPeriod: number): RelativeTransformFrame {
    const period = Math.abs(siderealPeriod);
    return period > 0 && period < 10 * 60 ? "inertial" : "reference";
}
