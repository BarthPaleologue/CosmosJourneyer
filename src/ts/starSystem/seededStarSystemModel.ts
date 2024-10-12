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
    STARS = 21,
    NB_PLANETS = 30,
    PLANETS = 200,
    PLANET_TYPE = 400,
    ANOMALIES = 666
}

export type SystemSeed = {
    starSectorX: number;
    starSectorY: number;
    starSectorZ: number;
    index: number;
};

export function newSeededStarSystemModel(seed: SystemSeed): StarSystemModel {
    const starSector = new StarSector(new Vector3(seed.starSectorX, seed.starSectorY, seed.starSectorZ));
    const localPosition = starSector.getLocalPositionOfStar(seed.index);

    const coordinates = {
        starSectorX: seed.starSectorX,
        starSectorY: seed.starSectorY,
        starSectorZ: seed.starSectorZ,
        localX: localPosition.x,
        localY: localPosition.y,
        localZ: localPosition.z
    };

    const cellRNG = getRngFromSeed(hashVec3(seed.starSectorX, seed.starSectorY, seed.starSectorZ));
    const hash = centeredRand(cellRNG, 1 + seed.index) * Settings.SEED_HALF_RANGE;

    const rng = getRngFromSeed(hash);

    const name = generateStarName(rng, GenerationSteps.NAME);

    const stellarObjects: StellarObjectModel[] = [];
    const nbStellarObjects = 1;
    for (let i = 0; i < nbStellarObjects; i++) {
        const stellarObjectType = getBodyTypeOfStellarObject(rng, i);
        const seed = centeredRand(rng, GenerationSteps.STARS + i) * Settings.SEED_HALF_RANGE;
        const stellarObjectName = getStellarObjectName(name, i);
        switch (stellarObjectType) {
            case CelestialBodyType.STAR:
                stellarObjects.push(newSeededStarModel(seed, stellarObjectName, null));
                break;
            case CelestialBodyType.BLACK_HOLE:
                stellarObjects.push(newSeededBlackHoleModel(seed, stellarObjectName, null));
                break;
            case CelestialBodyType.NEUTRON_STAR:
                stellarObjects.push(newSeededNeutronStarModel(seed, stellarObjectName, null));
                break;
            default:
                throw new Error("Unknown stellar object type");
        }
    }

    // Planets
    const planetarySystems: PlanetarySystem[] = [];
    //Fixme: will not apply when more than one star
    const nbPlanets = stellarObjects[0].bodyType === CelestialBodyType.BLACK_HOLE ? 0 : randRangeInt(0, 7, rng, GenerationSteps.NB_PLANETS);
    for (let i = 0; i < nbPlanets; i++) {
        const bodyType = uniformRandBool(0.5, rng, GenerationSteps.PLANET_TYPE + i) ? CelestialBodyType.TELLURIC_PLANET : CelestialBodyType.GAS_PLANET;
        const planetName = getPlanetName(i, name, stellarObjects[0]);

        const seed = centeredRand(rng, GenerationSteps.PLANETS + i) * Settings.SEED_HALF_RANGE;

        switch (bodyType) {
            case CelestialBodyType.TELLURIC_PLANET:
                planetarySystems.push({
                    planet: newSeededTelluricPlanetModel(seed, planetName, stellarObjects[0]),
                    satellites: []
                });
                break;
            case CelestialBodyType.GAS_PLANET:
                planetarySystems.push({
                    planet: newSeededGasPlanetModel(seed, planetName, stellarObjects[0]),
                    satellites: []
                });
                break;
            default:
                throw new Error("Unknown planet type");
        }
    }

    // Satellites
    planetarySystems.forEach(({ planet, satellites }) => {
        for (let j = 0; j < planet.nbMoons; j++) {
            const satelliteName = getPlanetName(j, name, planet);
            const satelliteModel = newSeededTelluricPlanetModel(getMoonSeed(planet, j), satelliteName, planet);
            satellites.push(satelliteModel);
        }
    });

    const anomalies: AnomalyModel[] = [];
    const nbAnomalies = wheelOfFortune(
        [
            [0, 0.95],
            [1, 0.04],
            [2, 0.01]
        ],
        rng(GenerationSteps.ANOMALIES * 16)
    );

    // Anomalies
    for (let i = 0; i < nbAnomalies; i++) {
        const anomalySeed = centeredRand(rng, GenerationSteps.ANOMALIES + i * 100) * Settings.SEED_HALF_RANGE;
        const anomalyType = uniformRandBool(0.5, rng, GenerationSteps.ANOMALIES + i * 300) ? AnomalyType.MANDELBULB : AnomalyType.JULIA_SET;
        const anomalyName = getAnomalyName(name, i);

        const stellarObjectModel = stellarObjects[0];

        switch (anomalyType) {
            case AnomalyType.MANDELBULB:
                anomalies.push(newSeededMandelbulbModel(anomalySeed, anomalyName, stellarObjectModel));
                break;
            case AnomalyType.JULIA_SET:
                anomalies.push(newSeededJuliaSetModel(anomalySeed, anomalyName, stellarObjectModel));
                break;
        }
    }

    return {
        name,
        coordinates,
        stellarObjects,
        planetarySystems,
        anomalies
    };
}

/**
 * Get the body type of the star
 * @param index
 * @see https://physics.stackexchange.com/questions/442154/how-common-are-neutron-stars
 */
function getBodyTypeOfStellarObject(rng: (index: number) => number, index: number) {
    // percentages are taken from https://physics.stackexchange.com/questions/442154/how-common-are-neutron-stars
    if (uniformRandBool(0.0006, rng, GenerationSteps.STARS + index)) return CelestialBodyType.BLACK_HOLE;
    if (uniformRandBool(0.0026, rng, GenerationSteps.STARS + index)) return CelestialBodyType.NEUTRON_STAR;

    return CelestialBodyType.STAR;
}
