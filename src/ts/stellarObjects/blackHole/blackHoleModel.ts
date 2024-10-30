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

import { getOrbitalPeriod, Orbit } from "../../orbit/orbit";
import { normalRandom } from "extended-random";
import { BlackHolePhysicsInfo } from "../../architecture/physicsInfo";
import { CelestialBodyModel } from "../../architecture/celestialBody";
import { StellarObjectModel } from "../../architecture/stellarObject";
import { Settings } from "../../settings";
import { GenerationSteps } from "../../utils/generationSteps";

import { getRngFromSeed } from "../../utils/getRngFromSeed";
import { OrbitalObjectType } from "../../architecture/orbitalObject";
import { estimateStarRadiusFromMass } from "../../utils/physics";
import { Quaternion } from "@babylonjs/core/Maths/math";

export type BlackHoleModel = StellarObjectModel & {
    readonly type: OrbitalObjectType.BLACK_HOLE;
    /**
     * The Schwarzschild radius of the black hole in meters
     */
    readonly radius: number;

    readonly physics: BlackHolePhysicsInfo;
};

export function newSeededBlackHoleModel(seed: number, name: string, parentBodies: CelestialBodyModel[]): BlackHoleModel {
    const rng = getRngFromSeed(seed);

    //FIXME: do not hardcode
    const radius = 1000e3;

    const parentMaxRadius = parentBodies?.reduce((max, body) => Math.max(max, body.radius), 0) ?? 0;

    // TODO: do not hardcode
    const orbitRadius = parentBodies.length === 0 ? 0 : 2 * (parentMaxRadius + radius);

    const parentMassSum = parentBodies?.reduce((sum, body) => sum + body.physics.mass, 0) ?? 0;
    const orbit: Orbit = {
        radius: orbitRadius,
        p: 2,
        period: getOrbitalPeriod(orbitRadius, parentMassSum),
        orientation: Quaternion.Identity()
    };

    const physicalProperties: BlackHolePhysicsInfo = {
        mass: getMassFromSchwarzschildRadius(radius),
        //FIXME: do not hardcode
        siderealDayDuration: 1.5e-19,
        axialTilt: normalRandom(0, 0.4, rng, GenerationSteps.AXIAL_TILT),
        accretionDiskRadius: radius * normalRandom(12, 3, rng, 7777),
        //TODO: compute temperature of accretion disk (function of rotation speed)
        blackBodyTemperature: 7_000
    };

    return {
        seed,
        name,
        rings: null,
        type: OrbitalObjectType.BLACK_HOLE,
        radius,
        physics: physicalProperties,
        orbit
    };
}

/**
 * Returns the mass a black hole needs to posess a given Schwarzschild radius
 * @param radius The target radius (in meters)
 * @returns The mass needed to achieve the given radius
 */
export function getMassFromSchwarzschildRadius(radius: number): number {
    return (radius * Settings.C * Settings.C) / (2 * Settings.G);
}

/**
 * As the angular momentum is conserved, the black hole retains the original star's angular momentum.
 * As the original star's radius is only known approximately, the black hole's angular momentum can only be estimated.
 * The angular momentum is important in the Kerr metric to compute frame dragging.
 */
export function estimateAngularMomentum(mass: number, rotationPeriod: number): number {
    if (rotationPeriod === 0) return 0;

    const estimatedOriginalStarRadius = estimateStarRadiusFromMass(mass);

    // The inertia tensor for a sphere is a diagonal scaling matrix, we can express it as a simple number
    const inertiaTensor = (2 / 5) * mass * estimatedOriginalStarRadius * estimatedOriginalStarRadius;

    const omega = (2 * Math.PI) / rotationPeriod;

    return inertiaTensor * omega;
}

/**
 * This corresponds to a=J/Mc in the Kerr metric. Physical values are between 0 and the mass of the black hole. Exceeding that range will create naked singularities. (J > M²)
 * @returns J/Mc for this black hole
 * @see https://en.wikipedia.org/wiki/Kerr_metric#Overextreme_Kerr_solutions
 */
export function getKerrMetricA(mass: number, rotationPeriod: number): number {
    return estimateAngularMomentum(mass, rotationPeriod) / (mass * Settings.C);
}

export function hasNakedSingularity(mass: number, rotationPeriod: number): boolean {
    return getKerrMetricA(mass, rotationPeriod) > mass;
}

/**
 * Returns the radius of the ergosphere at a given angle theta.
 * @param mass The mass of the black hole in kilograms
 * @param rotationPeriod The rotation period of the black hole in seconds
 * @param theta The angle in radians to the black hole's rotation axis. (equator => theta = pi / 2)
 * @throws This function throws an error when the black hole is a naked singularity
 */
export function getErgosphereRadius(mass: number, rotationPeriod: number, theta: number): number {
    const m = (Settings.G * mass) / (Settings.C * Settings.C);

    const a = getKerrMetricA(mass, rotationPeriod);
    const cosTheta = Math.cos(theta);

    if (a > m) throw new Error("Black hole angular momentum exceeds maximum value for a Kerr black hole. a > m: " + a);

    return m + Math.sqrt(m * m - a * a * cosTheta * cosTheta);
}
