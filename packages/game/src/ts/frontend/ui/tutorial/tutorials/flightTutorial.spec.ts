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
import { StarSystemDatabase } from "@/backend/universe/starSystemDatabase";

import { FlightTutorial } from "./flightTutorial";

describe("flightTutorial", () => {
    it("spawns inside of the rings of the planet", () => {
        const starSystemDatabase = new StarSystemDatabase(getLoneStarSystem());
        const tutorial = new FlightTutorial();

        const saveDataResult = tutorial.getSaveData(starSystemDatabase);
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

        const planetModel = starSystemDatabase.getObjectModelByUniverseId(shipLocation.universeObjectId);

        expect(planetModel).not.toBe(null);
        if (planetModel === null) {
            throw new Error("planetModel is null");
        }

        expect(planetModel.type).toBe("gasPlanet");
        if (planetModel.type !== "gasPlanet") {
            throw new Error("planetModel.type is not GAS_PLANET");
        }

        expect(planetModel.rings).not.toBe(null);
        if (planetModel.rings === null) {
            throw new Error("planetModel.rings is null");
        }

        const distanceToPlanet = Math.sqrt(
            shipLocation.position.x ** 2 + shipLocation.position.y ** 2 + shipLocation.position.z ** 2,
        );

        expect(distanceToPlanet).toBeLessThan(planetModel.rings.outerRadius);

        expect(distanceToPlanet).toBeGreaterThan(planetModel.rings.innerRadius);
    });
});
