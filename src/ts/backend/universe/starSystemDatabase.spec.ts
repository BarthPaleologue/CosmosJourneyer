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

import { beforeEach, describe, expect, it } from "vitest";

import { type StarSystemCoordinates } from "@/backend/universe/starSystemCoordinates";

import { getLoneStarSystem } from "./customSystems/loneStar";
import { getSolSystemModel } from "./customSystems/sol/sol";
import { StarSystemDatabase } from "./starSystemDatabase";
import { type StarSystemModel } from "./starSystemModel";

describe("StarSystemDatabase", () => {
    let database: StarSystemDatabase;

    beforeEach(() => {
        database = new StarSystemDatabase(getLoneStarSystem());
    });

    describe("registerCustomSystem", () => {
        it("should add a custom system that can be retrieved", () => {
            const customSystem = getSolSystemModel();
            database.registerCustomSystem(customSystem);

            const retrievedSystems = database.getSystemModelsInStarSector(
                customSystem.coordinates.starSectorX,
                customSystem.coordinates.starSectorY,
                customSystem.coordinates.starSectorZ,
            );
            expect(retrievedSystems).toContain(customSystem);
        });
    });

    describe("registerSinglePlugin", () => {
        it("should modify a system at specific coordinates", () => {
            const coordinates: StarSystemCoordinates = database.getSystemCoordinatesFromSeed(0.0, 0.0, 0.0, 0);
            const plugin = (system: StarSystemModel) => {
                system.name = "Modified System";
                return system;
            };

            database.registerSinglePlugin(coordinates, plugin);
            const model = database.getSystemModelFromCoordinates(coordinates);
            expect(model).not.toBeNull();
            expect(model?.name).toBe("Modified System");
        });
    });

    describe("isSystemInHumanBubble", () => {
        it("should return true for systems near origin", () => {
            const closeCoordinates: StarSystemCoordinates = {
                starSectorX: 0,
                starSectorY: 0,
                starSectorZ: 0,
                localX: 0,
                localY: 0,
                localZ: 0,
            };
            expect(database.isSystemInHumanBubble(closeCoordinates)).toBe(true);
        });

        it("should return false for distant systems", () => {
            const farCoordinates = {
                starSectorX: 1000,
                starSectorY: 1000,
                starSectorZ: 1000,
                localX: 0,
                localY: 0,
                localZ: 0,
            };
            expect(database.isSystemInHumanBubble(farCoordinates)).toBe(false);
        });
    });
});
