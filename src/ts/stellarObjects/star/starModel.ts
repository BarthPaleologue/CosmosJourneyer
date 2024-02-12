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
import { randRange, randRangeInt, uniformRandBool } from "extended-random";
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
import { wheelOfFortune } from "../../utils/wheelOfFortune";
import { StellarObjectModel } from "../../architecture/stellarObject";
import { Color3 } from "@babylonjs/core/Maths/math.color";

export class StarModel implements StellarObjectModel {
    readonly bodyType = BODY_TYPE.STAR;
    readonly rng: (step: number) => number;
    readonly seed: number;

    readonly temperature: number;
    readonly color: Color3;
    stellarType: STELLAR_TYPE;
    readonly radius: number;

    readonly orbit: OrbitProperties;

    readonly physicalProperties: StarPhysicalProperties;

    static RING_PROPORTION = 0.2;
    readonly ringsUniforms;

    readonly parentBody: CelestialBodyModel | null;

    readonly childrenBodies: CelestialBodyModel[] = [];

    constructor(seed: number, parentBody: CelestialBodyModel | null = null) {
        this.seed = seed;
        this.rng = seededSquirrelNoise(this.seed);

        this.stellarType = StarModel.GetRandomStellarType(this.rng);

        this.temperature = StarModel.GetRandomTemperatureFromStellarType(this.stellarType, this.rng);
        this.color = getRgbFromTemperature(this.temperature);

        this.parentBody = parentBody;

        this.physicalProperties = {
            mass: 1000,
            rotationPeriod: 24 * 60 * 60,
            temperature: this.temperature,
            axialTilt: 0
        };

        this.radius = StarModel.GetRandomRadiusFromStellarType(this.stellarType, this.rng);

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
        this.color.copyFrom(getRgbFromTemperature(temperature));
    }

    public getNbSpaceStations(): number {
        if(uniformRandBool(0.001, this.rng, GENERATION_STEPS.SPACE_STATION)) return 1;
        return 0;
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

    static GetRandomStellarType(rng: (step: number) => number) {
        // use wheel of fortune
        const wheel: [STELLAR_TYPE, number][] = [
            [STELLAR_TYPE.M, 0.765],
            [STELLAR_TYPE.K, 0.121],
            [STELLAR_TYPE.G, 0.076],
            [STELLAR_TYPE.F, 0.03],
            [STELLAR_TYPE.A, 0.006],
            [STELLAR_TYPE.B, 0.0013],
            [STELLAR_TYPE.O, 0.0000003]
        ];

        const r = rng(GENERATION_STEPS.STELLAR_TYPE);

        return wheelOfFortune<STELLAR_TYPE>(wheel, r);
    }

    static GetRandomTemperatureFromStellarType(stellarType: STELLAR_TYPE, rng: (step: number) => number) {
        switch (stellarType) {
            case STELLAR_TYPE.M:
                return randRangeInt(2100, 3400, rng, GENERATION_STEPS.TEMPERATURE);
            case STELLAR_TYPE.K:
                return randRangeInt(3400, 4900, rng, GENERATION_STEPS.TEMPERATURE);
            case STELLAR_TYPE.G:
                return randRangeInt(4900, 5700, rng, GENERATION_STEPS.TEMPERATURE);
            case STELLAR_TYPE.F:
                return randRangeInt(5700, 7200, rng, GENERATION_STEPS.TEMPERATURE);
            case STELLAR_TYPE.A:
                return randRangeInt(7200, 9700, rng, GENERATION_STEPS.TEMPERATURE);
            case STELLAR_TYPE.B:
                return randRangeInt(9700, 30000, rng, GENERATION_STEPS.TEMPERATURE);
            case STELLAR_TYPE.O:
                return randRangeInt(30000, 52000, rng, GENERATION_STEPS.TEMPERATURE);
        }
    }

    static GetRandomRadiusFromStellarType(stellarType: STELLAR_TYPE, rng: (step: number) => number) {
        const solarSize = 109 * Settings.EARTH_RADIUS;
        switch (stellarType) {
            case STELLAR_TYPE.M:
                return randRange(0.5, 0.7, rng, GENERATION_STEPS.RADIUS) * solarSize;
            case STELLAR_TYPE.K:
                return randRange(0.7, 0.9, rng, GENERATION_STEPS.RADIUS) * solarSize;
            case STELLAR_TYPE.G:
                return randRange(0.9, 1.1, rng, GENERATION_STEPS.RADIUS) * solarSize;
            case STELLAR_TYPE.F:
                return randRange(1.1, 1.4, rng, GENERATION_STEPS.RADIUS) * solarSize;
            case STELLAR_TYPE.A:
                return randRange(1.4, 1.8, rng, GENERATION_STEPS.RADIUS) * solarSize;
            case STELLAR_TYPE.B:
                return randRange(1.8, 6.6, rng, GENERATION_STEPS.RADIUS) * solarSize;
            case STELLAR_TYPE.O:
                return randRange(6.6, 15.0, rng, GENERATION_STEPS.RADIUS) * solarSize;
        }
    }
}
