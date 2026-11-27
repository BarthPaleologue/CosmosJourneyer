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

import type { TransformNode } from "@babylonjs/core/pure";
import { meters } from "@cosmos-journeyer/physics";
import type { Meters } from "@cosmos-journeyer/physics";

/**
 * Bounds the whole transform hierarchy with a sphere centered on its absolute position.
 * @param transform - Transform whose hierarchy is measured.
 * @returns The enclosing radius in meters.
 */
export function getBoundingRadius(transform: TransformNode): Meters {
    const { min: boundingMin, max: boundingMax } = transform.getHierarchyBoundingVectors();
    const origin = transform.getAbsolutePosition();
    return meters(
        Math.hypot(
            Math.max(Math.abs(boundingMin.x - origin.x), Math.abs(boundingMax.x - origin.x)),
            Math.max(Math.abs(boundingMin.y - origin.y), Math.abs(boundingMax.y - origin.y)),
            Math.max(Math.abs(boundingMin.z - origin.z), Math.abs(boundingMax.z - origin.z)),
        ),
    );
}
