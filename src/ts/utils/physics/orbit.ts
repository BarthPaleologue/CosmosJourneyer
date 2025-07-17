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

import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";

import { type Orbit } from "@/backend/universe/orbitalObjects/orbit";

import { findMinimumNewtonRaphson } from "../math";
import { type DeepReadonly } from "../types";
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
 *
 * @param orbit
 * @param t
 * @returns
 * @see https://medium.com/@barth_29567/crazy-orbits-lets-make-squares-c91a427c6b26
 */
export function getPointOnOrbitLocal(orbit: DeepReadonly<Orbit>, parentMass: number, t: number): Vector3 {
    const orbitalPeriod = getOrbitalPeriod(orbit.semiMajorAxis, parentMass);
    const meanAnomaly = orbitalPeriod > 0 ? orbit.initialMeanAnomaly - (2 * Math.PI * t) / orbitalPeriod : 0;

    const trueAnomaly = findMinimumNewtonRaphson(
        (trueAnomaly) => keplerEquation(trueAnomaly, meanAnomaly, orbit.eccentricity),
        meanAnomaly,
    );

    const x = Math.cos(trueAnomaly);
    const y = Math.sin(trueAnomaly);

    const LpFactor = computeLpFactor(x, y, orbit.p);

    const semiMinorAxis = orbit.semiMajorAxis * Math.sqrt(1 - orbit.eccentricity ** 2);

    const linearEccentricity = orbit.eccentricity * orbit.semiMajorAxis;

    const point = new Vector3(orbit.semiMajorAxis * x - linearEccentricity, 0, semiMinorAxis * y);

    point.scaleInPlace(LpFactor);

    const argumentOfPeriapsisTransform = Matrix.RotationAxis(Axis.Y, orbit.argumentOfPeriapsis);
    const inclinationTransform = Matrix.RotationAxis(Axis.Z, orbit.inclination);
    const longitudeOfAscendingNodeTransform = Matrix.RotationAxis(Axis.Y, orbit.longitudeOfAscendingNode);

    Vector3.TransformCoordinatesToRef(point, argumentOfPeriapsisTransform, point);

    Vector3.TransformCoordinatesToRef(point, inclinationTransform, point);

    Vector3.TransformCoordinatesToRef(point, longitudeOfAscendingNodeTransform, point);

    return point;
}

/**
 * Returns the point on the orbit of the body at time t. The orbit are circular for the p-norm.
 * @param centerOfMass
 * @param orbit
 * @param t
 * @returns
 */
export function getPointOnOrbit(
    centerOfMass: Vector3,
    parentMass: number,
    orbit: DeepReadonly<Orbit>,
    t: number,
    referencePlaneRotation: Matrix,
): Vector3 {
    const point = getPointOnOrbitLocal(orbit, parentMass, t);

    Vector3.TransformCoordinatesToRef(point, referencePlaneRotation, point);

    return point.addInPlace(centerOfMass);
}

/**
 * Returns the multiplicative factor to transform the Euclidean orbit into a p-norm orbit for a given theta angle and p-norm
 * @param theta
 * @param p
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
