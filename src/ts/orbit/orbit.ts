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

import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Settings } from "../settings";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { findMinimumNewtonRaphson } from "../utils/math";

/**
 * Represents an orbit in the p-norm space. (Euclidean space for p=2)
 * @see https://en.wikipedia.org/wiki/Orbital_elements
 */
export type Orbit = {
    /**
     * Half the distance between the apoapsis and periapsis
     */
    semiMajorAxis: number;

    /**
     * Shape of the ellipse, describing how much it is elongated compared to a circle
     */
    eccentricity: number;

    /**
     * Vertical tilt of the ellipse with respect to the reference plane, measured at the ascending node
     */
    inclination: number;

    /**
     * horizontally orients the ascending node of the ellipse (where the orbit passes from south to north through the reference plane)
     * with respect to the reference frame's vernal point.
     */
    longitudeOfAscendingNode: number;

    /**
     * Defines the orientation of the ellipse in the orbital plane, as an angle measured from the ascending node to the periapsis
     */
    argumentOfPeriapsis: number;

    /**
     * The mean anomaly at t=0
     *
     * The mean anomaly M is a mathematically convenient fictitious "angle" which does not correspond to a real geometric angle,
     * but rather varies linearly with time, one whole orbital period being represented by an "angle" of 2π radians.
     * It can be converted into the true anomaly ν, which does represent the real geometric angle in the plane of the ellipse,
     * between periapsis (closest approach to the central body) and the position of the orbiting body at any given time
     */
    initialMeanAnomaly: number;

    /**
     * The norm to use for the orbit. 2 for Euclidean space, other numbers for funky shapes.
     * @see https://medium.com/@barth_29567/crazy-orbits-lets-make-squares-c91a427c6b26
     */
    p: number;
};

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
export function getPointOnOrbitLocal(orbit: Orbit, parentMass: number, t: number): Vector3 {
    const meanAnomaly =
        orbit.initialMeanAnomaly - (2 * Math.PI * t) / getOrbitalPeriod(orbit.semiMajorAxis, parentMass);

    const trueAnomaly = findMinimumNewtonRaphson(
        (trueAnomaly) => keplerEquation(trueAnomaly, meanAnomaly, orbit.eccentricity),
        meanAnomaly
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
    orbit: Orbit,
    t: number,
    referencePlaneRotation: Matrix
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
 * Returns the orbital period of a body in seconds
 * @see https://fr.wikipedia.org/wiki/Lois_de_Kepler
 * @param semiMajorAxis
 * @param parentMass
 */
export function getOrbitalPeriod(semiMajorAxis: number, parentMass: number) {
    if (parentMass === 0) return 0;
    const a = semiMajorAxis;
    const G = Settings.G;
    const M = parentMass;
    return 2 * Math.PI * Math.sqrt(a ** 3 / (G * M));
}

export function getSemiMajorAxisFromPeriod(period: number, parentMass: number) {
    if (parentMass === 0) return 0;
    const G = Settings.G;
    const M = parentMass;
    return Math.cbrt((period / (2 * Math.PI)) ** 2 * G * M);
}
