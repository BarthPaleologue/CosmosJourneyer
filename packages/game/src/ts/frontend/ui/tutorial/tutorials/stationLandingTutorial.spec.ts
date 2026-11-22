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

import { createInstance } from "i18next";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SystemEntityBackend } from "@/backend/systemEntity/systemEntityBackend";
import { UniverseBackend } from "@/backend/universe/universeBackend";

import { ModuleAssetRegistry } from "@/frontend/assets/moduleAssetRegistry";
import { createGameModuleApi } from "@/frontend/createGameModuleApi";
import { StarMapSystemInfoRegistry } from "@/frontend/starmap/starMapSystemInfoRegistry";
import { SystemEntityLoader } from "@/frontend/systemEntity/systemEntityLoader";
import { SystemEntityProcessors } from "@/frontend/systemEntity/systemEntityProcessors";

import { I18n } from "@/i18n";
import { OrbitalFacilitiesModule } from "@/modules/orbitalFacilities";

import { StationLandingTutorial } from "./stationLandingTutorial";

const t = createInstance().getFixedT("en-US");

describe("StationLandingTutorial", () => {
    let universeBackend: UniverseBackend;
    let processors: SystemEntityProcessors;
    beforeEach(async () => {
        processors = new SystemEntityProcessors();
        const i18n = await I18n.New();
        universeBackend = new UniverseBackend(new SystemEntityBackend());
        OrbitalFacilitiesModule.setup(
            createGameModuleApi(
                universeBackend,
                new SystemEntityLoader(),
                processors,
                new ModuleAssetRegistry(),
                new StarMapSystemInfoRegistry(),
                i18n,
            ),
        );
    });
    afterEach(() => {
        processors.dispose();
    });
    it("spawns near a space station", () => {
        const tutorial = new StationLandingTutorial(t);

        const saveDataResult = tutorial.getSaveData();
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
        expect(shipLocation).toBeDefined();
        if (shipLocation === undefined) {
            throw new Error("shipLocation is undefined");
        }

        expect(shipLocation.type).toBe("relative");
        if (shipLocation.type !== "relative") {
            throw new Error("shipLocation.location.type is not relative");
        }

        const targetModel = universeBackend.getObjectModel(shipLocation.universeObjectId);
        expect(targetModel?.type).toBe("systemEntity");
        const stationModel = targetModel?.type === "systemEntity" ? targetModel.object.content : null;

        expect(stationModel?.type).toBe("spaceStation");
    });
});
