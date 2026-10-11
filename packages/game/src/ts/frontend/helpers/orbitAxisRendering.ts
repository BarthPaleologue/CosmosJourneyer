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

import type { KeplerianObject } from "../universe/keplerianOrbitalSimulation";
import type { StarSystemController } from "../universe/starSystemController";

/**
 * @param starSystem - Current rendered star system.
 * @returns Rendered objects eligible for orbit-axis visualization.
 */
export function getOrbitAxisObjectList(starSystem: StarSystemController): Array<KeplerianObject> {
    const out: Array<KeplerianObject> = [];

    out.push(...starSystem.getStellarObjects());
    out.push(...starSystem.getPlanetaryMassObjects());
    out.push(
        ...starSystem
            .getSystemEntities()
            .map((entity) => entity.placement)
            .filter((placement) => placement.type === "inOrbit"),
    );

    return out;
}
