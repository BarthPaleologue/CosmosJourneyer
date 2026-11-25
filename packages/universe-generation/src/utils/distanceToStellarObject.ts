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

import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import { getObjectModelById } from "@cosmos-journeyer/universe-model";
import type { Orbit, StellarObjectModel, StarSystemModel } from "@cosmos-journeyer/universe-model";

/**
 * Collects distances from an orbit to each stellar ancestor in its parent chain.
 * @param orbit Orbit whose ancestor distances are requested.
 * @param systemModel Star system containing the parent hierarchy.
 * @returns Distances keyed by the stellar objects that parent the orbit.
 */
export function getDistancesToStellarObjects(
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Branded quantities are immutable; the rule does not recognize brands nested in object types.
    orbit: DeepReadonly<Orbit>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Branded quantities are immutable; the rule does not recognize brands nested in object types.
    systemModel: DeepReadonly<StarSystemModel>,
): DeepReadonly<Map<StellarObjectModel, number>> {
    const distances = new Map<DeepReadonly<StellarObjectModel>, number>();

    for (const parentId of orbit.parentIds) {
        const parent = getObjectModelById(parentId, systemModel);
        if (parent === null) {
            continue;
        }

        if (parent.type === "star" || parent.type === "neutronStar" || parent.type === "blackHole") {
            distances.set(parent, orbit.semiMajorAxis);
            continue;
        }

        const parentDistances = getDistancesToStellarObjects(parent.orbit, systemModel);
        for (const [stellarObject, distance] of parentDistances) {
            distances.set(stellarObject, distance);
        }
    }

    return distances;
}
