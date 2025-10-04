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

import { type StarSystemCoordinates } from "@/backend/universe/starSystemCoordinates";

import { getRngFromSeed } from "@/utils/getRngFromSeed";
import { wheelOfFortune } from "@/utils/random";
import { Alphabet, ReversedGreekAlphabet } from "@/utils/strings/parseToStrings";
import { romanNumeral } from "@/utils/strings/romanNumerals";
import { generateStarName } from "@/utils/strings/starNameGenerator";
import type { Vector3Like } from "@/utils/types";
import { isNonEmptyArray } from "@/utils/types";

import { Settings } from "@/settings";

import {
    type AnomalyModel,
    type AnomalyType,
    type OrbitalFacilityModel,
    type PlanetModel,
    type StellarObjectModel,
} from "../orbitalObjects/index";
import { createOrbitalObjectId } from "../orbitalObjects/orbitalObjectId";
import { OrbitalObjectType } from "../orbitalObjects/orbitalObjectType";
import { type TelluricSatelliteModel } from "../orbitalObjects/telluricSatelliteModel";
import { type StarSystemModel } from "../starSystemModel";
import { newSeededJuliaSetModel } from "./anomalies/juliaSetModelGenerator";
import { newSeededMandelboxModel } from "./anomalies/mandelboxModelGenerator";
import { newSeededMandelbulbModel } from "./anomalies/mandelbulbModelGenerator";
import { newSeededMengerSpongeModel } from "./anomalies/mengerSpongeModelGenerator";
import { newSeededSierpinskiPyramidModel } from "./anomalies/sierpinskiPyramidModelGenerator";
import { newSeededGasPlanetModel } from "./gasPlanetModelGenerator";
import { newSeededSpaceElevatorModel } from "./orbitalFacilities/spaceElevatorModelGenerator";
import { newSeededSpaceStationModel } from "./orbitalFacilities/spaceStationModelGenerator";
import { newSeededBlackHoleModel } from "./stellarObjects/blackHoleModelGenerator";
import { newSeededNeutronStarModel } from "./stellarObjects/neutronStarModelGenerator";
import { newSeededStarModel } from "./stellarObjects/starModelGenerator";
import { newSeededTelluricPlanetModel } from "./telluricPlanetModelGenerator";
import { newSeededTelluricSatelliteModel } from "./telluricSatelliteModelGenerator";

const enum GenerationSteps {
    NAME,
    NB_STARS = 20,
    STARS = 21,
    NB_PLANETS = 30,
    PLANETS = 200,
    PLANET_TYPE = 400,
    NB_MOONS = 10,
    MOONS = 11,
    ANOMALIES = 666,
    SPACE_STATIONS = 2000,
}

/**
 * Generates a new star system data model given a seed using a pseudo-random number generator.
 * @param systemRng The pseudo-random generator for the star system.
 * @param coordinates The coordinates of the star system within the galaxy.
 * @param position The position of the star system within its sector.
 * @param isCivilized Whether the generated system should be considered civilized.
 * @returns The data model of the generated star system.
 */
