//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { getStellarTypeFromTemperature } from "@cosmos-journeyer/physics";
import { starSystemCoordinatesEquals } from "@cosmos-journeyer/universe-model";

import type { Mission } from "../missions/mission";
import type { Spaceship } from "../spaceship/spaceship";
import type { SystemEntity } from "../systemEntity/systemEntity";
import type { Anomaly, OrbitalObject } from "../universe/architecture/orbitalObject";
import type { StarSystemController } from "../universe/starSystemController";
import type { SystemTarget } from "../universe/systemTarget";
import type { Vehicle } from "../vehicle/vehicle";
import { TargetType } from "./target";
import type { Target } from "./target";

export type SystemEntityTargetFactory = (entity: SystemEntity) => Array<Target>;

/**
 * Collects targetable bodies, entities, and system-defined targets.
 * @param starSystem System whose objects are converted into targets.
 * @param systemEntityTargetFactory Converts each system entity into its targets.
 * @returns All targets available in the current star system.
 */
export function getSystemTargets(
    starSystem: StarSystemController,
    systemEntityTargetFactory: SystemEntityTargetFactory,
): Array<Target> {
    const out: Array<Target> = [];

    const orbitalObjects = starSystem.getOrbitalObjects();
    const orbitalObjectTargets = orbitalObjects.flatMap((object) => createOrbitalObjectTarget(object));
    out.push(...orbitalObjectTargets);

    const systemEntities = starSystem.getSystemEntities();
    const systemEntityTargets = systemEntities.flatMap((entity) => systemEntityTargetFactory(entity));
    out.push(...systemEntityTargets);

    out.push(...starSystem.getSystemTargets().map(createSystemTarget));

    return out;
}

export function createOrbitalObjectTarget(orbitalObject: OrbitalObject): Target {
    switch (orbitalObject.type) {
        case "juliaSet":
        case "mandelbox":
        case "mandelbulb":
        case "mengerSponge":
        case "sierpinskiPyramid":
            return createAnomalyTarget(orbitalObject);
        case "star":
        case "neutronStar":
        case "blackHole":
        case "telluricPlanet":
        case "gasPlanet":
        case "telluricSatellite":
        case "custom":
            break;
    }
    const baseTarget = {
        getTransform: (): TransformNode => orbitalObject.getTransform(),
        getBoundingRadius: (): number => orbitalObject.getBoundingRadius(),
        properName: orbitalObject.model.name,
    };

    if (orbitalObject.model.type === TargetType.STAR) {
        return {
            ...baseTarget,
            type: TargetType.STAR,
            stellarType: getStellarTypeFromTemperature(orbitalObject.model.blackBodyTemperature),
        };
    }

    if (orbitalObject.model.type === TargetType.TELLURIC_SATELLITE) {
        return {
            ...baseTarget,
            type: TargetType.TELLURIC_SATELLITE,
            orbitSemiMajorAxis: orbitalObject.model.orbit.semiMajorAxis,
        };
    }

    return {
        ...baseTarget,
        type: orbitalObject.model.type,
    };
}

/**
 * Creates the target representation for a procedural anomaly.
 * @param anomaly Anomaly to represent.
 * @returns Target data backed by the anomaly's transform and bounds.
 */
function createAnomalyTarget(anomaly: Anomaly): Target {
    return {
        type: TargetType.ANOMALY,
        properName: anomaly.model.name,
        getTransform: () => anomaly.getTransform(),
        getBoundingRadius: () => anomaly.getBoundingRadius(),
    };
}

/**
 * Creates a target representation for a nearby star system.
 * @param systemTarget Star system to represent.
 * @returns Target data backed by the system's transform and bounds.
 */
export function createSystemTarget(systemTarget: SystemTarget): Target {
    return {
        type: TargetType.STAR_SYSTEM,
        properName: systemTarget.name,
        getTransform: () => systemTarget.getTransform(),
        getBoundingRadius: () => systemTarget.getBoundingRadius(),
    };
}

/**
 * Creates a target representation for a spaceship.
 * @param spaceship Spaceship to represent.
 * @returns Target data backed by the ship's transform and bounds.
 */
export function createSpaceshipTarget(spaceship: Spaceship): Target {
    return {
        type: TargetType.SPACESHIP,
        properName: spaceship.name,
        getTransform: () => spaceship.getTransform(),
        getBoundingRadius: () => spaceship.getBoundingRadius(),
    };
}

/**
 * Creates a target representation for a ground vehicle.
 * @param vehicle Vehicle to represent.
 * @returns Target data backed by the vehicle's transform and bounds.
 */
export function createVehicleTarget(vehicle: Vehicle): Target {
    return {
        type: TargetType.VEHICLE,
        properName: vehicle.name,
        getTransform: () => vehicle.getTransform(),
        getBoundingRadius: () => vehicle.getBoundingRadius(),
    };
}

export function getMissionKnownTargets(
    missions: ReadonlyArray<Pick<Mission, "getGuidanceTargetObjectIds">>,
    starSystem: Pick<StarSystemController, "getOrbitalObjectById"> & {
        readonly model: Pick<StarSystemController["model"], "coordinates">;
    },
): Array<Target> {
    const relevantObjectIds = missions
        .flatMap((mission) => mission.getGuidanceTargetObjectIds())
        .filter((objectId) => starSystemCoordinatesEquals(objectId.systemCoordinates, starSystem.model.coordinates));

    return relevantObjectIds
        .map((objectId) => starSystem.getOrbitalObjectById(objectId.idInSystem))
        .filter((object) => object !== undefined)
        .map((object) => createOrbitalObjectTarget(object));
}
