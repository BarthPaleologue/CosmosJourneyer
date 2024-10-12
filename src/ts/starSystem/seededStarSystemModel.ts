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
import { StarSystemModel } from "./starSystemModel";
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
import { PlanetModel } from "../architecture/planet";
import { getMoonSeed, getPlanetName } from "../planets/common";
import { newSeededTelluricPlanetModel, TelluricPlanetModel } from "../planets/telluricPlanet/telluricPlanetModel";
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

    readonly name: string;

    readonly stellarObjectModels: StellarObjectModel[] = [];

    readonly planetModels: PlanetModel[] = [];
    readonly planetModelToSatellites: Map<PlanetModel, TelluricPlanetModel[]> = new Map();

    readonly anomalyModels: AnomalyModel[] = [];

    constructor(seed: SystemSeed) {
        this.seed = seed;

        const cellRNG = getRngFromSeed(hashVec3(seed.starSectorX, seed.starSectorY, seed.starSectorZ));
        const hash = centeredRand(cellRNG, 1 + seed.index) * Settings.SEED_HALF_RANGE;

        this.rng = getRngFromSeed(hash);

        this.name = generateStarName(this.rng, GenerationSteps.NAME);

        for (let i = 0; i < this.getNbStellarObjects(); i++) {
            const stellarObjectType = this.getBodyTypeOfStellarObject(i);
            const seed = this.getStellarObjectSeed(i);
            const stellarObjectName = getStellarObjectName(this.name, i);
            switch (stellarObjectType) {
                case CelestialBodyType.STAR:
                    this.stellarObjectModels.push(newSeededStarModel(seed, stellarObjectName, null));
                    break;
                case CelestialBodyType.BLACK_HOLE:
                    this.stellarObjectModels.push(newSeededBlackHoleModel(seed, stellarObjectName, null));
                    break;
                case CelestialBodyType.NEUTRON_STAR:
                    this.stellarObjectModels.push(newSeededNeutronStarModel(seed, stellarObjectName, null));
                    break;
                default:
                    throw new Error("Unknown stellar object type");
            }
        }

        // Planets
        for (let i = 0; i < this.getNbPlanets(); i++) {
            const bodyType = this.getBodyTypeOfPlanet(i);
            const planetName = getPlanetName(i, this.name, this.stellarObjectModels[0]);

            switch (bodyType) {
                case CelestialBodyType.TELLURIC_PLANET:
                    this.planetModels.push(newSeededTelluricPlanetModel(this.getPlanetSeed(i), planetName, this.stellarObjectModels[0]));
                    break;
                case CelestialBodyType.GAS_PLANET:
                    this.planetModels.push(newSeededGasPlanetModel(this.getPlanetSeed(i), planetName, this.stellarObjectModels[0]));
                    break;
                default:
                    throw new Error("Unknown planet type");
            }
        }

        // Satellites
        this.planetModels.forEach((planetModel) => {
            const satellites: TelluricPlanetModel[] = [];
            for (let j = 0; j < planetModel.nbMoons; j++) {
                const satelliteName = getPlanetName(j, this.name, planetModel);
                const satelliteModel = newSeededTelluricPlanetModel(getMoonSeed(planetModel, j), satelliteName, planetModel);
                satellites.push(satelliteModel);
            }
            this.planetModelToSatellites.set(planetModel, satellites);
        });

        // Anomalies
        for (let i = 0; i < this.getNbAnomalies(); i++) {
            const anomalySeed = this.getAnomalySeed(i);
            const anomalyType = this.getAnomalyType(i);
            const anomalyName = getAnomalyName(this.name, i);

            const stellarObjectModel = this.stellarObjectModels[0];

            switch (anomalyType) {
                case AnomalyType.MANDELBULB:
                    this.anomalyModels.push(newSeededMandelbulbModel(anomalySeed, anomalyName, stellarObjectModel));
                    break;
                case AnomalyType.JULIA_SET:
                    this.anomalyModels.push(newSeededJuliaSetModel(anomalySeed, anomalyName, stellarObjectModel));
                    break;
            }
        }
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

    private getStellarObjectSeed(index: number) {
        if (index > this.getNbStellarObjects()) throw new Error("Star out of bound! " + index);
        return centeredRand(this.rng, GenerationSteps.GENERATE_STARS + index) * Settings.SEED_HALF_RANGE;
    }

    /**
     * Get the body type of the star
     * @param index
     * @see https://physics.stackexchange.com/questions/442154/how-common-are-neutron-stars
     */
    private getBodyTypeOfStellarObject(index: number) {
        if (index > this.getNbStellarObjects()) throw new Error("Star out of bound! " + index);

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

    getNbAnomalies(): number {
        return wheelOfFortune(
            [
                [0, 0.95],
                [1, 0.04],
                [2, 0.01]
            ],
            this.rng(GenerationSteps.GENERATE_ANOMALIES * 16)
        );
    }

    getAnomalies(): AnomalyModel[] {
        return this.anomalyModels;
    }

    getPlanet(): PlanetModel[] {
        return this.planetModels;
    }

    getSatellitesOfPlanet(index: number): TelluricPlanetModel[] {
        const satellites = this.planetModelToSatellites.get(this.planetModels[index]);
        if (satellites === undefined) throw new Error("Planet out of bound! " + index);
        return satellites;
    }

    getPlanetaryMassObjects(): PlanetModel[] {
        const planetaryMassObjects: PlanetModel[] = [];
        for (const [planet, satellite] of this.planetModelToSatellites.entries()) {
            planetaryMassObjects.push(planet);
            planetaryMassObjects.push(...satellite);
        }
        return planetaryMassObjects;
    }

    getStellarObjects(): StellarObjectModel[] {
        return this.stellarObjectModels;
    }
}
