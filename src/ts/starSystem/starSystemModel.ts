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
import { BodyType } from "../model/common";
import { generateName } from "../utils/nameGenerator";
import { SystemSeed } from "../utils/systemSeed";

enum GenerationSteps {
    Name,
    NbStars = 20,
    GenerateStars = 21,
    NbPlanets = 30,
    GeneratePlanets = 200,
    ChoosePlanetType = 200
}

export class StarSystemModel {
    readonly seed: SystemSeed;
    readonly rng: (step: number) => number;

    private name: string;

    constructor(seed: SystemSeed) {
        this.seed = seed;
        this.rng = seededSquirrelNoise(this.seed.hash);

        this.name = generateName(this.rng, GenerationSteps.Name);
    }

    setName(name: string) {
        this.name = name;
    }

    getName(): string {
        return this.name;
    }

    getNbStars(): number {
        //return 1 + Math.floor(2 * this.rng(GenerationSteps.NbStars));
        return 1;
    }

    getNbPlanets(): number {
        if (this.getBodyTypeOfStar(0) === BodyType.BLACK_HOLE) return 0; //Fixme: will not apply when more than one star
        return randRangeInt(0, 7, this.rng, GenerationSteps.NbPlanets);
    }

    public getStarSeed(index: number) {
        if (index > this.getNbStars()) throw new Error("Star out of bound! " + index);
        return centeredRand(this.rng, GenerationSteps.GenerateStars + index) * Settings.SEED_HALF_RANGE;
    }

    /**
     * Get the body type of the star
     * @param index
     * @see https://physics.stackexchange.com/questions/442154/how-common-are-neutron-stars
     */
    public getBodyTypeOfStar(index: number) {
        if (index > this.getNbStars()) throw new Error("Star out of bound! " + index);

        // percentages are taken from https://physics.stackexchange.com/questions/442154/how-common-are-neutron-stars
        if (uniformRandBool(0.0006, this.rng, GenerationSteps.GenerateStars + index)) return BodyType.BLACK_HOLE;
        if (uniformRandBool(0.0026, this.rng, GenerationSteps.GenerateStars + index)) return BodyType.NEUTRON_STAR;

        return BodyType.STAR;
    }

    public getBodyTypeOfPlanet(index: number) {
        if (uniformRandBool(0.5, this.rng, GenerationSteps.ChoosePlanetType + index)) return BodyType.TELLURIC_PLANET;
        return BodyType.GAS_PLANET;
    }

    public getPlanetSeed(index: number) {
        return centeredRand(this.rng, GenerationSteps.GeneratePlanets + index) * Settings.SEED_HALF_RANGE;
    }
}
