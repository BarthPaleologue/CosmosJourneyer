import { placeSpaceStations } from "../society/spaceStationPlacement";
import { SpaceStationModel } from "../spacestation/spacestationModel";
import { getMoonSeeds, getSpaceStationSeed } from "../planets/common";
import { SeededStarSystemModel } from "../starSystem/seededStarSystemModel";
import { StarModel } from "../stellarObjects/star/starModel";
import { BlackHoleModel } from "../stellarObjects/blackHole/blackHoleModel";
import { BodyType } from "../architecture/bodyType";
import { NeutronStarModel } from "../stellarObjects/neutronStar/neutronStarModel";
import { StellarObjectModel } from "../architecture/stellarObject";
import { AnomalyType } from "../anomalies/anomalyType";
import { MandelbulbModel } from "../anomalies/mandelbulb/mandelbulbModel";
import { JuliaSetModel } from "../anomalies/julia/juliaSetModel";
import { PlanetModel } from "../architecture/planet";
import { TelluricPlanetModel } from "../planets/telluricPlanet/telluricPlanetModel";
import { GasPlanetModel } from "../planets/gasPlanet/gasPlanetModel";

export function getSpaceStationModels(system: SeededStarSystemModel): SpaceStationModel[] {
    const spaceStationParents = placeSpaceStations(system);
    return spaceStationParents.map((planet) => {
        return new SpaceStationModel(getSpaceStationSeed(planet, 0), system, planet);
    });
}

export function getStellarObjectModels(system: SeededStarSystemModel): StellarObjectModel[] {
    const stellarObjectSeedAndTypes = system.getStellarObjects();
    const stellarObjectModels: StellarObjectModel[] = [];
    for (let i = 0; i < stellarObjectSeedAndTypes.length; i++) {
        const [bodyType, seed] = stellarObjectSeedAndTypes[i];
        const parentBodyModel = i === 0 ? null : stellarObjectModels[0];
        switch (bodyType) {
            case BodyType.STAR:
                stellarObjectModels.push(new StarModel(seed, system, parentBodyModel));
                break;
            case BodyType.BLACK_HOLE:
                stellarObjectModels.push(new BlackHoleModel(seed, system, parentBodyModel));
                break;
            case BodyType.NEUTRON_STAR:
                stellarObjectModels.push(new NeutronStarModel(seed, system, parentBodyModel));
                break;
            default:
                throw new Error(`Incorrect body type in the stellar object list: ${bodyType}`);
        }
    }

    return stellarObjectModels;
}

export function getAnomalyModels(system: SeededStarSystemModel): (MandelbulbModel | JuliaSetModel)[] {
    const anomalySeedAndTypes = system.getAnomalies();
    const anomalyModels: (MandelbulbModel | JuliaSetModel)[] = [];
    const parentBodyModel = getStellarObjectModels(system)[0];
    for (let i = 0; i < anomalySeedAndTypes.length; i++) {
        const [anomalyType, seed] = anomalySeedAndTypes[i];
        switch (anomalyType) {
            case AnomalyType.MANDELBULB:
                anomalyModels.push(new MandelbulbModel(seed, system, parentBodyModel));
                break;
            case AnomalyType.JULIA_SET:
                anomalyModels.push(new JuliaSetModel(seed, system, parentBodyModel));
                break;
            default:
                throw new Error(`Incorrect body type in the anomaly list: ${anomalyType}`);
        }
    }

    return anomalyModels;
}

export function getPlanetaryMassObjectModels(system: SeededStarSystemModel): PlanetModel[] {
    const planetSeedAndTypes = system.getPlanets();
    const planetModels: PlanetModel[] = [];
    const parentBodyModel = getStellarObjectModels(system)[0];
    for (let i = 0; i < planetSeedAndTypes.length; i++) {
        const [bodyType, seed] = planetSeedAndTypes[i];
        if (bodyType === BodyType.TELLURIC_PLANET) {
            const telluricPlanetModel = new TelluricPlanetModel(seed, system, parentBodyModel);
            planetModels.push(telluricPlanetModel);

            getMoonSeeds(telluricPlanetModel).forEach((moonSeed) => {
                planetModels.push(new TelluricPlanetModel(moonSeed, system, telluricPlanetModel));
            });
        } else if (bodyType === BodyType.GAS_PLANET) {
            const gasPlanetModel = new GasPlanetModel(seed, system, parentBodyModel);
            planetModels.push(gasPlanetModel);

            getMoonSeeds(gasPlanetModel).forEach((moonSeed) => {
                planetModels.push(new TelluricPlanetModel(moonSeed, system, gasPlanetModel));
            });
        }
    }

    return planetModels;
}