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

import { getVestaModel } from "@/modules/vesta/vesta";

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

    it.each(["system content", "object lookup"])("passes the resolved position to generators during %s", (lookup) => {
        const { starSystem: system, systemEntities } = getVestaModel();
        universeBackend.registerAuthoredSystem(system);
        const galacticPosition = { x: 17, y: -23, z: 41 };
        vi.spyOn(universeBackend, "getSystemGalacticPosition").mockReturnValue(galacticPosition);
        const entity = systemEntities[0];
        if (entity === undefined) {
            throw new Error("Vesta needs an authored entity");
        }
        universeBackend.registerAuthoredEntities(system.coordinates, [entity]);
        const generated = { ...entity, id: "procedural-entity" };
        const generator = vi.fn<SystemEntityModelGenerator>(() => [generated]);
        universeBackend.registerProceduralEntities(generator);

        if (lookup === "system content") {
            const content = universeBackend.getSystemContentModelAt(system.coordinates);
            expect(content?.entities).toEqual([entity, generated]);
        } else {
            const found = universeBackend.getObjectModel({
                systemCoordinates: system.coordinates,
                idInSystem: generated.id,
            });
            expect(found).toEqual({ type: "systemEntity", object: generated });
        }

        expect(generator).toHaveBeenCalledExactlyOnceWith({ system, galacticPosition, origin: "authored" });
    });

    it.each(["system content", "object lookup"])("marks generated systems as procedural during %s", (lookup) => {
        const coordinates = universeBackend.getSystemCoordinatesInStarSector(0, 0, 0)[0];
        if (coordinates === undefined) {
            throw new Error("Expected a generated system");
        }
        const system = universeBackend.getSystemContentModelAt(coordinates)?.system;
        if (system === undefined) {
            throw new Error("Expected a generated model");
        }
        const entity = {
            id: "generated-content",
            name: "Generated content",
            content: { type: "fixture" },
            placement: { type: "inFrame" as const, parentId: system.stellarObjects[0].id },
        };
        const generator = vi.fn<SystemEntityModelGenerator>(() => [entity]);
        universeBackend.registerProceduralEntities(generator);
        if (lookup === "system content") {
            expect(universeBackend.getSystemContentModelAt(coordinates)?.entities).toEqual([entity]);
        } else {
            expect(universeBackend.getObjectModel({ systemCoordinates: coordinates, idInSystem: entity.id })).toEqual({
                type: "systemEntity",
                object: entity,
            });
        }
        expect(generator).toHaveBeenCalledExactlyOnceWith({
            system,
            galacticPosition: universeBackend.getSystemGalacticPosition(coordinates),
            origin: "procedural",
        });
    });

    it("resolves orbital objects without running entity generators", () => {
        const system = getSolSystemModel();
        universeBackend.registerAuthoredSystem(system);
        const generator = vi.fn<SystemEntityModelGenerator>(() => []);
        universeBackend.registerProceduralEntities(generator);
        const star = system.stellarObjects[0];

        expect(universeBackend.getObjectModel({ systemCoordinates: system.coordinates, idInSystem: star.id })).toEqual({
            type: "orbitalObject",
            object: star,
        });
        expect(generator).not.toHaveBeenCalled();
    });
});
