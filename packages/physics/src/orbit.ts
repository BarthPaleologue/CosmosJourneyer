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
import type { Kilograms, Meters, Radians, Seconds } from "./units";
import { meters, radians, seconds } from "./units";

/**
 * @param periapsis Distance from the primary at periapsis.
 * @param apoapsis Distance from the primary at apoapsis.
 * @returns The semi-major axis in meters.
 */
export function getSemiMajorAxis(periapsis: Meters, apoapsis: Meters): Meters {
    return meters((periapsis + apoapsis) / 2);
}

/**
 * @param periapsis Distance from the primary at periapsis.
 * @param apoapsis Distance from the primary at apoapsis.
 * @returns The orbit's eccentricity (dimensionless).
 */
export function getEccentricity(periapsis: Meters, apoapsis: Meters): number {
    return (apoapsis - periapsis) / (apoapsis + periapsis);
}

/**
 * Evaluates the angular residual of Kepler's equation.
 * @param trueAnomaly Orbital anomaly angle in radians.
 * @param meanAnomaly Mean anomaly in radians.
 * @param eccentricity Orbital eccentricity (dimensionless).
 * @returns The equation residual in radians, which is zero at a solution.
 */
export function keplerEquation(trueAnomaly: Radians, meanAnomaly: Radians, eccentricity: number): Radians {
    return radians(meanAnomaly - trueAnomaly + eccentricity * Math.sin(trueAnomaly)); // = 0
}

/**
 * Returns the multiplicative factor to transform the Euclidean orbit into a p-norm orbit for the given coordinates and p-norm
 * @param x The x-coordinate of the point along the orbit (dimensionless).
 * @param y The y-coordinate of the point along the orbit (dimensionless).
 * @param p The p-norm shaping the orbit (dimensionless).
 * @returns The radial scale factor that produces the requested p-norm orbit (dimensionless).
 */
export function computeLpFactor(x: number, y: number, p: number): number {
    return 1 / (Math.abs(x) ** p + Math.abs(y) ** p) ** (1 / p);
}

/**
 * Computes the orbital period from semi-major axis and primary mass.
 * @see https://fr.wikipedia.org/wiki/Lois_de_Kepler
 * @param semiMajorAxis Semi-major axis in meters.
 * @param parentMass Mass of the orbit's primary body in kilograms.
 * @returns The orbital period in seconds or 0 if the parent mass is 0
 */
export function getOrbitalPeriod(semiMajorAxis: Meters, parentMass: Kilograms): Seconds {
    if (parentMass === 0) {
        return seconds(0);
    }
    const a = semiMajorAxis;
    const M = parentMass;
    return seconds(2 * Math.PI * Math.sqrt(a ** 3 / (G * M)));
}

/**
 * @param period Orbital period in seconds.
 * @param parentMass Mass of the orbit's primary body in kilograms.
 * @returns Semi-major axis in meters, or zero when the primary has no mass.
 */
export function getSemiMajorAxisFromPeriod(period: Seconds, parentMass: Kilograms): Meters {
    if (parentMass === 0) {
        return meters(0);
    }
    const M = parentMass;
    return meters(Math.cbrt((period / (2 * Math.PI)) ** 2 * G * M));
}

/**
 * Returns the orbital radius in meters given the orbital period and the mass of the parent object
 * @param period The period of the orbit in seconds
 * @param parentMass The mass of the parent object in kilograms
 * @returns The radius of the orbit in meters
 */
export function getOrbitRadiusFromPeriod(period: Seconds, parentMass: Kilograms): Meters {
    const omega = (2 * Math.PI) / period;
    return meters(Math.cbrt((G * parentMass) / (omega * omega)));
}
