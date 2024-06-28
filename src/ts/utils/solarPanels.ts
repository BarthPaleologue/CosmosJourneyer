//  This file is part of Cosmos Journeyer
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

import { getSphereRadiatedEnergyFlux } from "./thermodynamic";

/**
 * Calculates the surface area of a solar panel required to meet a given energy requirement, efficiency, and star
 * @param efficiency The efficiency of the solar panel between 0 and 1.
 * @param distanceToStar The distance from the star in meters.
 * @param starTemperature The temperature of the star in Kelvin.
 * @param starRadius The radius of the star in meters.
 * @param energyRequirement The energy requirement in watts.
 * @param sunLightExposure The fraction of the time spent in sunlight between 0 and 1.
 */
export function getSolarPanelSurfaceFromEnergyRequirement(efficiency: number, distanceToStar: number, starTemperature: number, starRadius: number, energyRequirement: number, sunLightExposure: number) {
    return energyRequirement / (efficiency * getSphereRadiatedEnergyFlux(starTemperature, starRadius, distanceToStar)) / sunLightExposure;
}