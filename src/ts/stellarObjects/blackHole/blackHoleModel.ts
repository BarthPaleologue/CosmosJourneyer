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

import { seededSquirrelNoise } from "squirrel-noise";
import { getOrbitalPeriod } from "../../orbit/orbit";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { normalRandom, uniformRandBool } from "extended-random";
import { OrbitProperties } from "../../orbit/orbitProperties";
import { BODY_TYPE, GENERATION_STEPS } from "../../model/common";
import { BlackHolePhysicalProperties } from "../../architecture/physicalProperties";
import { CelestialBodyModel } from "../../architecture/celestialBody";
import { StellarObjectModel } from "../../architecture/stellarObject";
import { Color3 } from "@babylonjs/core/Maths/math.color";

export class BlackHoleModel implements StellarObjectModel {
    readonly bodyType = BODY_TYPE.BLACK_HOLE;
    readonly seed: number;
    readonly rng: (step: number) => number;

    readonly radius: number;

    readonly orbit: OrbitProperties;

    readonly physicalProperties: BlackHolePhysicalProperties;

    //TODO: compute temperature of accretion disk (function of rotation speed)
    readonly temperature = 0;
    readonly color = Color3.Black();

    readonly parentBody: CelestialBodyModel | null;

    readonly childrenBodies: CelestialBodyModel[] = [];

    constructor(seed: number, parentBody?: CelestialBodyModel) {
        this.seed = seed;
        this.rng = seededSquirrelNoise(this.seed);

        this.radius = 1000e3;

        this.parentBody = parentBody ?? null;

        // TODO: do not hardcode
        const orbitRadius = this.parentBody === null ? 0 : 2 * (this.parentBody.radius + this.radius);

        this.orbit = {
            radius: orbitRadius,
            p: 2,
            period: getOrbitalPeriod(orbitRadius, this.parentBody?.physicalProperties.mass ?? 0),
            normalToPlane: Vector3.Up(),
            isPlaneAlignedWithParent: true
        };

        this.physicalProperties = {
            mass: 10,
            rotationPeriod: 24 * 60 * 60,
            axialTilt: normalRandom(0, 0.4, this.rng, GENERATION_STEPS.AXIAL_TILT),
            accretionDiskRadius: 8000e3
        };
    }

    public getNbSpaceStations(): number {
        if(uniformRandBool(0.1, this.rng, GENERATION_STEPS.SPACE_STATION)) return 1;
        return 0;
    }
}
