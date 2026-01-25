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

import { SerializedPlayerSchema } from "@/backend/player/serializedPlayer";
import type { ISaveBackend } from "@/backend/save/saveBackend";
import type { CmdrSaves, Save } from "@/backend/save/saveFileData";
import { getLatestSaveFromBackend } from "@/backend/save/saveHelpers";

class MockSaveBackend implements ISaveBackend {
    private readonly saves: Record<string, CmdrSaves>;

    constructor(saves: Record<string, CmdrSaves> = {}) {
        this.saves = saves;
    }

    async getSavesForCmdr(cmdrUuid: string): Promise<CmdrSaves | undefined> {
        return Promise.resolve(this.saves[cmdrUuid]);
    }

    async getCmdrUuids(): Promise<Array<string>> {
        return Promise.resolve(Object.keys(this.saves));
    }

    async deleteSaveForCmdr(): Promise<boolean> {
        return Promise.resolve(false);
    }

    async deleteCmdr(): Promise<boolean> {
        return Promise.resolve(false);
    }

    async addManualSave(): Promise<boolean> {
        return Promise.resolve(false);
    }

    async addAutoSave(): Promise<boolean> {
        return Promise.resolve(false);
    }

    async importSaves(): Promise<boolean> {
        return Promise.resolve(false);
    }

    async exportSaves(): Promise<Record<string, CmdrSaves>> {
        return Promise.resolve(this.saves);
    }
}

const createTestSave = (timestamp: number): Save => {
    return {
        uuid: crypto.randomUUID(),
        timestamp,
        player: SerializedPlayerSchema.parse({}),
        playerLocation: {
            type: "relative",
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            position: { x: 0, y: 0, z: 0 },
            universeObjectId: {
                systemCoordinates: {
                    starSectorX: 0,
                    starSectorY: 0,
                    starSectorZ: 0,
                    localX: 0,
                    localY: 0,
                    localZ: 0,
                },
                idInSystem: "0",
            },
        },
        shipLocations: {},
    };
};

describe("getLatestSaveFromBackend", () => {
    it("returns null when there are no commanders", async () => {
        const backend = new MockSaveBackend();

        await expect(getLatestSaveFromBackend(backend)).resolves.toBeNull();
    });

    it("returns the latest save across commanders", async () => {
        const cmdrOne = "cmdr-one";
        const cmdrTwo = "cmdr-two";
        const latestSave = createTestSave(200);

        const backend = new MockSaveBackend({
            [cmdrOne]: {
                manual: [createTestSave(100)],
                auto: [],
            },
            [cmdrTwo]: {
                manual: [],
                auto: [latestSave],
            },
        });

        await expect(getLatestSaveFromBackend(backend)).resolves.toEqual(latestSave);
    });
});
