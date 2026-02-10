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

import { type OrbitalObjectModel, type StellarObjectModel } from "@/backend/universe/orbitalObjects/index";
import { getObjectModelById, type StarSystemModel } from "@/backend/universe/starSystemModel";

import { type DeepReadonly } from "@/utils/types";

export function getDistancesToStellarObjects(
    object: DeepReadonly<OrbitalObjectModel>,
    systemModel: DeepReadonly<StarSystemModel>,
): ReadonlyMap<DeepReadonly<StellarObjectModel>, number> {
    const distances: Map<DeepReadonly<StellarObjectModel>, number> = new Map();

    for (const parentId of object.orbit.parentIds) {
        const parent = getObjectModelById(parentId, systemModel);
        if (parent === null) {
            continue;
        }

        if (parent.type === "star" || parent.type === "neutronStar" || parent.type === "blackHole") {
            distances.set(parent, object.orbit.semiMajorAxis);
            continue;
        }

        const parentDistances = getDistancesToStellarObjects(parent, systemModel);
        for (const [stellarObject, distance] of parentDistances) {
            distances.set(stellarObject, distance);
        }
    }

    return distances;
}
