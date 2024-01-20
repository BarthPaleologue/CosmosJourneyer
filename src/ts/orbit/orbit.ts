//  This file is part of CosmosJourneyer
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

import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { OrbitProperties } from "./orbitProperties";

/**
 *
 * @param settings
 * @param t
 * @returns
 * @see https://medium.com/@barth_29567/crazy-orbits-lets-make-squares-c91a427c6b26
 */
export function getPointOnOrbitLocal(settings: OrbitProperties, t: number): Vector3 {
    const theta = -(2 * Math.PI * t) / settings.period;
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    const LpFactor = computeLpFactor(theta, settings.p);

    return new Vector3(cosTheta, 0, sinTheta).scaleInPlace(settings.radius * LpFactor);
}

/**
 * Returns the point on the orbit of the body at time t. The orbit are circular for the p-norm.
 * @param centerOfMass
 * @param settings
 * @param t
 * @returns
 */
export function getPointOnOrbit(centerOfMass: Vector3, settings: OrbitProperties, t: number): Vector3 {
    const localPosition = getPointOnOrbitLocal(settings, t);

    // rotate orbital plane
    const rotationAxis = Vector3.Cross(Vector3.Up(), settings.normalToPlane).normalize();
    const angle = Vector3.GetAngleBetweenVectors(Vector3.Up(), settings.normalToPlane, rotationAxis);
    const rotationMatrix = Matrix.RotationAxis(rotationAxis, angle);

    return Vector3.TransformCoordinates(localPosition, rotationMatrix).addInPlace(centerOfMass);
}

/**
 * Returns the multiplicative factor to transform the Euclidean orbit into a p-norm orbit for a given theta angle and p-norm
 * @param theta
 * @param p
 */
export function computeLpFactor(theta: number, p: number) {
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);
    return 1 / (Math.abs(cosTheta) ** p + Math.abs(sinTheta) ** p) ** (1 / p);
}

/**
 * Returns the Euclidean periapsis of an orbit of a given radius and using the given p-norm
 * @param radius
 * @param p
 */
export function getPeriapsis(radius: number, p: number) {
    return radius * computeLpFactor(Math.PI / 4, p);
}

/**
 *
 * @see https://www.wikiwand.com/fr/Lois_de_Kepler#/Troisi%C3%A8me_loi_%E2%80%93_Loi_des_p%C3%A9riodes
 * @param radius
 * @param parentMass
 */
export function getOrbitalPeriod(radius: number, parentMass: number) {
    if (parentMass === 0) return 0;
    const a = radius;
    const G = 1e12;
    const M = parentMass;
    return Math.sqrt((4 * Math.PI ** 2 * a ** 3) / (G * M));
}
