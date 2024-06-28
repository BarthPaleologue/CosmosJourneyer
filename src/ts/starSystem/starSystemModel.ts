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
import { centeredRand, randRangeInt, uniformRandBool } from "extended-random";
import { Settings } from "../settings";
import { generateStarName } from "../utils/starNameGenerator";
import { SystemSeed } from "../utils/systemSeed";
import { BodyType } from "../architecture/bodyType";
import { wheelOfFortune } from "../utils/random";
import { AnomalyType } from "../anomalies/anomalyType";

const enum GenerationSteps {
    NAME,
    NB_STARS = 20,
    GENERATE_STARS = 21,
    NB_PLANETS = 30,
    GENERATE_PLANETS = 200,
    CHOOSE_PLANET_TYPE = 400,
    GENERATE_ANOMALIES = 666
}

export class StarSystemModel {
    readonly seed: SystemSeed;
    readonly rng: (step: number) => number;

    private name: string;

    constructor(seed: SystemSeed) {
        this.seed = seed;
        this.rng = seededSquirrelNoise(this.seed.hash);

        this.name = generateStarName(this.rng, GenerationSteps.NAME);
    }

    setName(name: string) {
        this.name = name;
    }

    getName(): string {
        return this.name;
    }

    getNbStellarObjects(): number {
        //return 1 + Math.floor(2 * this.rng(GenerationSteps.NbStars));
        return 1;
    }

    getNbPlanets(): number {
        if (this.getBodyTypeOfStellarObject(0) === BodyType.BLACK_HOLE) return 0; //Fixme: will not apply when more than one star
        return randRangeInt(0, 7, this.rng, GenerationSteps.NB_PLANETS);
    }

    public getStellarObjectSeed(index: number) {
        if (index > this.getNbStellarObjects()) throw new Error("Star out of bound! " + index);
        return centeredRand(this.rng, GenerationSteps.GENERATE_STARS + index) * Settings.SEED_HALF_RANGE;
    }

    /**
     * Get the body type of the star
     * @param index
     * @see https://physics.stackexchange.com/questions/442154/how-common-are-neutron-stars
     */
    public getBodyTypeOfStellarObject(index: number) {
        if (index > this.getNbStellarObjects()) throw new Error("Star out of bound! " + index);

        // percentages are taken from https://physics.stackexchange.com/questions/442154/how-common-are-neutron-stars
        if (uniformRandBool(0.0006, this.rng, GenerationSteps.GENERATE_STARS + index)) return BodyType.BLACK_HOLE;
        if (uniformRandBool(0.0026, this.rng, GenerationSteps.GENERATE_STARS + index)) return BodyType.NEUTRON_STAR;

        return BodyType.STAR;
    }

    public getBodyTypeOfPlanet(index: number) {
        if (uniformRandBool(0.5, this.rng, GenerationSteps.CHOOSE_PLANET_TYPE + index)) return BodyType.TELLURIC_PLANET;
        return BodyType.GAS_PLANET;
    }

    public getPlanetSeed(index: number) {
        return centeredRand(this.rng, GenerationSteps.GENERATE_PLANETS + index) * Settings.SEED_HALF_RANGE;
    }

    public getAnomalySeed(index: number) {
        return centeredRand(this.rng, GenerationSteps.GENERATE_ANOMALIES + index * 100) * Settings.SEED_HALF_RANGE;
    }

    public getAnomalyType(index: number): AnomalyType {
        if (uniformRandBool(0.5, this.rng, GenerationSteps.GENERATE_ANOMALIES + index * 300)) return AnomalyType.MANDELBULB;
        return AnomalyType.JULIA_SET;
    }

    public getNbAnomalies(): number {
        return wheelOfFortune(
            [
                [0, 0.95],
                [1, 0.04],
                [2, 0.01]
            ],
            this.rng(GenerationSteps.GENERATE_ANOMALIES * 16)
        );
    }
}
