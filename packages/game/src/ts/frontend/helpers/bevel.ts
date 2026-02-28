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

import { Vector3 } from "@babylonjs/core/Maths/math.vector";

/**
 * Bevel a closed 3D polygon.
 *
 * - points are ordered around the polygon
 * - polygon is closed, but the first point is NOT repeated at the end
 * - each original vertex is replaced by `pointsPerCorner` points
 * - `borderRadius` is a fraction of each adjacent edge length used as cut distance
 */
export function bevelPolygon(
    points: ReadonlyArray<Vector3>,
    pointsPerCorner: number,
    borderRadius: number,
): Array<Vector3> {
    const n = points.length;
    if (n < 3) return points.slice();

    const result: Array<Vector3> = [];
    const fraction = borderRadius;
    const k = Math.max(2, Math.floor(pointsPerCorner)); // at least 2, integer

    for (let i = 0; i < n; i++) {
        const prev = points[(i - 1 + n) % n];
        const curr = points[i];
        const next = points[(i + 1) % n];

        if (curr === undefined || prev === undefined || next === undefined) {
            continue;
        }

        const vPrev = curr.subtract(prev); // prev -> curr
        const vNext = next.subtract(curr); // curr -> next

        const lenPrev = vPrev.length();
        const lenNext = vNext.length();

        if (lenPrev === 0 || lenNext === 0) {
            // Degenerate, just keep the vertex as is
            result.push(curr.clone());
            continue;
        }

        const dirPrev = vPrev.normalizeToNew();
        const dirNext = vNext.normalizeToNew();

        const cutPrev = fraction * lenPrev;
        const cutNext = fraction * lenNext;

        // Endpoints of the bevel on the original edges (near curr)
        const p1 = curr.subtract(dirPrev.scale(cutPrev)); // along prev->curr
        const p2 = curr.add(dirNext.scale(cutNext)); // along curr->next

        if (k === 2) {
            // Simple straight bevel
            result.push(p1, p2);
        } else {
            const control = curr;

            const segments = k - 1;
            for (let j = 0; j < k; j++) {
                const t = j / segments;
                const oneMinusT = 1 - t;

                // Quadratic Bézier interpolation
                const x = oneMinusT * oneMinusT * p1.x + 2 * oneMinusT * t * control.x + t * t * p2.x;
                const y = oneMinusT * oneMinusT * p1.y + 2 * oneMinusT * t * control.y + t * t * p2.y;
                const z = oneMinusT * oneMinusT * p1.z + 2 * oneMinusT * t * control.z + t * t * p2.z;

                result.push(new Vector3(x, y, z));
            }
        }
    }

    return result;
}
