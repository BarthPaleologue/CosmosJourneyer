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

import { centeredRand, uniformRandBool } from "@cosmos-journeyer/random";
import { ok } from "@cosmos-journeyer/typescript";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import { createOrbitalObjectId } from "@cosmos-journeyer/universe-model";
import type { PlanetModel, StarSystemCoordinates } from "@cosmos-journeyer/universe-model";

import type { SystemEntityModel } from "@/backend/systemEntity/systemEntityModel";
import type { UniverseBackend } from "@/backend/universe/universeBackend";

import type { SpaceElevatorClimber } from "@/frontend/assets/procedural/spaceStation/climber/spaceElevatorClimber";
import type { LandingBay } from "@/frontend/assets/procedural/spaceStation/landingBay/landingBay";
import { makeSystemContentType } from "@/frontend/systemEntity/systemEntity";
import { TargetType } from "@/frontend/targeting/target";
import type { PadTarget, Target } from "@/frontend/targeting/target";
import type { ILandingPad } from "@/frontend/universe/orbitalFacility/landingPadProvider";

import { Settings } from "@/settings";

import type { GameModule } from "../gameModule";
import type { GameModuleApi } from "../gameModuleApi";
import { generateSpaceElevatorModel } from "./proceduralGeneration/spaceElevatorModelGenerator";
import { generateSpaceStationModel } from "./proceduralGeneration/spaceStationModelGenerator";
import { SpaceElevator } from "./spaceElevator";
import type { SpaceElevatorModel } from "./spaceElevatorModel";
import { SpaceStation } from "./spaceStation";
import type { SpaceStationModel } from "./spaceStationModel";

export const OrbitalFacilitiesModule: GameModule = {
    id: "orbital-facilities",
    setup: (api): void => {
        setupSpaceStation(api);
        setupSpaceElevator(api);

        api.systemEntities.registerProcedural(({ system }) => {
            const isCivilized = isSystemInHumanBubble(system.coordinates);
            if (!isCivilized) {
                return [];
            }

            const orbitalFacilities: Array<SystemEntityModel> = [];

            const planets = system.planets;
            const planetCount = planets.length;

            // finally, space station are placed
            const planetToScore = new Map<DeepReadonly<PlanetModel>, number>();

            for (const planet of planets) {
                let score = 0;
                const nbMoons = system.satellites.filter((satellite) =>
                    satellite.orbit.parentIds.includes(planet.id),
                ).length;
                score += nbMoons;
                score += planet.rings !== null ? 2 : 0;

                planetToScore.set(planet, score);
            }

            // sort planets by potential score
            const sortedPlanets = planets.toSorted((planetA, planetB) => {
                const scoreA = planetToScore.get(planetA) ?? 0;
                const scoreB = planetToScore.get(planetB) ?? 0;
                return scoreB - scoreA;
            });

            const nbStations = Math.min(planetCount, Math.max(1, systemRng(77) * Math.floor(planetCount / 2)));

            const planetsWithStations = sortedPlanets.slice(0, nbStations);

            for (const planet of planetsWithStations) {
                const spaceStationSeed = centeredRand(systemRng, 2_000 + orbitalFacilities.length) * SeedHalfRange;

                if (
                    uniformRandBool(0.5, systemRng, 657) && // 50% chance of having a space elevator
                    planet.type === "telluricPlanet" && // space elevators can't be built on gas giants yet
                    planet.rings === null // can't have rings because the tether would be at risk
                ) {
                    const spaceElevatorModel = generateSpaceElevatorModel(
                        createOrbitalObjectId([planet.id], "spaceElevator", 0),
                        spaceStationSeed,
                        planet,
                        system,
                    );
                    orbitalFacilities.push(spaceElevatorModel);
                } else {
                    const spaceStationModel = generateSpaceStationModel(
                        createOrbitalObjectId([planet.id], "spaceStation", 0),
                        spaceStationSeed,
                        planet,
                        system,
                    );
                    orbitalFacilities.push(spaceStationModel);
                }
            }

            return orbitalFacilities;
        });
    },
};

