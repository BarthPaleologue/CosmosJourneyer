import { newSeededTelluricPlanetModel, TelluricPlanetModel } from "../planets/telluricPlanet/telluricPlanetModel";
import { newSeededGasPlanetModel } from "../planets/gasPlanet/gasPlanetModel";
import { newSeededStarModel } from "../stellarObjects/star/starModel";
import { newSeededBlackHoleModel } from "../stellarObjects/blackHole/blackHoleModel";
import { CelestialBodyModel, CelestialBodyType } from "../architecture/celestialBody";
import { getMoonSeeds, getPlanetName } from "../planets/common";
import { PlanetModel } from "../architecture/planet";
import { SeededStarSystemModel } from "../starSystem/seededStarSystemModel";
import { newSeededNeutronStarModel } from "../stellarObjects/neutronStar/neutronStarModel";
import { StarSystemModel } from "../starSystem/starSystemModel";
import { getStellarObjectName } from "../utils/parseToStrings";

/**
 * Analyzes the given star system to return the indices of the orbital objects that are space stations.
 * @param systemModel
 */
export function placeSpaceStations(systemModel: StarSystemModel): PlanetModel[] {
    if (!(systemModel instanceof SeededStarSystemModel)) {
        throw new Error("Only seeded star systems are supported for space station placement.");
    }

    const stellarObjectModels = systemModel.getStellarObjects().map(([bodyType, seed], index) => {
        const stellarObjectName = getStellarObjectName(systemModel.name, index);
        switch (bodyType) {
            case CelestialBodyType.STAR:
                return newSeededStarModel(seed, stellarObjectName, null);
            case CelestialBodyType.BLACK_HOLE:
                return newSeededBlackHoleModel(seed, systemModel, null);
            case CelestialBodyType.NEUTRON_STAR:
                return newSeededNeutronStarModel(seed, systemModel, null);
            default:
                throw new Error(`Incorrect body type in the stellar object list: ${bodyType}`);
        }
    });

    const mainStellarObjectModel = stellarObjectModels.at(0);
    if (mainStellarObjectModel === undefined) {
        throw new Error("The star system must have at least one stellar object.");
    }

    const planetModels = systemModel.getPlanets().map(([bodyType, seed], index) => {
        const planetName = getPlanetName(index, systemModel.name, mainStellarObjectModel);
        switch (bodyType) {
            case CelestialBodyType.TELLURIC_PLANET:
                return newSeededTelluricPlanetModel(seed, planetName, mainStellarObjectModel);
            case CelestialBodyType.GAS_PLANET:
                return newSeededGasPlanetModel(seed, planetName, mainStellarObjectModel);
            default:
                throw new Error(`Incorrect body type in the planet list: ${bodyType}`);
        }
    });

    const planetToSatellites = new Map<CelestialBodyModel, TelluricPlanetModel[]>();

    planetModels.forEach((planetModel) => {
        const moonModels = getMoonSeeds(planetModel).map((moonSeed, index) =>
            newSeededTelluricPlanetModel(moonSeed, getPlanetName(index, systemModel.name, planetModel), planetModel)
        );
        planetToSatellites.set(planetModel, moonModels);
    });

    const planetToPotentialScore = new Map<CelestialBodyModel, number>();

    planetModels.forEach((planetModel) => {
        let score = 0;
        const nbMoons = planetToSatellites.get(planetModel)?.length ?? 0;
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

    const nbStations = Math.min(planetModels.length, Math.max(1, systemModel.rng(77) * Math.floor(planetModels.length / 2)));

    return sortedPlanets.slice(0, nbStations);
}
