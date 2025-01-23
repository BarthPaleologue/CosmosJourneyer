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
import { generateStarName } from "../utils/strings/starNameGenerator";
import { wheelOfFortune } from "../utils/random";
import { PlanetarySystemModel, StarSystemModel } from "./starSystemModel";
import { StellarObjectModel } from "../architecture/stellarObject";
import { AnomalyModel } from "../anomalies/anomaly";
import { Alphabet, ReversedGreekAlphabet } from "../utils/strings/parseToStrings";
import { newSeededStarModel } from "../stellarObjects/star/starModel";
import { newSeededBlackHoleModel } from "../stellarObjects/blackHole/blackHoleModel";
import { newSeededNeutronStarModel } from "../stellarObjects/neutronStar/neutronStarModel";
import { newSeededGasPlanetModel } from "../planets/gasPlanet/gasPlanetModel";
import { newSeededMandelbulbModel } from "../anomalies/mandelbulb/mandelbulbModel";
import { newSeededJuliaSetModel } from "../anomalies/julia/juliaSetModel";
import { getRngFromSeed } from "../utils/getRngFromSeed";
import { romanNumeral } from "../utils/strings/romanNumerals";
import { newSeededSpaceStationModel } from "../spacestation/spacestationModel";
import { OrbitalObjectType } from "../architecture/orbitalObject";
import { newSeededTelluricSatelliteModel } from "../planets/telluricPlanet/telluricSatelliteModel";
import { newSeededTelluricPlanetModel } from "../planets/telluricPlanet/telluricPlanetModel";
import { newSeededSpaceElevatorModel } from "../spacestation/spaceElevatorModel";
import { StarSystemCoordinates } from "../utils/coordinates/universeCoordinates";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { newSeededMandelboxModel } from "../anomalies/mandelbox/mandelboxModel";
import { newSeededSierpinskiPyramidModel } from "../anomalies/sierpinskiPyramid/sierpinskiPyramidModel";

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
    SPACE_STATIONS = 2000
}

/**
 * Generates a new star system data model given a seed using a pseudo-random number generator.
 * @param seed The seed of the star system.
 * @returns The data model of the generated star system.
 */
