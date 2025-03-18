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
import { FlightTutorial } from "./flightTutorial";
import { StarSystemDatabase } from "../starSystem/starSystemDatabase";
import { getObjectModelByUniverseId } from "../utils/coordinates/orbitalObjectIdUtils";
import { OrbitalObjectType } from "../architecture/orbitalObjectType";

describe("flightTutorial", () => {
    it("spawns inside of the rings of the planet", () => {
        const starSystemDatabase = new StarSystemDatabase();
        const flightTutorial = new FlightTutorial();

        const planetModel = getObjectModelByUniverseId(
            flightTutorial.saveData.universeCoordinates.universeObjectId,
            starSystemDatabase
        );

        expect(planetModel).not.toBe(null);
        if (planetModel === null) {
            throw new Error("planetModel is null");
        }

        expect(planetModel.type).toBe(OrbitalObjectType.GAS_PLANET);
        if (planetModel.type !== OrbitalObjectType.GAS_PLANET) {
            throw new Error("planetModel.type is not GAS_PLANET");
        }

        expect(planetModel.rings).not.toBe(null);
        if (planetModel.rings === null) {
            throw new Error("planetModel.rings is null");
        }

        const distanceToPlanet = Math.sqrt(
            flightTutorial.saveData.universeCoordinates.positionX ** 2 +
                flightTutorial.saveData.universeCoordinates.positionY ** 2 +
                flightTutorial.saveData.universeCoordinates.positionZ ** 2
        );

        const distanceToPlanetNormalized = distanceToPlanet / planetModel.radius;

        expect(distanceToPlanetNormalized).toBeLessThan(planetModel.rings.ringEnd);

        expect(distanceToPlanetNormalized).toBeGreaterThan(planetModel.rings.ringStart);
    });
});