export function newSeededStarSystemModel(
    systemRng: (step: number) => number,
    coordinates: StarSystemCoordinates,
    position: Vector3Like,
    isCivilized: boolean,
): StarSystemModel {
    const systemName = generateStarName(systemRng, GenerationSteps.NAME);

    // generate stellar objects of the system first (we can assume the other objects don't have a significant influence on the stellar objects)
    const stellarObjects: Array<StellarObjectModel> = [];

    const stellarObjectType = getBodyTypeOfStellarObject(systemRng, 0);
    const seed = centeredRand(systemRng, GenerationSteps.STARS + 0) * Settings.SEED_HALF_RANGE;
    const stellarObjectName = `${systemName} ${Alphabet.charAt(0).toUpperCase()}`;
    switch (stellarObjectType) {
        case OrbitalObjectType.STAR:
            stellarObjects.push(
                newSeededStarModel(createOrbitalObjectId([], OrbitalObjectType.STAR, 0), seed, stellarObjectName, []),
            );
            break;
        case OrbitalObjectType.BLACK_HOLE:
            stellarObjects.push(
                newSeededBlackHoleModel(
                    createOrbitalObjectId([], OrbitalObjectType.NEUTRON_STAR, 0),
                    seed,
                    stellarObjectName,
                    [],
                ),
            );
            break;
        case OrbitalObjectType.NEUTRON_STAR:
            stellarObjects.push(
                newSeededNeutronStarModel(
                    createOrbitalObjectId([], OrbitalObjectType.BLACK_HOLE, 0),
                    seed,
                    stellarObjectName,
                    [],
                ),
            );
            break;
    }

    // Afterward planets are generated. We can assume they only depend on the stellar objects.
    const planets: Array<PlanetModel> = [];
    const satellites: Array<TelluricSatelliteModel> = [];

    const firstStellarObject = stellarObjects[0];
    if (firstStellarObject === undefined) {
        throw new Error("No stellar objects were generated for the star system");
    }

    //Fixme: planets need to work with black holes as well at some point
    const nbPlanets =
        firstStellarObject.type === OrbitalObjectType.BLACK_HOLE
            ? 0
            : randRangeInt(0, 7, systemRng, GenerationSteps.NB_PLANETS);
    for (let i = 0; i < nbPlanets; i++) {
        const bodyType = uniformRandBool(0.5, systemRng, GenerationSteps.PLANET_TYPE + i)
            ? OrbitalObjectType.TELLURIC_PLANET
            : OrbitalObjectType.GAS_PLANET;
        const planetName = `${systemName} ${romanNumeral(i + 1)}`;
        const parentIds = stellarObjects.map((object) => object.id);

        const seed = centeredRand(systemRng, GenerationSteps.PLANETS + i) * Settings.SEED_HALF_RANGE;

        switch (bodyType) {
            case OrbitalObjectType.TELLURIC_PLANET:
                planets.push(
                    newSeededTelluricPlanetModel(
                        createOrbitalObjectId(parentIds, OrbitalObjectType.TELLURIC_PLANET, i),
                        seed,
                        planetName,
                        stellarObjects,
                    ),
                );
                break;
            case OrbitalObjectType.GAS_PLANET:
                planets.push(
                    newSeededGasPlanetModel(
                        createOrbitalObjectId(parentIds, OrbitalObjectType.GAS_PLANET, i),
                        seed,
                        planetName,
                        stellarObjects,
                    ),
                );
                break;
        }
    }

    // For each planet, generate satellites
    planets.forEach((planet) => {
        const planetRng = getRngFromSeed(planet.seed);
        const nbMoons =
            planet.type === OrbitalObjectType.GAS_PLANET
                ? randRangeInt(0, 3, planetRng, GenerationSteps.NB_MOONS)
                : randRangeInt(0, 2, planetRng, GenerationSteps.NB_MOONS);

        for (let j = 0; j < nbMoons; j++) {
            const satelliteName = `${planet.name}${Alphabet[j]}`;
            const satelliteSeed = centeredRand(planetRng, GenerationSteps.MOONS + j) * Settings.SEED_HALF_RANGE;
            const satelliteId = createOrbitalObjectId([planet.id], OrbitalObjectType.TELLURIC_SATELLITE, j);
            const satelliteModel = newSeededTelluricSatelliteModel(satelliteId, satelliteSeed, satelliteName, [planet]);
            satellites.push(satelliteModel);
        }
    });

    // Finally, generate anomalies
    const anomalies: Array<AnomalyModel> = [];
    const nbAnomalies = wheelOfFortune(
        [
            [0, 0.96],
            [1, 0.04],
        ],
        systemRng(GenerationSteps.ANOMALIES),
    );
    for (let i = 0; i < nbAnomalies; i++) {
        const anomalySeed = centeredRand(systemRng, GenerationSteps.ANOMALIES + i * 100) * Settings.SEED_HALF_RANGE;
        const anomalyType: AnomalyType = wheelOfFortune(
            [
                [OrbitalObjectType.MANDELBULB, 1],
                [OrbitalObjectType.MANDELBOX, 1],
                [OrbitalObjectType.JULIA_SET, 1],
                [OrbitalObjectType.SIERPINSKI_PYRAMID, 1],
                [OrbitalObjectType.MENGER_SPONGE, 1],
            ],
            systemRng(GenerationSteps.ANOMALIES + i * 300),
        );
        const anomalyName = `${systemName} ${ReversedGreekAlphabet.charAt(i).toUpperCase()}`;
        const parentIds = stellarObjects.map((object) => object.id);

        switch (anomalyType) {
            case OrbitalObjectType.MANDELBULB:
                anomalies.push(
                    newSeededMandelbulbModel(
                        createOrbitalObjectId(parentIds, OrbitalObjectType.MANDELBULB, i),
                        anomalySeed,
                        anomalyName,
                        [firstStellarObject],
                    ),
                );
                break;
            case OrbitalObjectType.JULIA_SET:
                anomalies.push(
                    newSeededJuliaSetModel(
                        createOrbitalObjectId(parentIds, OrbitalObjectType.JULIA_SET, i),
                        anomalySeed,
                        anomalyName,
                        [firstStellarObject],
                    ),
                );
                break;
            case OrbitalObjectType.MANDELBOX:
                anomalies.push(
                    newSeededMandelboxModel(
                        createOrbitalObjectId(parentIds, OrbitalObjectType.MANDELBOX, i),
                        anomalySeed,
                        anomalyName,
                        [firstStellarObject],
                    ),
                );
                break;
            case OrbitalObjectType.SIERPINSKI_PYRAMID:
                anomalies.push(
                    newSeededSierpinskiPyramidModel(
                        createOrbitalObjectId(parentIds, OrbitalObjectType.SIERPINSKI_PYRAMID, i),
                        anomalySeed,
                        anomalyName,
                        [firstStellarObject],
                    ),
                );
                break;
            case OrbitalObjectType.MENGER_SPONGE:
                anomalies.push(
                    newSeededMengerSpongeModel(
                        createOrbitalObjectId(parentIds, OrbitalObjectType.MENGER_SPONGE, i),
                        anomalySeed,
                        anomalyName,
                        [firstStellarObject],
                    ),
                );
                break;
        }
    }

    const orbitalFacilities: Array<OrbitalFacilityModel> = [];

    if (isCivilized) {
        // finally, space station are placed
        const planetToScore = new Map<PlanetModel, number>();

        planets.forEach((planet) => {
            let score = 0;
            const nbMoons = satellites.filter((satellite) => satellite.orbit.parentIds.includes(planet.id)).length;
            score += nbMoons;
            score += planet.rings !== null ? 2 : 0;

            planetToScore.set(planet, score);
        });

        // sort planets by potential score
        const sortedPlanets = planets.toSorted((planetA, planetB) => {
            const scoreA = planetToScore.get(planetA) ?? 0;
            const scoreB = planetToScore.get(planetB) ?? 0;
            return scoreB - scoreA;
        });

        const nbStations = Math.min(planets.length, Math.max(1, systemRng(77) * Math.floor(planets.length / 2)));

        const planetsWithStations = sortedPlanets.slice(0, nbStations);

        planetsWithStations.forEach((planet) => {
            const spaceStationSeed =
                centeredRand(systemRng, GenerationSteps.SPACE_STATIONS + orbitalFacilities.length) *
                Settings.SEED_HALF_RANGE;

            if (
                uniformRandBool(0.5, systemRng, 657) && // 50% chance of having a space elevator
                planet.type === OrbitalObjectType.TELLURIC_PLANET && // space elevators can't be built on gas giants yet
                planet.rings === null // can't have rings because the tether would be at risk
            ) {
                const spaceElevatorModel = newSeededSpaceElevatorModel(
                    createOrbitalObjectId([planet.id], OrbitalObjectType.SPACE_ELEVATOR, 0),
                    spaceStationSeed,
                    coordinates,
                    position,
                    planet,
                );
                orbitalFacilities.push(spaceElevatorModel);
            } else {
                const spaceStationModel = newSeededSpaceStationModel(
                    createOrbitalObjectId([planet.id], OrbitalObjectType.SPACE_STATION, 0),
                    spaceStationSeed,
                    coordinates,
                    position,
                    [planet],
                );
                orbitalFacilities.push(spaceStationModel);
            }
        });
    }

    if (!isNonEmptyArray(stellarObjects)) {
        throw new Error("No stellar objects were generated for the star system");
    }

    return {
        name: systemName,
        coordinates,
        stellarObjects: stellarObjects,
        planets: planets,
        satellites: satellites,
        anomalies: anomalies,
        orbitalFacilities: orbitalFacilities,
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
    if (uniformRandBool(0.0006, rng, GenerationSteps.STARS + index)) return OrbitalObjectType.BLACK_HOLE;
    if (uniformRandBool(0.0026, rng, GenerationSteps.STARS + index)) return OrbitalObjectType.NEUTRON_STAR;

    return OrbitalObjectType.STAR;
}
