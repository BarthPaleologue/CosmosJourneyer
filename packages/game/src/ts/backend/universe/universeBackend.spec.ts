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

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SystemEntityModelGenerator } from "@/backend/systemEntity/systemEntityBackend";
import { SystemEntityBackend } from "@/backend/systemEntity/systemEntityBackend";

import { getSolSystemModel } from "./customSystems/sol/sol";
import { UniverseBackend } from "./universeBackend";

describe("UniverseBackend", () => {
    let universeBackend: UniverseBackend;

    beforeEach(() => {
        universeBackend = new UniverseBackend(new SystemEntityBackend());
    });

    describe("registerAuthoredSystem", () => {
        it("should add a custom system that can be retrieved", () => {
            const customSystem = getSolSystemModel();
            universeBackend.registerAuthoredSystem(customSystem);

            const { starSectorX, starSectorY, starSectorZ } = customSystem.coordinates;
            const coordinates = universeBackend.getSystemCoordinatesInStarSector(starSectorX, starSectorY, starSectorZ);
            expect(coordinates.filter((entry) => entry === customSystem.coordinates)).toHaveLength(1);
            const models = universeBackend.getSystemModelsInStarSector(starSectorX, starSectorY, starSectorZ);
            expect(models.filter((model) => model === customSystem)).toHaveLength(1);
            expect(universeBackend.getSystemContentModelAt(customSystem.coordinates)?.system).toBe(customSystem);
            const positions = universeBackend.getSystemPositionsInStarSector(starSectorX, starSectorY, starSectorZ);
            expect(positions).toHaveLength(coordinates.length);
            expect(positions).toContainEqual(universeBackend.getSystemGalacticPosition(customSystem.coordinates));
        });
    });

    it("passes the backend-resolved position to procedural generators", () => {
        const system = getSolSystemModel();
        universeBackend.registerAuthoredSystem(system);
        const galacticPosition = { x: 17, y: -23, z: 41 };
        vi.spyOn(universeBackend, "getSystemGalacticPosition").mockReturnValue(galacticPosition);
        const generator = vi.fn<SystemEntityModelGenerator>(() => []);
        universeBackend.registerProceduralEntities(generator);

        universeBackend.getSystemContentModelAt(system.coordinates);

        expect(generator).toHaveBeenCalledExactlyOnceWith({ system, galacticPosition });
    });
});
