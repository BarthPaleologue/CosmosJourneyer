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

import { Settings } from "../settings";

/**
 * Returns an estimate of the radius of a star given its mass. This is only an approximation!
 * This can be used to estimate the angular momentum of a black hole.
 * @param mass The mass of the object
 * @constructor
 * @see https://en.wikipedia.org/wiki/Main_sequence#Sample_parameters
 */
export function estimateStarRadiusFromMass(mass: number) {
    const massInSolarUnits = mass / Settings.SOLAR_MASS;

    const estimatedRadiusInSolarUnits = Math.pow(massInSolarUnits, 0.78);

    return estimatedRadiusInSolarUnits * Settings.SOLAR_RADIUS;
}
