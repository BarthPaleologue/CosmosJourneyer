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

import type { SpaceElevatorClimber } from "../../presentation/assets/procedural/spaceStation/climber/spaceElevatorClimber";
import type { LandingBay } from "../../presentation/assets/procedural/spaceStation/landingBay/landingBay";
import type { Anomaly, OrbitalFacility, OrbitalObject } from "../../simulation/architecture/orbitalObject";
import type { ILandingPad } from "../../simulation/orbitalFacility/landingPadManager";
import type { StarSystemController } from "../../simulation/starSystemController";
import type { SystemTarget } from "../../simulation/systemTarget";
import type { Mission } from "../missions/mission";
import type { Spaceship } from "../spaceship/spaceship";
import type { Vehicle } from "../vehicle/vehicle";
import { TargetType } from "./target";
import type { PadTarget, Target } from "./target";

export function getSystemTargets(starSystem: StarSystemController): Array<Target> {
    const out: Array<Target> = [];

    const orbitalObjects = starSystem.getOrbitalObjects();
    const orbitalObjectTargets = orbitalObjects.flatMap((object) => createOrbitalObjectTargets(object));
    out.push(...orbitalObjectTargets);

    out.push(...starSystem.getSystemTargets().map(createSystemTarget));

    return out;
}

function createOrbitalObjectTargets(orbitalObject: OrbitalObject): Array<Target> {
    if (orbitalObject.type === "spaceElevator" || orbitalObject.type === "spaceStation") {
        return createOrbitalFacilityTargets(orbitalObject);
    }
    return [createOrbitalObjectTarget(orbitalObject)];
}

export function createOrbitalObjectTarget(orbitalObject: OrbitalObject): Target {
    switch (orbitalObject.type) {
        case "darkKnight":
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
        case "spaceStation":
        case "spaceElevator":
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

function createAnomalyTarget(anomaly: Anomaly): Target {
    return {
        type: TargetType.ANOMALY,
        isDarkKnight: anomaly.type === "darkKnight",
        properName: anomaly.model.name,
        getTransform: () => anomaly.getTransform(),
        getBoundingRadius: () => anomaly.getBoundingRadius(),
    };
}

export function createSystemTarget(systemTarget: SystemTarget): Target {
    return {
        type: TargetType.STAR_SYSTEM,
        properName: systemTarget.name,
        getTransform: () => systemTarget.getTransform(),
        getBoundingRadius: () => systemTarget.getBoundingRadius(),
    };
}

export function createSpaceshipTarget(spaceship: Spaceship): Target {
    return {
        type: TargetType.SPACESHIP,
        properName: spaceship.name,
        getTransform: () => spaceship.getTransform(),
        getBoundingRadius: () => spaceship.getBoundingRadius(),
    };
}

export function createVehicleTarget(vehicle: Vehicle): Target {
    return {
        type: TargetType.VEHICLE,
        properName: vehicle.name,
        getTransform: () => vehicle.getTransform(),
        getBoundingRadius: () => vehicle.getBoundingRadius(),
    };
}

function createOrbitalFacilityTargets(orbitalFacility: OrbitalFacility): Array<Target> {
    const out: Array<Target> = [createOrbitalObjectTarget(orbitalFacility)];

    const landingPads = orbitalFacility.getLandingPadManager().getLandingPads();
    const landingPadTargets = landingPads.flatMap((pad) => createLandingPadTargets(pad));
    out.push(...landingPadTargets);

    const landingBays = orbitalFacility.getLandingBays();
    const landingBayTargets = landingBays.flatMap((bay) => createLandingBayTargets(bay));
    out.push(...landingBayTargets);

    if (orbitalFacility.type === "spaceElevator") {
        const climberTargets = createClimberTargets(orbitalFacility.getClimber());
        out.push(...climberTargets);
    }

    return out;
}

export function createLandingPadTargets(landingPad: ILandingPad): Array<PadTarget> {
    return [
        {
            getTransform: () => landingPad.getTransform(),
            getBoundingRadius: () => landingPad.getBoundingRadius(),
            type: TargetType.LANDING_PAD,
            padIdentifier: landingPad.getIdentifier(),
        },
    ];
}

function createLandingBayTargets(landingBay: LandingBay): Array<Target> {
    return [
        {
            getTransform: () => landingBay.getTransform(),
            getBoundingRadius: () => landingBay.getBoundingRadius(),
            type: TargetType.LANDING_BAY,
        },
    ];
}

function createClimberTargets(climber: SpaceElevatorClimber): Array<Target> {
    return [
        {
            getTransform: () => climber.getTransform(),
            getBoundingRadius: () => climber.getBoundingRadius(),
            type: TargetType.SPACE_ELEVATOR_CLIMBER,
        },
    ];
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
