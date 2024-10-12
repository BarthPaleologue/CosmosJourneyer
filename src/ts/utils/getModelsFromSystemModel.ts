import { placeSpaceStations } from "../society/spaceStationPlacement";
import { newSeededSpaceStationModel, SpaceStationModel } from "../spacestation/spacestationModel";
import { getMoonSeeds, getPlanetName, getSpaceStationSeed } from "../planets/common";
import { newSeededStarModel } from "../stellarObjects/star/starModel";
import { newSeededBlackHoleModel } from "../stellarObjects/blackHole/blackHoleModel";
import { StellarObjectModel } from "../architecture/stellarObject";
import { AnomalyType } from "../anomalies/anomalyType";
import { MandelbulbModel, newSeededMandelbulbModel } from "../anomalies/mandelbulb/mandelbulbModel";
import { JuliaSetModel, newSeededJuliaSetModel } from "../anomalies/julia/juliaSetModel";
import { PlanetModel } from "../architecture/planet";
import { newSeededTelluricPlanetModel, TelluricPlanetModel } from "../planets/telluricPlanet/telluricPlanetModel";
import { GasPlanetModel, newSeededGasPlanetModel } from "../planets/gasPlanet/gasPlanetModel";
import { StarSystemModel } from "../starSystem/starSystemModel";
import { CelestialBodyType } from "../architecture/celestialBody";
import { newSeededNeutronStarModel } from "../stellarObjects/neutronStar/neutronStarModel";

export function getSpaceStationModels(system: StarSystemModel): SpaceStationModel[] {
    const spaceStationParents = placeSpaceStations(system);
    return spaceStationParents.map((planet) => {
        return newSeededSpaceStationModel(getSpaceStationSeed(planet, 0), system, planet);
    });
}

export function getStellarObjectModels(system: StarSystemModel): StellarObjectModel[] {
    const stellarObjectSeedAndTypes = system.getStellarObjects();
    const stellarObjectModels: StellarObjectModel[] = [];
    for (let i = 0; i < stellarObjectSeedAndTypes.length; i++) {
        const [bodyType, seed] = stellarObjectSeedAndTypes[i];
        const parentBodyModel = i === 0 ? null : stellarObjectModels[0];
        switch (bodyType) {
            case CelestialBodyType.STAR:
                stellarObjectModels.push(newSeededStarModel(seed, system, parentBodyModel));
                break;
            case CelestialBodyType.BLACK_HOLE:
                stellarObjectModels.push(newSeededBlackHoleModel(seed, system, parentBodyModel));
                break;
            case CelestialBodyType.NEUTRON_STAR:
                stellarObjectModels.push(newSeededNeutronStarModel(seed, system, parentBodyModel));
                break;
            default:
                throw new Error(`Incorrect body type in the stellar object list: ${bodyType}`);
        }
    }

    return stellarObjectModels;
}

export function getAnomalyModels(system: StarSystemModel): (MandelbulbModel | JuliaSetModel)[] {
    const anomalySeedAndTypes = system.getAnomalies();
    const anomalyModels: (MandelbulbModel | JuliaSetModel)[] = [];
    const parentBodyModel = getStellarObjectModels(system)[0];
    for (let i = 0; i < anomalySeedAndTypes.length; i++) {
        const [anomalyType, seed] = anomalySeedAndTypes[i];
        switch (anomalyType) {
            case AnomalyType.MANDELBULB:
                anomalyModels.push(newSeededMandelbulbModel(seed, system, parentBodyModel));
                break;
            case AnomalyType.JULIA_SET:
                anomalyModels.push(newSeededJuliaSetModel(seed, system, parentBodyModel));
                break;
            default:
                throw new Error(`Incorrect body type in the anomaly list: ${anomalyType}`);
        }
    }

    return anomalyModels;
}

export function getPlanetaryMassObjectModels(system: StarSystemModel): PlanetModel[] {
    const planetSeedAndTypes = system.getPlanets();
    const planetModels: PlanetModel[] = [];
    const parentBodyModel = getStellarObjectModels(system)[0];
    for (let i = 0; i < planetSeedAndTypes.length; i++) {
        const [bodyType, seed] = planetSeedAndTypes[i];
        const planetName = getPlanetName(i, system.name, parentBodyModel);
        if (bodyType === CelestialBodyType.TELLURIC_PLANET) {
            const telluricPlanetModel: TelluricPlanetModel = newSeededTelluricPlanetModel(seed, planetName, parentBodyModel);
            planetModels.push(telluricPlanetModel);

            getMoonSeeds(telluricPlanetModel).forEach((moonSeed) => {
                planetModels.push(newSeededTelluricPlanetModel(moonSeed, planetName, telluricPlanetModel));
            });
        } else if (bodyType === CelestialBodyType.GAS_PLANET) {
            const gasPlanetModel: GasPlanetModel = newSeededGasPlanetModel(seed, planetName, parentBodyModel);
            planetModels.push(gasPlanetModel);

            getMoonSeeds(gasPlanetModel).forEach((moonSeed) => {
                planetModels.push(newSeededTelluricPlanetModel(moonSeed, planetName, gasPlanetModel));
            });
        }
    }

    return planetModels;
}
