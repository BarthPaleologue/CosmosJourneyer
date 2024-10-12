import { CelestialBodyModel } from "../architecture/celestialBody";
import { PlanetModel } from "../architecture/planet";
import { SeededStarSystemModel } from "../starSystem/seededStarSystemModel";
import { getPlanets, StarSystemModel } from "../starSystem/starSystemModel";

/**
 * Analyzes the given star system to return the indices of the orbital objects that are space stations.
 * @param systemModel
 */
export function placeSpaceStations(systemModel: StarSystemModel): PlanetModel[] {
    if (!(systemModel instanceof SeededStarSystemModel)) {
        throw new Error("Only seeded star systems are supported for space station placement.");
    }

    const stellarObjectModels = systemModel.stellarObjects;

    const mainStellarObjectModel = stellarObjectModels.at(0);
    if (mainStellarObjectModel === undefined) {
        throw new Error("The star system must have at least one stellar object.");
    }

    const planetModels = getPlanets(systemModel);

    const planetToPotentialScore = new Map<CelestialBodyModel, number>();

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

    const nbStations = Math.min(planetModels.length, Math.max(1, systemModel.rng(77) * Math.floor(planetModels.length / 2)));

    return sortedPlanets.slice(0, nbStations);
}
