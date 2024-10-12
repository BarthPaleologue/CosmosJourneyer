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
import { getPlanetaryMassObjects, PlanetarySystem, StarSystemModel } from "./starSystemModel";
import { StarSector } from "../starmap/starSector";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { hashVec3 } from "../utils/hashVec3";
import { CelestialBodyModel, CelestialBodyType } from "../architecture/celestialBody";
import { StellarObjectModel } from "../architecture/stellarObject";
import { AnomalyModel } from "../anomalies/anomaly";
import { Alphabet, ReversedGreekAlphabet } from "../utils/parseToStrings";
import { newSeededStarModel } from "../stellarObjects/star/starModel";
import { newSeededBlackHoleModel } from "../stellarObjects/blackHole/blackHoleModel";
import { newSeededNeutronStarModel } from "../stellarObjects/neutronStar/neutronStarModel";
import { newSeededTelluricPlanetModel } from "../planets/telluricPlanet/telluricPlanetModel";
import { newSeededGasPlanetModel } from "../planets/gasPlanet/gasPlanetModel";
import { newSeededMandelbulbModel } from "../anomalies/mandelbulb/mandelbulbModel";
import { newSeededJuliaSetModel } from "../anomalies/julia/juliaSetModel";
import { getRngFromSeed } from "../utils/getRngFromSeed";
import { romanNumeral } from "../utils/romanNumerals";
import { SystemObjectId, SystemObjectType } from "../saveFile/universeCoordinates";
import { newSeededSpaceStationModel } from "../spacestation/spacestationModel";

const enum GenerationSteps {
    NAME,
    NB_STARS = 20,
    STARS = 21,
    NB_PLANETS = 30,
    PLANETS = 200,
    PLANET_TYPE = 400,
    MOONS = 11,
    ANOMALIES = 666,
    SPACE_STATIONS = 2000
}

/**
 * Seed used to generate star systems in a pseudo-random fashion.
 */
export type SystemSeed = {
    /**
     * The X coordinate of the star sector (integer).
     */
    starSectorX: number;
    /**
     * The Y coordinate of the star sector (integer).
     */
    starSectorY: number;
    /**
     * The Z coordinate of the star sector (integer).
     */
    starSectorZ: number;
    /**
     * The index of the system inside its star sector (integer).
     */
    index: number;
};

/**
 * Generates a new star system data model given a seed using a pseudo-random number generator.
 * @param seed The seed of the star system.
 * @returns The data model of the generated star system.
 */
