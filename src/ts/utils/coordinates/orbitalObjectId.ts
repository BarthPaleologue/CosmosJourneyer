import { OrbitalObject, OrbitalObjectModel } from "../../architecture/orbitalObject";
import { StarSystemController } from "../../starSystem/starSystemController";
import { StellarObject } from "../../architecture/stellarObject";
import { SystemObjectId, UniverseObjectId, SystemObjectType } from "./universeCoordinates";
import { PlanetaryMassObject } from "../../architecture/planetaryMassObject";
import { SpaceStation } from "../../spacestation/spaceStation";
import { StarSystemModelUtils } from "../../starSystem/starSystemModel";
import { CelestialBody } from "../../architecture/celestialBody";
import { OrbitalFacilityModel } from "../../spacestation/orbitalFacility";
import { StarSystemDatabase } from "../../starSystem/starSystemDatabase";

/**
 * Get the object ID of the given orbital object within the star system.
 * @param orbitalObject An orbital object within the star system.
 * @param starSystem The star system controller.
 */
export function getSystemObjectId(orbitalObject: OrbitalObject, starSystem: StarSystemController): SystemObjectId {
    let objectType: SystemObjectType;
    let objectIndex: number;
    if ((objectIndex = starSystem.getStellarObjects().indexOf(orbitalObject as StellarObject)) !== -1) {
        objectType = SystemObjectType.STELLAR_OBJECT;
    } else if (
        (objectIndex = starSystem.getPlanetaryMassObjects().indexOf(orbitalObject as PlanetaryMassObject)) !== -1
    ) {
        objectType = SystemObjectType.PLANETARY_MASS_OBJECT;
    } else if ((objectIndex = starSystem.getAnomalies().indexOf(orbitalObject as CelestialBody)) !== -1) {
        objectType = SystemObjectType.ANOMALY;
    } else if ((objectIndex = starSystem.getOrbitalFacilities().indexOf(orbitalObject as SpaceStation)) !== -1) {
        objectType = SystemObjectType.ORBITAL_FACILITY;
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

export function getObjectBySystemId(
    systemObjectId: SystemObjectId,
    starSystem: StarSystemController
): OrbitalObject | null {
    let orbitalObject;
    switch (systemObjectId.objectType) {
        case SystemObjectType.STELLAR_OBJECT:
            orbitalObject = starSystem.getStellarObjects().at(systemObjectId.objectIndex);
            break;
        case SystemObjectType.PLANETARY_MASS_OBJECT:
            orbitalObject = starSystem.getPlanetaryMassObjects().at(systemObjectId.objectIndex);
            break;
        case SystemObjectType.ANOMALY:
            orbitalObject = starSystem.getAnomalies().at(systemObjectId.objectIndex);
            break;
        case SystemObjectType.ORBITAL_FACILITY:
            orbitalObject = starSystem.getOrbitalFacilities().at(systemObjectId.objectIndex);
            break;
        default:
            throw new Error(`Unknown universe object type: ${systemObjectId.objectType}`);
    }
    if (orbitalObject === undefined) {
        return null;
    }

    return orbitalObject;
}

export function getObjectModelByUniverseId(
    universeObjectId: UniverseObjectId,
    starSystemDatabase: StarSystemDatabase
): OrbitalObjectModel | null {
    const starSystemCoordinates = universeObjectId.starSystemCoordinates;
    const starSystemModel = starSystemDatabase.getSystemModelFromCoordinates(starSystemCoordinates);
    if (starSystemModel === null) {
        return null;
    }

    switch (universeObjectId.objectType) {
        case SystemObjectType.STELLAR_OBJECT:
            return StarSystemModelUtils.GetStellarObjects(starSystemModel)[universeObjectId.objectIndex];
        case SystemObjectType.PLANETARY_MASS_OBJECT:
            return StarSystemModelUtils.GetPlanetaryMassObjects(starSystemModel)[universeObjectId.objectIndex];
        case SystemObjectType.ANOMALY:
            return StarSystemModelUtils.GetAnomalies(starSystemModel)[universeObjectId.objectIndex];
        case SystemObjectType.ORBITAL_FACILITY:
            return StarSystemModelUtils.GetSpaceStations(starSystemModel)[universeObjectId.objectIndex];
        default:
            throw new Error(`Unknown universe object type: ${universeObjectId.objectType}`);
    }
}

export function getUniverseIdForSpaceStationModel(
    spaceStationModel: OrbitalFacilityModel,
    starSystemDatabase: StarSystemDatabase
): UniverseObjectId {
    const systemModel = starSystemDatabase.getSystemModelFromCoordinates(spaceStationModel.starSystemCoordinates);
    if (systemModel === null) {
        throw new Error("Star system model not found in database");
    }

    const spaceStationModels = StarSystemModelUtils.GetSpaceStations(systemModel);
    const index = spaceStationModels.findIndex((model) => model.seed === spaceStationModel.seed);
    if (index === -1) {
        throw new Error("Space station model not found in star system");
    }

    return {
        objectType: SystemObjectType.ORBITAL_FACILITY,
        objectIndex: index,
        starSystemCoordinates: systemModel.coordinates
    };
}
