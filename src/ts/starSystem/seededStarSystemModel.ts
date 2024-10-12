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
import { centeredRand, randRangeInt, uniformRandBool } from "extended-random";
import { Settings } from "../settings";
import { generateStarName } from "../utils/starNameGenerator";
import { wheelOfFortune } from "../utils/random";
import { AnomalyType } from "../anomalies/anomalyType";
import { StarSystemModel } from "./starSystemModel";
import { StarSector } from "../starmap/starSector";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { hashVec3 } from "../utils/hashVec3";
import { CelestialBodyType } from "../architecture/celestialBody";
import { StarSystemCoordinates } from "../saveFile/universeCoordinates";

const enum GenerationSteps {
    NAME,
    NB_STARS = 20,
    GENERATE_STARS = 21,
    NB_PLANETS = 30,
    GENERATE_PLANETS = 200,
    CHOOSE_PLANET_TYPE = 400,
    GENERATE_ANOMALIES = 666
}

export type SystemSeed = {
    starSectorX: number;
    starSectorY: number;
    starSectorZ: number;
    index: number;
};

export class SeededStarSystemModel implements StarSystemModel {
    readonly seed: SystemSeed;
    readonly rng: (step: number) => number;

    readonly name: string;

    constructor(seed: SystemSeed) {
        this.seed = seed;

        const cellRNG = seededSquirrelNoise(hashVec3(seed.starSectorX, seed.starSectorY, seed.starSectorZ));
        const hash = centeredRand(cellRNG, 1 + seed.index) * Settings.SEED_HALF_RANGE;

        this.rng = seededSquirrelNoise(hash);

        this.name = generateStarName(this.rng, GenerationSteps.NAME);
    }

    getCoordinates(): StarSystemCoordinates {
        const starSector = new StarSector(new Vector3(this.seed.starSectorX, this.seed.starSectorY, this.seed.starSectorZ));
        const localPosition = starSector.getLocalPositionOfStar(this.seed.index);

        return {
            starSectorX: this.seed.starSectorX,
            starSectorY: this.seed.starSectorY,
            starSectorZ: this.seed.starSectorZ,
            localX: localPosition.x,
            localY: localPosition.y,
            localZ: localPosition.z
        };
    }

    getNbStellarObjects(): number {
        //return 1 + Math.floor(2 * this.rng(GenerationSteps.NbStars));
        return 1;
    }

    getNbPlanets(): number {
        if (this.getBodyTypeOfStellarObject(0) === CelestialBodyType.BLACK_HOLE) return 0; //Fixme: will not apply when more than one star
        return randRangeInt(0, 7, this.rng, GenerationSteps.NB_PLANETS);
    }

    public getStellarObjectSeed(index: number) {
        if (index > this.getNbStellarObjects()) throw new Error("Star out of bound! " + index);
        return centeredRand(this.rng, GenerationSteps.GENERATE_STARS + index) * Settings.SEED_HALF_RANGE;
    }

    public getStellarObjects(): [CelestialBodyType, number][] {
        const nbStars = this.getNbStellarObjects();
        const stars: [CelestialBodyType, number][] = [];

        for (let i = 0; i < nbStars; i++) {
            stars.push([this.getBodyTypeOfStellarObject(i), this.getStellarObjectSeed(i)]);
        }

        return stars;
    }

    /**
     * Get the body type of the star
     * @param index
     * @see https://physics.stackexchange.com/questions/442154/how-common-are-neutron-stars
     */
    public getBodyTypeOfStellarObject(index: number) {
        if (index > this.getNbStellarObjects()) throw new Error("Star out of bound! " + index);

        // percentages are taken from https://physics.stackexchange.com/questions/442154/how-common-are-neutron-stars
        if (uniformRandBool(0.0006, this.rng, GenerationSteps.GENERATE_STARS + index)) return CelestialBodyType.BLACK_HOLE;
        if (uniformRandBool(0.0026, this.rng, GenerationSteps.GENERATE_STARS + index)) return CelestialBodyType.NEUTRON_STAR;

        return CelestialBodyType.STAR;
    }

    public getBodyTypeOfPlanet(index: number) {
        if (uniformRandBool(0.5, this.rng, GenerationSteps.CHOOSE_PLANET_TYPE + index)) return CelestialBodyType.TELLURIC_PLANET;
        return CelestialBodyType.GAS_PLANET;
    }

    public getPlanets(): [CelestialBodyType, number][] {
        const nbPlanets = this.getNbPlanets();
        const planets: [CelestialBodyType, number][] = [];

        for (let i = 0; i < nbPlanets; i++) {
            planets.push([this.getBodyTypeOfPlanet(i), this.getPlanetSeed(i)]);
        }

        return planets;
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

    public getAnomalies(): [AnomalyType, number][] {
        const nbAnomalies = this.getNbAnomalies();
        const anomalies: [AnomalyType, number][] = [];

        for (let i = 0; i < nbAnomalies; i++) {
            anomalies.push([this.getAnomalyType(i), this.getAnomalySeed(i)]);
        }

        return anomalies;
    }
}
