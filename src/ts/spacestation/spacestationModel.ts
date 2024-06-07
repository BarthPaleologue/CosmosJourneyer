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

import { seededSquirrelNoise } from "squirrel-noise";
import { OrbitProperties } from "../orbit/orbitProperties";
import { getOrbitalPeriod } from "../orbit/orbit";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { OrbitalObjectModel } from "../architecture/orbitalObject";
import { OrbitalObjectPhysicalProperties } from "../architecture/physicalProperties";
import { CelestialBodyModel } from "../architecture/celestialBody";
import { normalRandom } from "extended-random";
import { clamp } from "../utils/math";
import { GenerationSteps } from "../utils/generationSteps";

export class SpaceStationModel implements OrbitalObjectModel {
    readonly seed: number;
    readonly rng: (step: number) => number;
    readonly orbit: OrbitProperties;
    readonly physicalProperties: OrbitalObjectPhysicalProperties;
    readonly parentBody: OrbitalObjectModel | null;
    readonly childrenBodies: OrbitalObjectModel[] = [];

    readonly population: number;
    readonly energyConsumptionPerCapita: number;

    constructor(seed: number, parentBody?: CelestialBodyModel) {
        this.seed = seed;
        this.rng = seededSquirrelNoise(this.seed);

        this.parentBody = parentBody ?? null;
        this.childrenBodies = [];

        const orbitRadius = (2 + clamp(normalRandom(2, 1, this.rng, GenerationSteps.ORBIT), 0, 10)) * (parentBody?.radius ?? 0);

        this.orbit = {
            radius: orbitRadius,
            p: 2,
            period: getOrbitalPeriod(orbitRadius, this.parentBody?.physicalProperties.mass ?? 0),
            normalToPlane: Vector3.Up(),
            isPlaneAlignedWithParent: false
        };

        this.physicalProperties = {
            mass: 1,
            rotationPeriod: 0,
            axialTilt: 2 * this.rng(GenerationSteps.AXIAL_TILT) * Math.PI
        };

        //TODO: make this dependent on economic model
        this.population = 300_000;
        this.energyConsumptionPerCapita = 40_000;
    }
}
