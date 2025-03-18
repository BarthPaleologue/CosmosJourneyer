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

import { OrbitalObject } from "../../architecture/orbitalObject";
import { StarSystemController } from "../../starSystem/starSystemController";
import { SystemObjectId, SystemObjectType } from "./universeCoordinates";
import { UniverseObjectId } from "./universeObjectId";
import { SpaceStation } from "../../spacestation/spaceStation";
import { StarSystemModelUtils } from "../../starSystem/starSystemModel";
import { StarSystemDatabase } from "../../starSystem/starSystemDatabase";
import { OrbitalFacilityModel, OrbitalObjectModel } from "../../architecture/orbitalObjectModel";
import { OrbitalObjectType } from "../../architecture/orbitalObjectType";
import { DeepReadonly } from "../types";

/**
 * Get the object ID of the given orbital object within the star system.
 * @param orbitalObject An orbital object within the star system.
 * @param starSystem The star system controller.
 */
export function getSystemObjectId(orbitalObject: OrbitalObject, starSystem: StarSystemController): SystemObjectId {
    let objectType: SystemObjectType;
    let objectIndex: number;

    switch (orbitalObject.type) {
        case OrbitalObjectType.STAR:
        case OrbitalObjectType.NEUTRON_STAR:
        case OrbitalObjectType.BLACK_HOLE:
            objectIndex = starSystem.getStellarObjects().indexOf(orbitalObject);
            objectType = SystemObjectType.STELLAR_OBJECT;
            break;
        case OrbitalObjectType.TELLURIC_PLANET:
        case OrbitalObjectType.TELLURIC_SATELLITE:
        case OrbitalObjectType.GAS_PLANET:
            objectIndex = starSystem.getPlanetaryMassObjects().indexOf(orbitalObject);
            objectType = SystemObjectType.PLANETARY_MASS_OBJECT;
            break;
        case OrbitalObjectType.MANDELBULB:
        case OrbitalObjectType.JULIA_SET:
        case OrbitalObjectType.MANDELBOX:
        case OrbitalObjectType.SIERPINSKI_PYRAMID:
        case OrbitalObjectType.MENGER_SPONGE:
            objectIndex = starSystem.getAnomalies().indexOf(orbitalObject);
            objectType = SystemObjectType.ANOMALY;
            break;
        case OrbitalObjectType.SPACE_STATION:
        case OrbitalObjectType.SPACE_ELEVATOR:
            objectIndex = starSystem.getOrbitalFacilities().indexOf(orbitalObject as SpaceStation);
            objectType = SystemObjectType.ORBITAL_FACILITY;
            break;
        case OrbitalObjectType.CUSTOM:
            throw new Error("Custom orbital objects are not supported");
    }

    if (objectIndex === -1) {
        throw new Error("Orbital object not found in star system");
    }

    return {
        objectType,
        objectIndex
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
): DeepReadonly<OrbitalObjectModel> | null {
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
    spaceStationModel: DeepReadonly<OrbitalFacilityModel>,
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
