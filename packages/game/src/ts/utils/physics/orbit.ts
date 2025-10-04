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

import { G } from "./constants";

export function getSemiMajorAxis(periapsis: number, apoapsis: number) {
    return (periapsis + apoapsis) / 2;
}

export function getEccentricity(periapsis: number, apoapsis: number) {
    return (apoapsis - periapsis) / (apoapsis + periapsis);
}

export function keplerEquation(trueAnomaly: number, meanAnomaly: number, eccentricity: number) {
    return meanAnomaly - trueAnomaly + eccentricity * Math.sin(trueAnomaly); // = 0
}

/**
 * Returns the multiplicative factor to transform the Euclidean orbit into a p-norm orbit for the given coordinates and p-norm
 * @param x The x-coordinate of the point along the orbit.
 * @param y The y-coordinate of the point along the orbit.
 * @param p The p-norm shaping the orbit.
 */
export function computeLpFactor(x: number, y: number, p: number) {
    return 1 / (Math.abs(x) ** p + Math.abs(y) ** p) ** (1 / p);
}

/**
 * @see https://fr.wikipedia.org/wiki/Lois_de_Kepler
 * @param semiMajorAxis
 * @param parentMass
 * @return The orbital period in seconds or 0 if the parent mass is 0
 */
export function getOrbitalPeriod(semiMajorAxis: number, parentMass: number) {
    if (parentMass === 0) return 0;
    const a = semiMajorAxis;
    const M = parentMass;
    return 2 * Math.PI * Math.sqrt(a ** 3 / (G * M));
}

export function getSemiMajorAxisFromPeriod(period: number, parentMass: number) {
    if (parentMass === 0) return 0;
    const M = parentMass;
    return Math.cbrt((period / (2 * Math.PI)) ** 2 * G * M);
}

/**
 * Returns the orbital period of an object in seconds given its radius and the mass of the parent object
 * @param period The period of the orbit in seconds
 * @param parentMass The mass of the parent object in kilograms
 * @returns The radius of the orbit in meters
 */
export function getOrbitRadiusFromPeriod(period: number, parentMass: number) {
    const omega = (2 * Math.PI) / period;
    return Math.cbrt((G * parentMass) / (omega * omega));
}