export function newSeededStarSystemModel(seed: SystemSeed): StarSystemModel {
    // extract coordinates from seed
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

    // init pseudo-random number generator
    const cellRNG = getRngFromSeed(hashVec3(seed.starSectorX, seed.starSectorY, seed.starSectorZ));
    const hash = centeredRand(cellRNG, 1 + seed.index) * Settings.SEED_HALF_RANGE;
    const rng = getRngFromSeed(hash);

    const systemName = generateStarName(rng, GenerationSteps.NAME);

    // generate stellar objects of the system first (we can assume the other objects don't have a significant influence on the stellar objects)
    const stellarObjects: StellarObjectModel[] = [];
    const nbStellarObjects = 1;
    for (let i = 0; i < nbStellarObjects; i++) {
        const stellarObjectType = getBodyTypeOfStellarObject(rng, i);
        const seed = centeredRand(rng, GenerationSteps.STARS + i) * Settings.SEED_HALF_RANGE;
        const stellarObjectName = `${systemName} ${Alphabet[i].toUpperCase()}`;
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

    // Afterward planets are generated. We can assume they only depend on the stellar objects.
    const planetarySystems: PlanetarySystem[] = [];
    //Fixme: planets need to work with black holes as well at some point
    const nbPlanets = stellarObjects[0].bodyType === CelestialBodyType.BLACK_HOLE ? 0 : randRangeInt(0, 7, rng, GenerationSteps.NB_PLANETS);
    for (let i = 0; i < nbPlanets; i++) {
        const bodyType = uniformRandBool(0.5, rng, GenerationSteps.PLANET_TYPE + i) ? CelestialBodyType.TELLURIC_PLANET : CelestialBodyType.GAS_PLANET;
        const planetName = `${systemName} ${romanNumeral(i + 1)}`;

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

    // For each planet, generate satellites
    planetarySystems.forEach(({ planet, satellites }) => {
        const planetRng = getRngFromSeed(planet.seed);
        for (let j = 0; j < planet.nbMoons; j++) {
            const satelliteName = `${planet.name}${Alphabet[j]}`;
            const satelliteSeed = centeredRand(planetRng, GenerationSteps.MOONS + j) * Settings.SEED_HALF_RANGE;
            const satelliteModel = newSeededTelluricPlanetModel(satelliteSeed, satelliteName, planet);
            satellites.push(satelliteModel);
        }
    });

    // Finally, generate anomalies
    const anomalies: AnomalyModel[] = [];
    const nbAnomalies = wheelOfFortune(
        [
            [0, 0.95],
            [1, 0.04],
            [2, 0.01]
        ],
        rng(GenerationSteps.ANOMALIES * 16)
    );
    for (let i = 0; i < nbAnomalies; i++) {
        const anomalySeed = centeredRand(rng, GenerationSteps.ANOMALIES + i * 100) * Settings.SEED_HALF_RANGE;
        const anomalyType = uniformRandBool(0.5, rng, GenerationSteps.ANOMALIES + i * 300) ? AnomalyType.MANDELBULB : AnomalyType.JULIA_SET;
        const anomalyName = `${systemName} ${ReversedGreekAlphabet[i].toUpperCase()}`;

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

    // finally, space station are placed
    const planetToPotentialScore = new Map<CelestialBodyModel, number>();

    const planetModels = planetarySystems.map((system) => system.planet);

    planetModels.forEach((planetModel) => {
        let score = 0;
        const nbMoons = planetModel.nbMoons;
        score += nbMoons;

        const hasRings = planetModel.rings !== null;
        score += hasRings ? 2 : 0;

        planetToPotentialScore.set(planetModel, score);
    });

    // sort planets by potential score
    const sortedPlanets = Array.from(planetModels);
    sortedPlanets.sort((planetA, planetB) => {
        const scoreA = planetToPotentialScore.get(planetA) ?? 0;
        const scoreB = planetToPotentialScore.get(planetB) ?? 0;
        return scoreB - scoreA;
    });

    const nbStations = Math.min(planetModels.length, Math.max(1, rng(77) * Math.floor(planetModels.length / 2)));

    const planetsWithStations = sortedPlanets.slice(0, nbStations);

    const planetaryMassObjects = getPlanetaryMassObjects(planetarySystems);
    const spaceStationParentObjectIds = planetsWithStations.map<SystemObjectId>((planet) => {
        const index = planetaryMassObjects.findIndex((obj) => obj === planet);
        if (index === -1) {
            throw new Error("Space station parent object not found");
        }

        return {
            objectType: SystemObjectType.PLANETARY_MASS_OBJECT,
            objectIndex: index
        };
    });

    const spaceStations = spaceStationParentObjectIds.map((parentId, index) => {
        const parent = planetsWithStations[index];
        const parentRng = getRngFromSeed(parent.seed);
        const stationSeed = centeredRand(parentRng, GenerationSteps.SPACE_STATIONS + index) * Settings.SEED_HALF_RANGE;
        const spaceStationModel = newSeededSpaceStationModel(stationSeed, stellarObjects[0], coordinates, parent);

        return {
            model: spaceStationModel,
            parent: parentId
        };
    });

    return {
        name: systemName,
        coordinates,
        stellarObjects,
        planetarySystems,
        anomalies,
        spaceStations
    };
}

/**
 * Get the body type of the stellar object at the given index using real-world statistics.
 * @param rng Random number generator
 * @param index Index of the stellar object
 * @see https://physics.stackexchange.com/questions/442154/how-common-are-neutron-stars
 */
function getBodyTypeOfStellarObject(rng: (index: number) => number, index: number) {
    // percentages are taken from https://physics.stackexchange.com/questions/442154/how-common-are-neutron-stars
    if (uniformRandBool(0.0006, rng, GenerationSteps.STARS + index)) return CelestialBodyType.BLACK_HOLE;
    if (uniformRandBool(0.0026, rng, GenerationSteps.STARS + index)) return CelestialBodyType.NEUTRON_STAR;

    return CelestialBodyType.STAR;
}
