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
import { clamp } from "terrain-generation";
import { normalRandom, randRange, uniformRandBool } from "extended-random";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { getRgbFromTemperature } from "../../utils/specrend";
import { Settings } from "../../settings";
import { getOrbitalPeriod } from "../../orbit/orbit";
import { OrbitProperties } from "../../orbit/orbitProperties";
import { BODY_TYPE, GENERATION_STEPS } from "../../model/common";
import { STELLAR_TYPE } from "../common";
import { RingsUniforms } from "../../postProcesses/rings/ringsUniform";
import { StarPhysicalProperties } from "../../architecture/physicalProperties";
import { CelestialBodyModel } from "../../architecture/celestialBody";
import { StellarObjectModel } from "../../architecture/stellarObject";

export class StarModel implements StellarObjectModel {
    readonly bodyType = BODY_TYPE.STAR;
    readonly rng: (step: number) => number;
    readonly seed: number;

    readonly surfaceColor: Vector3;
    stellarType: STELLAR_TYPE;
    readonly radius: number;

    readonly mass = 1000;
    readonly rotationPeriod = 24 * 60 * 60;

    readonly orbit: OrbitProperties;

    readonly physicalProperties: StarPhysicalProperties;

    static RING_PROPORTION = 0.2;
    readonly ringsUniforms;

    readonly parentBody: CelestialBodyModel | null;

    readonly childrenBodies: CelestialBodyModel[] = [];

    constructor(seed: number, parentBody: CelestialBodyModel | null = null) {
        this.seed = seed;
        this.rng = seededSquirrelNoise(this.seed);

        const surfaceTemperature = clamp(normalRandom(5778, 2000, this.rng, GENERATION_STEPS.TEMPERATURE), 3000, 10000);

        this.parentBody = parentBody;

        this.physicalProperties = {
            mass: this.mass,
            rotationPeriod: this.rotationPeriod,
            temperature: surfaceTemperature,
            axialTilt: 0
        };

        this.surfaceColor = getRgbFromTemperature(surfaceTemperature);

        this.stellarType = StarModel.getStellarTypeFromTemperature(surfaceTemperature);

        //TODO: make it dependent on star type
        this.radius = randRange(50, 200, this.rng, GENERATION_STEPS.RADIUS) * Settings.EARTH_RADIUS;

        // TODO: do not hardcode
        const orbitRadius = this.rng(GENERATION_STEPS.ORBIT) * 5000000e3;

        this.orbit = {
            radius: orbitRadius,
            p: 2,
            period: getOrbitalPeriod(orbitRadius, this.parentBody?.physicalProperties.mass ?? 0),
            normalToPlane: Vector3.Up(),
            isPlaneAlignedWithParent: true
        };

        if (uniformRandBool(StarModel.RING_PROPORTION, this.rng, GENERATION_STEPS.RINGS)) {
            this.ringsUniforms = new RingsUniforms(this.rng);
        } else {
            this.ringsUniforms = null;
        }
    }

    public setSurfaceTemperature(temperature: number) {
        this.physicalProperties.temperature = temperature;
        this.stellarType = StarModel.getStellarTypeFromTemperature(temperature);
        this.surfaceColor.copyFrom(getRgbFromTemperature(temperature));
    }

    static getStellarTypeFromTemperature(temperature: number) {
        if (temperature < 3500) return STELLAR_TYPE.M;
        else if (temperature < 5000) return STELLAR_TYPE.K;
        else if (temperature < 6000) return STELLAR_TYPE.G;
        else if (temperature < 7500) return STELLAR_TYPE.F;
        else if (temperature < 10000) return STELLAR_TYPE.A;
        else if (temperature < 30000) return STELLAR_TYPE.B;
        else return STELLAR_TYPE.O;
    }
}
