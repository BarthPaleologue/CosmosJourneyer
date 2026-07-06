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

import { describe, expect, it } from "vitest";

import { getLoneStarSystem } from "@/backend/universe/customSystems/loneStar";
import { UniverseBackend } from "@/backend/universe/universeBackend";

import { PlanetaryLandingTutorial } from "./planetaryLandingTutorial";

describe("PlanetaryLandingTutorial", () => {
    it("spawns near a landable celestial body", () => {
        const universeBackend = new UniverseBackend(getLoneStarSystem());
        const tutorial = new PlanetaryLandingTutorial();

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

        const shipLocation = saveData.shipLocations[saveData.playerLocation.shipId];
        expect(shipLocation).not.toBe(undefined);
        if (shipLocation === undefined) {
            throw new Error("shipLocation is undefined");
        }

        expect(shipLocation.type).toBe("relative");
        if (shipLocation.type !== "relative") {
            throw new Error("shipLocation.location.type is not relative");
        }

        const landableBodyModel = universeBackend.getObjectModelByUniverseId(shipLocation.universeObjectId);

        expect(landableBodyModel?.type === "telluricPlanet" || landableBodyModel?.type === "telluricSatellite").toBe(
            true,
        );
        if (landableBodyModel?.type !== "telluricPlanet" && landableBodyModel?.type !== "telluricSatellite") {
            throw new Error("landableBodyModel is not a landable celestial body");
        }

        const distanceToBodyCenter = Math.sqrt(
            shipLocation.position.x ** 2 + shipLocation.position.y ** 2 + shipLocation.position.z ** 2,
        );

        expect(distanceToBodyCenter).toBeGreaterThan(landableBodyModel.radius);
        expect(distanceToBodyCenter).toBeLessThan(landableBodyModel.radius * 4);
    });
});
