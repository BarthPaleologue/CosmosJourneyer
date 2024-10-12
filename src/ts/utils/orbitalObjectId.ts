import { OrbitalObject, OrbitalObjectModel } from "../architecture/orbitalObject";
import { StarSystemController } from "../starSystem/starSystemController";
import { StellarObject } from "../architecture/stellarObject";
import { SystemObjectId, UniverseObjectId, SystemObjectType } from "../saveFile/universeCoordinates";
import { Planet } from "../architecture/planet";
import { Anomaly } from "../anomalies/anomaly";
import { SpaceStation } from "../spacestation/spaceStation";
import { getSpaceStationModels } from "./getModelsFromSystemModel";
import { SpaceStationModel } from "../spacestation/spacestationModel";
import { getPlanetaryMassObjects } from "../starSystem/starSystemModel";
import { getSystemModelFromCoordinates } from "../starSystem/modelFromCoordinates";

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
        objectIndex: objectIndex
    };
}

/**
 * Get the universe object ID of the given orbital object within the star system.
 * @param orbitalObject An orbital object within the star system.
 * @param starSystem The star system controller.
 */
export function getUniverseObjectId(orbitalObject: OrbitalObject, starSystem: StarSystemController): UniverseObjectId {
    return {
        ...getSystemObjectId(orbitalObject, starSystem),
        starSystemCoordinates: starSystem.model.coordinates
    };
}

export function getObjectBySystemId(systemObjectId: SystemObjectId, starSystem: StarSystemController): OrbitalObject | null {
    let orbitalObject;
    switch (systemObjectId.objectType) {
        case SystemObjectType.STELLAR_OBJECT:
            orbitalObject = starSystem.stellarObjects.at(systemObjectId.objectIndex);
            break;
        case SystemObjectType.PLANETARY_MASS_OBJECT:
            orbitalObject = starSystem.planetaryMassObjects.at(systemObjectId.objectIndex);
            break;
        case SystemObjectType.ANOMALY:
            orbitalObject = starSystem.anomalies.at(systemObjectId.objectIndex);
            break;
        case SystemObjectType.SPACE_STATION:
            orbitalObject = starSystem.spaceStations.at(systemObjectId.objectIndex);
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
    const starSystemCoordinates = universeObjectId.starSystemCoordinates;
    const starSystemModel = getSystemModelFromCoordinates(starSystemCoordinates);

    switch (universeObjectId.objectType) {
        case SystemObjectType.STELLAR_OBJECT:
            return starSystemModel.stellarObjects[universeObjectId.objectIndex];
        case SystemObjectType.PLANETARY_MASS_OBJECT:
            return getPlanetaryMassObjects(starSystemModel.planetarySystems)[universeObjectId.objectIndex];
        case SystemObjectType.ANOMALY:
            return starSystemModel.anomalies[universeObjectId.objectIndex];
        case SystemObjectType.SPACE_STATION:
            return getSpaceStationModels(starSystemModel)[universeObjectId.objectIndex];
        default:
            throw new Error(`Unknown universe object type: ${universeObjectId.objectType}`);
    }
}

export function getUniverseIdForSpaceStationModel(spaceStationModel: SpaceStationModel): UniverseObjectId {
    const systemModel = getSystemModelFromCoordinates(spaceStationModel.starSystemCoordinates);

    const spaceStationModels = getSpaceStationModels(systemModel);
    const index = spaceStationModels.findIndex((model) => model.seed === spaceStationModel.seed);
    if (index === -1) {
        throw new Error("Space station model not found in star system");
    }

    return {
        objectType: SystemObjectType.SPACE_STATION,
        objectIndex: index,
        starSystemCoordinates: systemModel.coordinates
    };
}
