import { OrbitalObject, OrbitalObjectModel } from "../architecture/orbitalObject";
import { StarSystemController } from "../starSystem/starSystemController";
import { StellarObject } from "../architecture/stellarObject";
import { SystemObjectId, UniverseObjectId, SystemObjectType } from "../saveFile/universeCoordinates";
import { Planet } from "../architecture/planet";
import { Anomaly } from "../anomalies/anomaly";
import { SpaceStation } from "../spacestation/spaceStation";
import { SeededStarSystemModel } from "../starSystem/seededStarSystemModel";
import { SystemSeed } from "./systemSeed";
import { getAnomalyModels, getPlanetaryMassObjectModels, getSpaceStationModels, getStellarObjectModels } from "./getModelsFromSystemModel";
import { StarSystemModel } from "../starSystem/starSystemModel";
import { SpaceStationModel } from "../spacestation/spacestationModel";

/**
 * Get the object ID of the given orbital object within the star system.
 * @param orbitalObject An orbital object within the star system.
 * @param starSystem The star system controller.
 */
export function getSystemObjectId(orbitalObject: OrbitalObject, starSystem: StarSystemController): SystemObjectId {
    let objectType: SystemObjectType;
    let objectIndex: number;
    if ((objectIndex = starSystem.stellarObjects.indexOf(orbitalObject as StellarObject)) !== -1) {
        objectType = SystemObjectType.STELLAR_OBJECT;
    } else if ((objectIndex = starSystem.planetaryMassObjects.indexOf(orbitalObject as Planet)) !== -1) {
        objectType = SystemObjectType.PLANETARY_MASS_OBJECT;
    } else if ((objectIndex = starSystem.anomalies.indexOf(orbitalObject as Anomaly)) !== -1) {
        objectType = SystemObjectType.ANOMALY;
    } else if ((objectIndex = starSystem.spaceStations.indexOf(orbitalObject as SpaceStation)) !== -1) {
        objectType = SystemObjectType.SPACE_STATION;
    } else throw new Error("Nearest orbital object not found among any of the universal orbital object types");

    return {
        objectType,
        index: objectIndex
    };
}

/**
 * Get the universe object ID of the given orbital object within the star system.
 * @param orbitalObject An orbital object within the star system.
 * @param starSystem The star system controller.
 */
export function getUniverseObjectId(orbitalObject: OrbitalObject, starSystem: StarSystemController): UniverseObjectId {
    if (!(starSystem.model instanceof SeededStarSystemModel)) {
        throw new Error("Star system is not a seeded star system model");
    }

    return {
        ...getSystemObjectId(orbitalObject, starSystem),
        starSystem: starSystem.model.seed.serialize()
    };
}

export function getObjectBySystemId(systemObjectId: SystemObjectId, starSystem: StarSystemController): OrbitalObject | null {
    let orbitalObject;
    switch (systemObjectId.objectType) {
        case SystemObjectType.STELLAR_OBJECT:
            orbitalObject = starSystem.stellarObjects.at(systemObjectId.index);
            break;
        case SystemObjectType.PLANETARY_MASS_OBJECT:
            orbitalObject = starSystem.planetaryMassObjects.at(systemObjectId.index);
            break;
        case SystemObjectType.ANOMALY:
            orbitalObject = starSystem.anomalies.at(systemObjectId.index);
            break;
        case SystemObjectType.SPACE_STATION:
            orbitalObject = starSystem.spaceStations.at(systemObjectId.index);
            break;
        default:
            throw new Error(`Unknown universe object type: ${systemObjectId.objectType}`);
    }
    if (orbitalObject === undefined) {
        return null;
    }

    return orbitalObject;
}

export function getObjectModelByUniverseId(universeObjectId: UniverseObjectId): OrbitalObjectModel {
    const starSystemSeed = SystemSeed.Deserialize(universeObjectId.starSystem);
    const seededStarSystemModel = new SeededStarSystemModel(starSystemSeed);

    switch (universeObjectId.objectType) {
        case SystemObjectType.STELLAR_OBJECT:
            return getStellarObjectModels(seededStarSystemModel)[universeObjectId.index];
        case SystemObjectType.PLANETARY_MASS_OBJECT:
            return getPlanetaryMassObjectModels(seededStarSystemModel)[universeObjectId.index];
        case SystemObjectType.ANOMALY:
            return getAnomalyModels(seededStarSystemModel)[universeObjectId.index];
        case SystemObjectType.SPACE_STATION:
            return getSpaceStationModels(seededStarSystemModel)[universeObjectId.index];
        default:
            throw new Error(`Unknown universe object type: ${universeObjectId.objectType}`);
    }
}

export function getUniverseIdForSpaceStationModel(spaceStationModel: SpaceStationModel): UniverseObjectId {
    const systemModel = spaceStationModel.starSystem;
    if (!(systemModel instanceof SeededStarSystemModel)) {
        throw new Error("Cannot handle non-seeded star system models yet");
    }

    const spaceStationModels = getSpaceStationModels(systemModel);
    const index = spaceStationModels.findIndex((model) => model.seed === spaceStationModel.seed);
    if (index === -1) {
        throw new Error("Space station model not found in star system");
    }

    return {
        objectType: SystemObjectType.SPACE_STATION,
        index,
        starSystem: systemModel.seed.serialize()
    };
}