export function newSeededStarSystemModel(
    systemRng: (step: number) => number,
    coordinates: StarSystemCoordinates,
    position: Vector3,
    isCivilized: boolean
): StarSystemModel {
    const systemName = generateStarName(systemRng, GenerationSteps.NAME);

    // generate stellar objects of the system first (we can assume the other objects don't have a significant influence on the stellar objects)
    const stellarObjects: StellarObjectModel[] = [];
    const nbStellarObjects = 1;
    for (let i = 0; i < nbStellarObjects; i++) {
        const stellarObjectType = getBodyTypeOfStellarObject(systemRng, i);
        const seed = centeredRand(systemRng, GenerationSteps.STARS + i) * Settings.SEED_HALF_RANGE;
        const stellarObjectName = `${systemName} ${Alphabet[i].toUpperCase()}`;
        switch (stellarObjectType) {
            case OrbitalObjectType.STAR:
                stellarObjects.push(newSeededStarModel(seed, stellarObjectName, []));
                break;
            case OrbitalObjectType.BLACK_HOLE:
                stellarObjects.push(newSeededBlackHoleModel(seed, stellarObjectName, []));
                break;
            case OrbitalObjectType.NEUTRON_STAR:
                stellarObjects.push(newSeededNeutronStarModel(seed, stellarObjectName, []));
                break;
            default:
                throw new Error("Unknown stellar object type");
        }
    }

    // Afterward planets are generated. We can assume they only depend on the stellar objects.
    const planetarySystems: PlanetarySystemModel[] = [];
    //Fixme: planets need to work with black holes as well at some point
    const nbPlanets =
        stellarObjects[0].type === OrbitalObjectType.BLACK_HOLE
            ? 0
            : randRangeInt(0, 7, systemRng, GenerationSteps.NB_PLANETS);
    for (let i = 0; i < nbPlanets; i++) {
        const bodyType = uniformRandBool(0.5, systemRng, GenerationSteps.PLANET_TYPE + i)
            ? OrbitalObjectType.TELLURIC_PLANET
            : OrbitalObjectType.GAS_PLANET;
        const planetName = `${systemName} ${romanNumeral(i + 1)}`;

        const seed = centeredRand(systemRng, GenerationSteps.PLANETS + i) * Settings.SEED_HALF_RANGE;

        switch (bodyType) {
            case OrbitalObjectType.TELLURIC_PLANET:
                planetarySystems.push({
                    planets: [newSeededTelluricPlanetModel(seed, planetName, stellarObjects)],
                    satellites: [],
                    orbitalFacilities: []
                });
                break;
            case OrbitalObjectType.GAS_PLANET:
                planetarySystems.push({
                    planets: [newSeededGasPlanetModel(seed, planetName, stellarObjects)],
                    satellites: [],
                    orbitalFacilities: []
                });
                break;
            default:
                throw new Error("Unknown planet type");
        }
    }

    // For each planet, generate satellites
    planetarySystems.forEach(({ planets, satellites }) => {
        let nbMoons = 0;
        planets.forEach((planet) => {
            const planetRng = getRngFromSeed(planet.seed);
            nbMoons +=
                planet.type === OrbitalObjectType.GAS_PLANET
                    ? randRangeInt(0, 3, planetRng, GenerationSteps.NB_MOONS)
                    : randRangeInt(0, 2, planetRng, GenerationSteps.NB_MOONS);
        });
        const seedSum = planets.reduce((acc, planet) => acc + planet.seed, 0);
        const planetarySystemName = planets.map((planet) => planet.name).join("-");
        const planetarySystemRng = getRngFromSeed(seedSum);
        for (let j = 0; j < nbMoons; j++) {
            const satelliteName = `${planetarySystemName}${Alphabet[j]}`;
            const satelliteSeed =
                centeredRand(planetarySystemRng, GenerationSteps.MOONS + j) * Settings.SEED_HALF_RANGE;
            const satelliteModel = newSeededTelluricSatelliteModel(satelliteSeed, satelliteName, planets);
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
        systemRng(GenerationSteps.ANOMALIES)
    );
    for (let i = 0; i < nbAnomalies; i++) {
        const anomalySeed = centeredRand(systemRng, GenerationSteps.ANOMALIES + i * 100) * Settings.SEED_HALF_RANGE;
        const anomalyType:
            | OrbitalObjectType.MANDELBULB
            | OrbitalObjectType.JULIA_SET
            | OrbitalObjectType.MANDELBOX
            | OrbitalObjectType.SIERPINSKI_PYRAMID = wheelOfFortune(
            [
                [OrbitalObjectType.MANDELBULB, 1],
                [OrbitalObjectType.MANDELBOX, 1],
                [OrbitalObjectType.JULIA_SET, 1],
                [OrbitalObjectType.SIERPINSKI_PYRAMID, 1]
            ],
            systemRng(GenerationSteps.ANOMALIES + i * 300)
        );
        const anomalyName = `${systemName} ${ReversedGreekAlphabet[i].toUpperCase()}`;

        switch (anomalyType) {
            case OrbitalObjectType.MANDELBULB:
                anomalies.push(newSeededMandelbulbModel(anomalySeed, anomalyName, stellarObjects));
                break;
            case OrbitalObjectType.JULIA_SET:
                anomalies.push(newSeededJuliaSetModel(anomalySeed, anomalyName, stellarObjects));
                break;
            case OrbitalObjectType.MANDELBOX:
                anomalies.push(newSeededMandelboxModel(anomalySeed, anomalyName, stellarObjects));
                break;
            case OrbitalObjectType.SIERPINSKI_PYRAMID:
                anomalies.push(newSeededSierpinskiPyramidModel(anomalySeed, anomalyName, stellarObjects));
                break;
        }
    }

    if (isCivilized) {
        // finally, space station are placed
        const planetarySystemToScore = new Map<PlanetarySystemModel, number>();

        planetarySystems.forEach((planetarySystem) => {
            let score = 0;
            const nbMoons = planetarySystem.satellites.length;
            score += nbMoons;

            const hasRings = planetarySystem.planets.some((planetModel) => planetModel.rings !== null);
            score += hasRings ? 2 : 0;

            planetarySystemToScore.set(planetarySystem, score);
        });

        // sort planets by potential score
        const sortedPlanetarySystems = Array.from(planetarySystems);
        sortedPlanetarySystems.sort((planetA, planetB) => {
            const scoreA = planetarySystemToScore.get(planetA) ?? 0;
            const scoreB = planetarySystemToScore.get(planetB) ?? 0;
            return scoreB - scoreA;
        });

        const nbStations = Math.min(
            planetarySystems.length,
            Math.max(1, systemRng(77) * Math.floor(planetarySystems.length / 2))
        );

        const planetarySystemsWithStations = sortedPlanetarySystems.slice(0, nbStations);

        planetarySystemsWithStations.forEach((planetarySystem) => {
            const spaceStationSeed =
                centeredRand(systemRng, GenerationSteps.SPACE_STATIONS + planetarySystem.planets.length) *
                Settings.SEED_HALF_RANGE;

            if (
                uniformRandBool(0.5, systemRng, 657) && // 50% chance of having a space elevator
                planetarySystem.planets.length === 1 && // I don't want to imagine the complexity of a space elevator in a close binary system
                planetarySystem.planets[0].type === OrbitalObjectType.TELLURIC_PLANET && // space elevators can't be built on gas giants yet
                planetarySystem.planets[0].rings === null // can't have rings because the tether would be at risk
            ) {
                const spaceElevatorModel = newSeededSpaceElevatorModel(
                    spaceStationSeed,
                    stellarObjects,
                    coordinates,
                    position,
                    planetarySystem.planets[0]
                );
                planetarySystem.orbitalFacilities.push(spaceElevatorModel);
            } else {
                const spaceStationModel = newSeededSpaceStationModel(
                    spaceStationSeed,
                    stellarObjects,
                    coordinates,
                    position,
                    planetarySystem.planets
                );
                planetarySystem.orbitalFacilities.push(spaceStationModel);
            }
        });
    }

    return {
        name: systemName,
        coordinates,
        subSystems: [
            {
                stellarObjects,
                planetarySystems,
                anomalies,
                orbitalFacilities: []
            }
        ]
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
