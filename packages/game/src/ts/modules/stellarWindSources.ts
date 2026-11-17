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

import type { Vector3 } from "@babylonjs/core/Maths/math.vector";

import type { SystemView } from "@/frontend/universe/systemView";

/**
 * A star that emits a stellar wind, described by the properties needed to
 * estimate the wind at a given location.
 */
export type StellarWindSource = {
    /** Stellar mass in kilograms. */
    mass: number;
    /** Stellar radius in meters. */
    radius: number;
    /** Current world-space position of the star in meters. */
    position: Readonly<Vector3>;
};

/**
 * Collects the stars of the loaded system as stellar wind sources.
 * @param system The loaded system view with live object positions.
 * @returns One source per star with a resolvable position.
 */
export function getStellarWindSources(system: SystemView): Array<StellarWindSource> {
    const sources: Array<StellarWindSource> = [];
    for (const star of system.model.system.stellarObjects) {
        if (star.type !== "star") {
            continue;
        }
        const position = system.getPosition(star.id);
        if (position === undefined) {
            continue;
        }
        sources.push({ mass: star.mass, radius: star.radius, position });
    }
    return sources;
}
