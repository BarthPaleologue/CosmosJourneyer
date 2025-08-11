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

import { describe, expect, it } from "vitest";

import { getLoneStarSystem } from "@/backend/universe/customSystems/loneStar";
import { OrbitalObjectType } from "@/backend/universe/orbitalObjects/orbitalObjectType";
import { UniverseBackendLocal } from "@/backend/universe/universeBackendLocal";

import { Mission } from "@/frontend/missions/mission";

import { StarMapTutorial } from "./starMapTutorial";

describe("StarMapTutorial", () => {
    it("spawns near a space station", () => {
        const universeBackend = new UniverseBackendLocal(getLoneStarSystem());
        const tutorial = new StarMapTutorial();

        const saveDataResult = tutorial.getSaveData(universeBackend);
        expect(saveDataResult.success).toBe(true);
        if (!saveDataResult.success) {
            throw new Error("saveData is not successful");
        }

        const saveData = saveDataResult.value;

        expect(saveData.playerLocation.type).toBe("inSpaceship");
        if (saveData.playerLocation.type !== "inSpaceship") {
            throw new Error("saveData.playerLocation.type is not inSpaceship");
        }

        const shipId = saveData.playerLocation.shipId;

        const shipLocation = saveData.shipLocations[shipId];
        expect(shipLocation).not.toBe(undefined);
        if (shipLocation === undefined) {
            throw new Error("shipLocation is undefined");
        }

        expect(shipLocation.type).toBe("relative");
        if (shipLocation.type !== "relative") {
            throw new Error("shipLocation.location.type is not relative");
        }

        const stationModel = universeBackend.getObjectModelByUniverseId(shipLocation.universeObjectId);

        expect(stationModel?.type).toBe(OrbitalObjectType.SPACE_STATION);
    });

    it("has correct mission objectives", () => {
        const universeBackend = new UniverseBackendLocal(getLoneStarSystem());
        const tutorial = new StarMapTutorial();

        const saveDataResult = tutorial.getSaveData(universeBackend);
        expect(saveDataResult.success).toBe(true);
        if (!saveDataResult.success) {
            throw new Error("saveData is not successful");
        }

        const saveData = saveDataResult.value;

        expect(saveData.player.currentMissions.length).toBeGreaterThan(0);

        for (const serializedMission of saveData.player.currentMissions) {
            const missionGiverId = serializedMission.missionGiver;
            const missionGiver = universeBackend.getObjectModelByUniverseId(missionGiverId);
            expect(missionGiver).not.toBe(null);

            const mission = Mission.Deserialize(serializedMission, universeBackend);
            expect(mission).not.toBe(null);

            const targetSystems = mission?.getTargetSystems();
            for (const targetSystem of targetSystems ?? []) {
                const systemModel = universeBackend.getSystemModelFromCoordinates(targetSystem);
                expect(systemModel).not.toBe(null);
            }
        }
    });
});
