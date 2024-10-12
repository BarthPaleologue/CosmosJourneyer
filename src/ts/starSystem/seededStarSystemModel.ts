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

import { centeredRand, randRangeInt, uniformRandBool } from "extended-random";
import { Settings } from "../settings";
import { generateStarName } from "../utils/starNameGenerator";
import { wheelOfFortune } from "../utils/random";
import { AnomalyType } from "../anomalies/anomalyType";
import { PlanetarySystem, StarSystemModel } from "./starSystemModel";
import { StarSector } from "../starmap/starSector";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { hashVec3 } from "../utils/hashVec3";
import { CelestialBodyType } from "../architecture/celestialBody";
import { StarSystemCoordinates } from "../saveFile/universeCoordinates";
import { StellarObjectModel } from "../architecture/stellarObject";
import { AnomalyModel } from "../anomalies/anomaly";
import { getAnomalyName, getStellarObjectName } from "../utils/parseToStrings";
import { newSeededStarModel } from "../stellarObjects/star/starModel";
import { newSeededBlackHoleModel } from "../stellarObjects/blackHole/blackHoleModel";
import { newSeededNeutronStarModel } from "../stellarObjects/neutronStar/neutronStarModel";
import { getMoonSeed, getPlanetName } from "../planets/common";
import { newSeededTelluricPlanetModel } from "../planets/telluricPlanet/telluricPlanetModel";
import { newSeededGasPlanetModel } from "../planets/gasPlanet/gasPlanetModel";
import { newSeededMandelbulbModel } from "../anomalies/mandelbulb/mandelbulbModel";
import { newSeededJuliaSetModel } from "../anomalies/julia/juliaSetModel";
import { getRngFromSeed } from "../utils/getRngFromSeed";

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

    readonly coordinates: StarSystemCoordinates;

    readonly name: string;

    readonly stellarObjects: StellarObjectModel[] = [];

    readonly planetarySystems: PlanetarySystem[] = [];

    readonly anomalies: AnomalyModel[] = [];

    constructor(seed: SystemSeed) {
        this.seed = seed;

        const starSector = new StarSector(new Vector3(this.seed.starSectorX, this.seed.starSectorY, this.seed.starSectorZ));
        const localPosition = starSector.getLocalPositionOfStar(this.seed.index);

        this.coordinates = {
            starSectorX: this.seed.starSectorX,
            starSectorY: this.seed.starSectorY,
            starSectorZ: this.seed.starSectorZ,
            localX: localPosition.x,
            localY: localPosition.y,
            localZ: localPosition.z
        };

        const cellRNG = getRngFromSeed(hashVec3(seed.starSectorX, seed.starSectorY, seed.starSectorZ));
        const hash = centeredRand(cellRNG, 1 + seed.index) * Settings.SEED_HALF_RANGE;

        this.rng = getRngFromSeed(hash);

        this.name = generateStarName(this.rng, GenerationSteps.NAME);

        const nbStellarObjects = 1;
        for (let i = 0; i < nbStellarObjects; i++) {
            const stellarObjectType = this.getBodyTypeOfStellarObject(i);
            const seed = this.getStellarObjectSeed(i);
            const stellarObjectName = getStellarObjectName(this.name, i);
            switch (stellarObjectType) {
                case CelestialBodyType.STAR:
                    this.stellarObjects.push(newSeededStarModel(seed, stellarObjectName, null));
                    break;
                case CelestialBodyType.BLACK_HOLE:
                    this.stellarObjects.push(newSeededBlackHoleModel(seed, stellarObjectName, null));
                    break;
                case CelestialBodyType.NEUTRON_STAR:
                    this.stellarObjects.push(newSeededNeutronStarModel(seed, stellarObjectName, null));
                    break;
                default:
                    throw new Error("Unknown stellar object type");
            }
        }

        // Planets
        //Fixme: will not apply when more than one star
        const nbPlanets = this.getBodyTypeOfStellarObject(0) === CelestialBodyType.BLACK_HOLE ? 0 : randRangeInt(0, 7, this.rng, GenerationSteps.NB_PLANETS);
        for (let i = 0; i < nbPlanets; i++) {
            const bodyType = this.getBodyTypeOfPlanet(i);
            const planetName = getPlanetName(i, this.name, this.stellarObjects[0]);

            switch (bodyType) {
                case CelestialBodyType.TELLURIC_PLANET:
                    this.planetarySystems.push({
                        planet: newSeededTelluricPlanetModel(this.getPlanetSeed(i), planetName, this.stellarObjects[0]),
                        satellites: []
                    });
                    break;
                case CelestialBodyType.GAS_PLANET:
                    this.planetarySystems.push({
                        planet: newSeededGasPlanetModel(this.getPlanetSeed(i), planetName, this.stellarObjects[0]),
                        satellites: []
                    });
                    break;
                default:
                    throw new Error("Unknown planet type");
            }
        }

        // Satellites
        this.planetarySystems.forEach(({ planet, satellites }) => {
            for (let j = 0; j < planet.nbMoons; j++) {
                const satelliteName = getPlanetName(j, this.name, planet);
                const satelliteModel = newSeededTelluricPlanetModel(getMoonSeed(planet, j), satelliteName, planet);
                satellites.push(satelliteModel);
            }
        });

        const nbAnomalies = wheelOfFortune(
            [
                [0, 0.95],
                [1, 0.04],
                [2, 0.01]
            ],
            this.rng(GenerationSteps.GENERATE_ANOMALIES * 16)
        );

        // Anomalies
        for (let i = 0; i < nbAnomalies; i++) {
            const anomalySeed = this.getAnomalySeed(i);
            const anomalyType = this.getAnomalyType(i);
            const anomalyName = getAnomalyName(this.name, i);

            const stellarObjectModel = this.stellarObjects[0];

            switch (anomalyType) {
                case AnomalyType.MANDELBULB:
                    this.anomalies.push(newSeededMandelbulbModel(anomalySeed, anomalyName, stellarObjectModel));
                    break;
                case AnomalyType.JULIA_SET:
                    this.anomalies.push(newSeededJuliaSetModel(anomalySeed, anomalyName, stellarObjectModel));
                    break;
            }
        }
    }

    private getStellarObjectSeed(index: number) {
        if (index > this.stellarObjects.length) throw new Error("Star out of bound! " + index);
        return centeredRand(this.rng, GenerationSteps.GENERATE_STARS + index) * Settings.SEED_HALF_RANGE;
    }

    /**
     * Get the body type of the star
     * @param index
     * @see https://physics.stackexchange.com/questions/442154/how-common-are-neutron-stars
     */
    private getBodyTypeOfStellarObject(index: number) {
        if (index > this.stellarObjects.length) throw new Error("Star out of bound! " + index);

        // percentages are taken from https://physics.stackexchange.com/questions/442154/how-common-are-neutron-stars
        if (uniformRandBool(0.0006, this.rng, GenerationSteps.GENERATE_STARS + index)) return CelestialBodyType.BLACK_HOLE;
        if (uniformRandBool(0.0026, this.rng, GenerationSteps.GENERATE_STARS + index)) return CelestialBodyType.NEUTRON_STAR;

        return CelestialBodyType.STAR;
    }

    private getBodyTypeOfPlanet(index: number) {
        if (uniformRandBool(0.5, this.rng, GenerationSteps.CHOOSE_PLANET_TYPE + index)) return CelestialBodyType.TELLURIC_PLANET;
        return CelestialBodyType.GAS_PLANET;
    }

    private getPlanetSeed(index: number) {
        return centeredRand(this.rng, GenerationSteps.GENERATE_PLANETS + index) * Settings.SEED_HALF_RANGE;
    }

    private getAnomalySeed(index: number) {
        return centeredRand(this.rng, GenerationSteps.GENERATE_ANOMALIES + index * 100) * Settings.SEED_HALF_RANGE;
    }

    private getAnomalyType(index: number): AnomalyType {
        if (uniformRandBool(0.5, this.rng, GenerationSteps.GENERATE_ANOMALIES + index * 300)) return AnomalyType.MANDELBULB;
        return AnomalyType.JULIA_SET;
    }
}
