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

import { ProtonMass, VacuumPermeability } from "./constants";

export type LocalStellarWindModel = {
    speed: number;
    protonNumberDensity: number;
};

/**
 * Estimates the polar cap boundary latitude from the magnetopause standoff distance.
 * @param planetRadius The planet radius in meters.
 * @param planetMoment The planet's magnetic dipole moment in A·m².
 * @param stellarWind The incident stellar wind properties.
 * @returns The polar cap boundary latitude in radians.
 */
export function getPolarCapLatitude(
    planetRadius: number,
    planetMoment: number,
    stellarWind: Readonly<LocalStellarWindModel>,
): number {
    const standoffDistance = getMagnetopauseStandoffDistance(planetMoment, getStellarWindDynamicPressure(stellarWind));
    return getDipoleFieldLineLatitude(standoffDistance, planetRadius);
}

/**
 * Calculates the latitude where a dipole field line intersects the planet's surface.
 * @param lineMaxDistance The field line's maximum distance from the planet center in meters.
 * @param planetRadius The planet radius in meters.
 * @returns The northern intersection latitude in radians.
 */
export function getDipoleFieldLineLatitude(lineMaxDistance: number, planetRadius: number): number {
    return Math.acos(Math.sqrt(planetRadius / lineMaxDistance));
}

/**
 * Limitation: supposes star belongs to dipole equatorial plane
 * @param moment The planet's magnetic dipole moment in A·m².
 * @param stellarWindPressure The incident stellar wind dynamic pressure in pascals.
 * @returns The distance from the planet center to the substellar magnetopause in meters.
 * @see https://en.wikipedia.org/wiki/Magnetopause#Estimating_the_standoff_distance_to_the_magnetopause
 */
export function getMagnetopauseStandoffDistance(moment: number, stellarWindPressure: number) {
    // Magnetic field needed to balance stellar wind pressure
    const requiredStrength = Math.sqrt(2 * VacuumPermeability * stellarWindPressure);

    // chapman-ferraro reinforcement (see https://agupubs.onlinelibrary.wiley.com/doi/full/10.1002/2017RG000590 "3.1 Chapman-Ferraro Magnetopause Currents")
    const chapmanFerraroFactor = 2;

    // From magneticPressure === stellarWindPressure
    return Math.cbrt((VacuumPermeability * chapmanFerraroFactor * moment) / (4 * Math.PI * requiredStrength));
}

/**
 * Calculates the dynamic pressure of a proton stellar wind.
 * @param stellarWind The incident stellar wind properties.
 * @param stellarWind.speed The stellar wind speed in meters per second.
 * @param stellarWind.protonNumberDensity The proton number density in m^-3.
 * @returns The stellar wind dynamic pressure in pascals.
 * @see https://en.wikipedia.org/wiki/Solar_wind#Pressure
 */
export function getStellarWindDynamicPressure({ speed, protonNumberDensity }: Readonly<LocalStellarWindModel>) {
    const massDensity = protonNumberDensity * ProtonMass;
    return massDensity * speed ** 2;
}
