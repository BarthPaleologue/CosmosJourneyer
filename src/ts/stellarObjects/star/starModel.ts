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
import { randRange, randRangeInt, uniformRandBool } from "extended-random";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { getRgbFromTemperature } from "../../utils/specrend";
import { Settings } from "../../settings";
import { getOrbitalPeriod } from "../../orbit/orbit";
import { OrbitProperties } from "../../orbit/orbitProperties";
import { StellarType } from "../common";
import { StarPhysicalProperties } from "../../architecture/physicalProperties";
import { CelestialBodyModel } from "../../architecture/celestialBody";
import { wheelOfFortune } from "../../utils/random";
import { StellarObjectModel } from "../../architecture/stellarObject";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { RingsModel } from "../../rings/ringsModel";
import { BodyType } from "../../architecture/bodyType";
import { GenerationSteps } from "../../utils/generationSteps";
import { starName } from "../../utils/parseToStrings";
import { StarSystemModel } from "../../starSystem/starSystemModel";

export class StarModel implements StellarObjectModel {
    readonly name: string;

    readonly bodyType = BodyType.STAR;
    readonly rng: (step: number) => number;
    readonly seed: number;

    readonly temperature: number;
    readonly color: Color3;
    stellarType: StellarType;
    readonly radius: number;

    readonly orbit: OrbitProperties;

    readonly physicalProperties: StarPhysicalProperties;

    static RING_PROPORTION = 0.2;

    readonly rings: RingsModel | null;

    readonly parentBody: CelestialBodyModel | null;

    readonly childrenBodies: CelestialBodyModel[] = [];

    readonly starSystemModel: StarSystemModel;

    constructor(seed: number, starSystemModel: StarSystemModel, parentBody: CelestialBodyModel | null = null) {
        this.seed = seed;
        this.rng = seededSquirrelNoise(this.seed);

        this.starSystemModel = starSystemModel;

        const stellarObjectIndex = this.starSystemModel.getStellarObjects().findIndex(([_, stellarObjectSeed]) => stellarObjectSeed === this.seed);
        this.name = starName(this.starSystemModel.name, stellarObjectIndex);

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
        const orbitRadius = this.rng(GenerationSteps.ORBIT) * 5000000e3;

        this.orbit = {
            radius: orbitRadius,
            p: 2,
            period: getOrbitalPeriod(orbitRadius, this.parentBody?.physicalProperties.mass ?? 0),
            normalToPlane: Vector3.Up(),
            isPlaneAlignedWithParent: true
        };

        if (uniformRandBool(StarModel.RING_PROPORTION, this.rng, GenerationSteps.RINGS)) {
            this.rings = new RingsModel(this.rng);
        } else {
            this.rings = null;
        }
    }

    public setSurfaceTemperature(temperature: number) {
        this.physicalProperties.temperature = temperature;
        this.stellarType = StarModel.GetStellarTypeFromTemperature(temperature);
        this.color.copyFrom(getRgbFromTemperature(temperature));
    }

    static GetStellarTypeFromTemperature(temperature: number) {
        if (temperature < 3500) return StellarType.M;
        else if (temperature < 5000) return StellarType.K;
        else if (temperature < 6000) return StellarType.G;
        else if (temperature < 7500) return StellarType.F;
        else if (temperature < 10000) return StellarType.A;
        else if (temperature < 30000) return StellarType.B;
        else return StellarType.O;
    }

    static GetRandomStellarType(rng: (step: number) => number) {
        // use wheel of fortune
        const wheel: [StellarType, number][] = [
            [StellarType.M, 0.765],
            [StellarType.K, 0.121],
            [StellarType.G, 0.076],
            [StellarType.F, 0.03],
            [StellarType.A, 0.006],
            [StellarType.B, 0.0013],
            [StellarType.O, 0.0000003]
        ];

        const r = rng(GenerationSteps.STELLAR_TYPE);

        return wheelOfFortune<StellarType>(wheel, r);
    }

    static GetRandomTemperatureFromStellarType(stellarType: StellarType, rng: (step: number) => number) {
        switch (stellarType) {
            case StellarType.M:
                return randRangeInt(2100, 3400, rng, GenerationSteps.TEMPERATURE);
            case StellarType.K:
                return randRangeInt(3400, 4900, rng, GenerationSteps.TEMPERATURE);
            case StellarType.G:
                return randRangeInt(4900, 5700, rng, GenerationSteps.TEMPERATURE);
            case StellarType.F:
                return randRangeInt(5700, 7200, rng, GenerationSteps.TEMPERATURE);
            case StellarType.A:
                return randRangeInt(7200, 9700, rng, GenerationSteps.TEMPERATURE);
            case StellarType.B:
                return randRangeInt(9700, 30000, rng, GenerationSteps.TEMPERATURE);
            case StellarType.O:
                return randRangeInt(30000, 52000, rng, GenerationSteps.TEMPERATURE);
        }
    }

    static GetRandomRadiusFromStellarType(stellarType: StellarType, rng: (step: number) => number) {
        const solarSize = 109 * Settings.EARTH_RADIUS;
        switch (stellarType) {
            case StellarType.M:
                return randRange(0.5, 0.7, rng, GenerationSteps.RADIUS) * solarSize;
            case StellarType.K:
                return randRange(0.7, 0.9, rng, GenerationSteps.RADIUS) * solarSize;
            case StellarType.G:
                return randRange(0.9, 1.1, rng, GenerationSteps.RADIUS) * solarSize;
            case StellarType.F:
                return randRange(1.1, 1.4, rng, GenerationSteps.RADIUS) * solarSize;
            case StellarType.A:
                return randRange(1.4, 1.8, rng, GenerationSteps.RADIUS) * solarSize;
            case StellarType.B:
                return randRange(1.8, 6.6, rng, GenerationSteps.RADIUS) * solarSize;
            case StellarType.O:
                return randRange(6.6, 15.0, rng, GenerationSteps.RADIUS) * solarSize;
        }
    }
}
