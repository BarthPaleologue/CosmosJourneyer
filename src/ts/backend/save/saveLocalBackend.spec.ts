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

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ShipType } from "../spaceship/serializedSpaceship";
import { getLoneStarSystem } from "../universe/customSystems/loneStar";
import { StarSystemDatabase } from "../universe/starSystemDatabase";
import { CmdrSaves } from "./saveFileData";
import { SaveLocalBackend } from "./saveLocalBackend";

describe("SaveLocalBackend", () => {
    const saves: Record<string, CmdrSaves> = {
        "00000000-0000-0000-0000-000000000000": {
            auto: [],
            manual: [
                {
                    timestamp: 1746349852196,
                    player: {
                        uuid: "00000000-0000-0000-0000-000000000000",
                        name: "Python",
                        balance: 10000,
                        creationDate: "2024-11-12T16:46:36.350Z",
                        timePlayedSeconds: 235,
                        visitedSystemHistory: [],
                        discoveries: { local: [], uploaded: [] },
                        currentItinerary: null,
                        systemBookmarks: [],
                        currentMissions: [],
                        completedMissions: [],
                        spaceShips: [
                            {
                                id: "109e8fd9-7582-44f2-ba31-4019996849a6",
                                name: "Wanderer",
                                type: ShipType.WANDERER,
                                components: {
                                    primary: {
                                        warpDrive: { type: "warpDrive", size: 3, quality: 1 },
                                        fuelTank: { type: "fuelTank", size: 2, quality: 1, currentFuel01: 1 },
                                        thrusters: { type: "thrusters", size: 3, quality: 1 },
                                    },
                                    optional: [{ type: "fuelScoop", size: 2, quality: 1 }, null, null],
                                },
                            },
                        ],
                        spareSpaceshipComponents: [],
                        tutorials: {
                            flightCompleted: false,
                            stationLandingCompleted: false,
                            starMapCompleted: false,
                            fuelScoopingCompleted: false,
                        },
                    },
                    playerLocation: { type: "inSpaceship", shipId: "109e8fd9-7582-44f2-ba31-4019996849a6" },
                    shipLocations: {
                        "109e8fd9-7582-44f2-ba31-4019996849a6": {
                            type: "relative",
                            universeObjectId: {
                                systemCoordinates: {
                                    starSectorX: 0,
                                    starSectorY: 0,
                                    starSectorZ: 1,
                                    localX: -0.3591535053491376,
                                    localY: 0.22225331036478901,
                                    localZ: -0.07379512236164654,
                                },
                                idInSystem: "[[]->star0]->gasPlanet0",
                            },
                            position: { x: -16609794.315173151, y: 40.544271673554235, z: 38868265.94964077 },
                            rotation: {
                                x: 0.1199683537492946,
                                y: 0.1682183428106448,
                                z: 0.4227603449804604,
                                w: 0.8823739989061702,
                            },
                        },
                    },
                },
            ],
        },
    };

    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it("should read and write saves correctly", async () => {
        localStorage.setItem(SaveLocalBackend.SAVES_KEY, JSON.stringify(saves));

        const starSystemDatabase = new StarSystemDatabase(getLoneStarSystem());
        const savesBackend = new SaveLocalBackend();
        const result = await savesBackend.read(starSystemDatabase);

        if (!result.success) {
            throw new Error("Could not load saves");
        }

        expect(result.value).toEqual(saves);

        localStorage.clear();

        savesBackend.write(result.value);

        const writtenSaves = localStorage.getItem(SaveLocalBackend.SAVES_KEY);
        if (writtenSaves === null) {
            throw new Error("Nothing was written to localStorage");
        }

        expect(JSON.parse(writtenSaves)).toEqual(saves);
    });
});
