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
import { StationLandingTutorial } from "./stationLandingTutorial";
import { StarSystemDatabase } from "../starSystem/starSystemDatabase";
import { getObjectModelByUniverseId } from "../utils/coordinates/orbitalObjectIdUtils";
import { OrbitalObjectType } from "../architecture/orbitalObjectType";
import { getLoneStarSystem } from "../starSystem/customSystems/loneStar";

describe("StationLandingTutorial", () => {
    it("spawns near a space station", () => {
        const starSystemDatabase = new StarSystemDatabase(getLoneStarSystem());
        const tutorial = new StationLandingTutorial();

        const stationModel = getObjectModelByUniverseId(
            tutorial.saveData.universeCoordinates.universeObjectId,
            starSystemDatabase
        );

        expect(stationModel?.type).toBe(OrbitalObjectType.SPACE_STATION);
    });
});
