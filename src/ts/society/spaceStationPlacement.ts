import { BodyType } from "../architecture/bodyType";
import { TelluricPlanetModel } from "../planets/telluricPlanet/telluricPlanetModel";
import { GasPlanetModel } from "../planets/gasPlanet/gasPlanetModel";
import { StarModel } from "../stellarObjects/star/starModel";
import { BlackHoleModel } from "../stellarObjects/blackHole/blackHoleModel";
import { CelestialBodyModel } from "../architecture/celestialBody";
import { getMoonSeeds } from "../planets/common";
import { PlanetModel } from "../architecture/planet";
import { SeededStarSystemModel } from "../starSystem/seededStarSystemModel";

/**
 * Analyzes the given star system to return the indices of the orbital objects that are space stations.
 * @param systemModel
 */
export function placeSpaceStations(systemModel: SeededStarSystemModel): PlanetModel[] {
    const stellarObjectModels = systemModel.getStellarObjects().map(([bodyType, seed]) => {
        switch (bodyType) {
            case BodyType.STAR:
                return new StarModel(seed, systemModel);
            case BodyType.BLACK_HOLE:
                return new BlackHoleModel(seed, systemModel);
            default:
                throw new Error(`Incorrect body type in the stellar object list: ${bodyType}`);
        }
    });

    const mainStellarObjectModel = stellarObjectModels.at(0);
    if (mainStellarObjectModel === undefined) {
        throw new Error("The star system must have at least one stellar object.");
    }

    const planetModels = systemModel.getPlanets().map(([bodyType, seed]) => {
        switch (bodyType) {
            case BodyType.TELLURIC_PLANET:
                return new TelluricPlanetModel(seed, systemModel, mainStellarObjectModel);
            case BodyType.GAS_PLANET:
                return new GasPlanetModel(seed, systemModel, mainStellarObjectModel);
            default:
                throw new Error(`Incorrect body type in the planet list: ${bodyType}`);
        }
    });

    const planetToSatellites = new Map<CelestialBodyModel, TelluricPlanetModel[]>();

    planetModels.forEach((planetModel) => {
        const moonModels = getMoonSeeds(planetModel).map((moonSeed) => new TelluricPlanetModel(moonSeed, systemModel, planetModel));
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
    const sortedPlanets = planetModels.toSorted((planetA, planetB) => {
        const scoreA = planetToPotentialScore.get(planetA) ?? 0;
        const scoreB = planetToPotentialScore.get(planetB) ?? 0;
        return scoreB - scoreA;
    });

    const nbStations = Math.min(planetModels.length, Math.max(1, systemModel.rng(77) * Math.floor(planetModels.length / 2)));

    return sortedPlanets.slice(0, nbStations);
}