function setupSpaceStation({ systemEntities, landingPad, rendering, targeting }: GameModuleApi) {
    const type = makeSystemContentType<SpaceStationModel, SpaceStation>("spaceStation");

    systemEntities.registerContentFactory(type, (model, context) => ok(new SpaceStation(model, context)));

    systemEntities.registerUpdate(type, (entity, { observerPosition, deltaSeconds }) => {
        entity.content.update(observerPosition, deltaSeconds);
    });

    landingPad.systemEntities.register(type, (spaceStation) => spaceStation.content.getLandingPadProvider());

    rendering.lighting.systemEntities.registerRegion(type, (station) => ({
        getTransform: () => station.content.getTransform(),
        getBoundingRadius: () => station.content.getBoundingRadius(),
        getLights: () => station.content.getLights(),
    }));

    targeting.systemEntities.register(type, (station) => {
        const out: Array<Target> = [
            {
                type: TargetType.SPACE_STATION,
                getTransform: () => station.content.getTransform(),
                getBoundingRadius: () => station.content.getBoundingRadius(),
                properName: station.model.name,
            },
        ];

        const landingPads = station.content.getLandingPadProvider().getLandingPads();
        const landingPadTargets = landingPads.flatMap((pad) => createLandingPadTargets(pad));
        out.push(...landingPadTargets);

        const landingBays = station.content.getLandingBays();
        const landingBayTargets = landingBays.flatMap((bay) => createLandingBayTargets(bay));
        out.push(...landingBayTargets);

        return out;
    });
}

function setupSpaceElevator({ systemEntities, landingPad, rendering, targeting }: GameModuleApi) {
    const type = makeSystemContentType<SpaceElevatorModel, SpaceElevator>("spaceElevator");

    systemEntities.registerContentFactory(type, (model, context) => ok(new SpaceElevator(model, context)));

    systemEntities.registerUpdate(type, (entity, { observerPosition, deltaSeconds }) => {
        entity.content.update(observerPosition, deltaSeconds);
    });

    landingPad.systemEntities.register(type, (spaceElevator) => spaceElevator.content.getLandingPadProvider());

    rendering.lighting.systemEntities.registerRegion(type, (elevator) => ({
        getTransform: () => elevator.content.getTransform(),
        getBoundingRadius: () => elevator.content.getBoundingRadius(),
        getLights: () => elevator.content.getLights(),
    }));

    targeting.systemEntities.register(type, (elevator) => {
        const out: Array<Target> = [
            {
                type: TargetType.SPACE_STATION,
                getTransform: () => elevator.content.getTransform(),
                getBoundingRadius: () => elevator.content.getBoundingRadius(),
                properName: elevator.model.name,
            },
        ];

        const landingPads = elevator.content.getLandingPadProvider().getLandingPads();
        const landingPadTargets = landingPads.flatMap((pad) => createLandingPadTargets(pad));
        out.push(...landingPadTargets);

        const landingBays = elevator.content.getLandingBays();
        const landingBayTargets = landingBays.flatMap((bay) => createLandingBayTargets(bay));
        out.push(...landingBayTargets);

        const climberTargets = createClimberTargets(elevator.content.getClimber());
        out.push(...climberTargets);

        return out;
    });
}

function isSystemInHumanBubble(systemCoordinates: StarSystemCoordinates, universeBackend: UniverseBackend): boolean {
    const systemPosition = universeBackend.getSystemGalacticPosition(systemCoordinates);
    const distanceToSolLy = Math.hypot(systemPosition.x, systemPosition.y, systemPosition.z);

    return distanceToSolLy < Settings.HUMAN_BUBBLE_RADIUS_LY;
}

function createLandingPadTargets(landingPad: ILandingPad): Array<PadTarget> {
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
