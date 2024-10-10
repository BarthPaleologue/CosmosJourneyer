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

import { seededSquirrelNoise } from "squirrel-noise";
import { getOrbitalPeriod, Orbit } from "../../orbit/orbit";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { normalRandom } from "extended-random";
import { BlackHolePhysicalProperties } from "../../architecture/physicalProperties";
import { CelestialBodyModel, CelestialBodyType } from "../../architecture/celestialBody";
import { StellarObjectModel } from "../../architecture/stellarObject";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Settings } from "../../settings";
import { estimateStarRadiusFromMass } from "../../utils/estimateStarRadiusFromMass";
import { GenerationSteps } from "../../utils/generationSteps";
import { starName } from "../../utils/parseToStrings";
import { StarSystemModel } from "../../starSystem/starSystemModel";
import i18n from "../../i18n";

export class BlackHoleModel implements StellarObjectModel {
    readonly name: string;

    readonly bodyType = CelestialBodyType.BLACK_HOLE;
    readonly seed: number;
    readonly rng: (step: number) => number;

    /**
     * The Schwarzschild radius of the black hole in meters
     */
    readonly radius: number;

    readonly orbit: Orbit;

    readonly physicalProperties: BlackHolePhysicalProperties;

    readonly rings = null;

    //TODO: compute temperature of accretion disk (function of rotation speed)
    readonly temperature = 0;
    readonly color = Color3.Black();

    readonly parentBody: CelestialBodyModel | null;

    readonly childrenBodies: CelestialBodyModel[] = [];

    readonly starSystemModel: StarSystemModel;

    readonly typeName: string;

    constructor(seed: number, starSystemModel: StarSystemModel, parentBody: CelestialBodyModel | null = null) {
        this.seed = seed;
        this.rng = seededSquirrelNoise(this.seed);

        this.starSystemModel = starSystemModel;

        const stellarObjectIndex = this.starSystemModel.getStellarObjects().findIndex(([_, stellarObjectSeed]) => stellarObjectSeed === this.seed);
        this.name = starName(this.starSystemModel.name, stellarObjectIndex);

        this.radius = 1000e3;

        this.parentBody = parentBody;

        // TODO: do not hardcode
        const orbitRadius = this.parentBody === null ? 0 : 2 * (this.parentBody.radius + this.radius);

        this.orbit = {
            radius: orbitRadius,
            p: 2,
            period: getOrbitalPeriod(orbitRadius, this.parentBody?.physicalProperties.mass ?? 0),
            normalToPlane: Vector3.Up()
        };

        this.physicalProperties = {
            mass: BlackHoleModel.GetMassFromSchwarzschildRadius(this.radius),
            rotationPeriod: 1.5e-19,
            axialTilt: normalRandom(0, 0.4, this.rng, GenerationSteps.AXIAL_TILT),
            accretionDiskRadius: this.radius * normalRandom(12, 3, this.rng, 7777)
        };

        this.typeName = i18n.t("objectTypes:blackHole");
    }

    /**
     * Returns the Schwarzschild radius of the black hole
     * @returns the Schwarzschild radius of the black hole
     */
    public getSchwarzschildRadius(): number {
        return (2 * Settings.G * this.physicalProperties.mass) / (Settings.C * Settings.C);
    }

    /**
     * Returns the mass a black hole needs to posess a given Schwarzschild radius
     * @param radius The target radius (in meters)
     * @returns The mass needed to achieve the given radius
     */
    public static GetMassFromSchwarzschildRadius(radius: number): number {
        return (radius * Settings.C * Settings.C) / (2 * Settings.G);
    }

    /**
     * As the angular momentum is conserved, the black hole retains the original star's angular momentum.
     * As the original star's radius is only known approximately, the black hole's angular momentum can only be estimated.
     * The angular momentum is important in the Kerr metric to compute frame dragging.
     */
    public estimateAngularMomentum(): number {
        if (this.physicalProperties.rotationPeriod === 0) return 0;

        const estimatedOriginalStarRadius = estimateStarRadiusFromMass(this.physicalProperties.mass);

        // The inertia tensor for a sphere is a diagonal scaling matrix, we can express it as a simple number
        const inertiaTensor = (2 / 5) * this.physicalProperties.mass * estimatedOriginalStarRadius * estimatedOriginalStarRadius;

        const omega = (2 * Math.PI) / this.physicalProperties.rotationPeriod;

        return inertiaTensor * omega;
    }

    /**
     * This corresponds to a=J/Mc in the Kerr metric. Physical values are between 0 and the mass of the black hole. Exceeding that range will create naked singularities. (J > M²)
     * @returns J/Mc for this black hole
     * @see https://en.wikipedia.org/wiki/Kerr_metric#Overextreme_Kerr_solutions
     */
    public getKerrMetricA(): number {
        return this.estimateAngularMomentum() / (this.physicalProperties.mass * Settings.C);
    }

    public hasNakedSingularity(): boolean {
        return this.getKerrMetricA() > this.physicalProperties.mass;
    }

    /**
     * Returns the radius of the ergosphere at a given angle theta.
     * @param theta The angle in radians to the black hole's rotation axis. (equator => theta = pi / 2)
     * @throws This function throws an error when the black hole is a naked singularity
     */
    public getErgosphereRadius(theta: number): number {
        const m = (Settings.G * this.physicalProperties.mass) / (Settings.C * Settings.C);

        const a = this.getKerrMetricA();
        const cosTheta = Math.cos(theta);

        if (a > m) throw new Error("Black hole angular momentum exceeds maximum value for a Kerr black hole. a > m: " + a);

        return m + Math.sqrt(m * m - a * a * cosTheta * cosTheta);
    }
}
