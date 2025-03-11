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

import { describe, expect, it, vi } from "vitest";
import { SaveBackend, SaveManager } from "./saveManager";
import { CmdrSaves, SaveLoadingError } from "./saveFileData";
import { err, ok, Result } from "../utils/types";
import { SerializedPlayerSchema } from "../player/serializedPlayer";

/**
 * Mock implementation of SaveBackend for testing
 */
class MockSaveBackend implements SaveBackend {
    private mockData: Record<string, CmdrSaves> = {};
    public readShouldFail = false;
    public writeShouldFail = false;

    constructor(initialData?: Record<string, CmdrSaves>) {
        if (initialData) {
            this.mockData = initialData;
        }
    }

    public write(saves: Record<string, CmdrSaves>): boolean {
        if (this.writeShouldFail) {
            return false;
        }
        this.mockData = { ...saves };
        return true;
    }

    public read(): Result<Record<string, CmdrSaves>, SaveLoadingError> {
        if (this.readShouldFail) {
            return err(SaveLoadingError.INVALID_JSON);
        }
        return ok(this.mockData);
    }
}

describe("SaveManager", () => {
    const testSaves: Record<string, CmdrSaves> = {
        cmdr1: {
            manual: [
                {
                    version: "1.0.0",
                    timestamp: 12345,
                    player: SerializedPlayerSchema.parse({}),
                    universeCoordinates: {
                        rotationQuaternionX: 0,
                        rotationQuaternionY: 0,
                        rotationQuaternionZ: 0,
                        rotationQuaternionW: 1,
                        positionX: 0,
                        positionY: 0,
                        positionZ: 0,
                        universeObjectId: {
                            starSystemCoordinates: {
                                starSectorX: 0,
                                starSectorY: 0,
                                starSectorZ: 0,
                                localX: 0,
                                localY: 0,
                                localZ: 0
                            },
                            objectType: 0,
                            objectIndex: 0
                        }
                    }
                }
            ],
            auto: []
        },
        cmdr2: {
            manual: [],
            auto: [
                {
                    version: "1.0.0",
                    timestamp: 67890,
                    player: SerializedPlayerSchema.parse({}),
                    universeCoordinates: {
                        rotationQuaternionX: 0,
                        rotationQuaternionY: 0,
                        rotationQuaternionZ: 0,
                        rotationQuaternionW: 1,
                        positionX: 0,
                        positionY: 0,
                        positionZ: 0,
                        universeObjectId: {
                            starSystemCoordinates: {
                                starSectorX: 0,
                                starSectorY: 0,
                                starSectorZ: 0,
                                localX: 0,
                                localY: 0,
                                localZ: 0
                            },
                            objectType: 0,
                            objectIndex: 0
                        }
                    }
                }
            ]
        }
    };

    describe("Create", () => {
        it("should create a SaveManager with existing saves", () => {
            const backend = new MockSaveBackend(testSaves);
            const result = SaveManager.Create(backend);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value.getSavesForCmdr("cmdr1")).toEqual(testSaves.cmdr1);
                expect(result.value.getSavesForCmdr("cmdr2")).toEqual(testSaves.cmdr2);
            }
        });

        it("should create a SaveManager with empty saves", () => {
            const backend = new MockSaveBackend({});
            const result = SaveManager.Create(backend);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value.getSavesForCmdr("cmdr1")).toBeUndefined();
            }
        });

        it("should handle read errors", () => {
            const backend = new MockSaveBackend();
            backend.readShouldFail = true;
            const result = SaveManager.Create(backend);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe(SaveLoadingError.INVALID_JSON);
            }
        });
    });

    describe("getSavesForCmdr", () => {
        it("should return saves for an existing cmdr", () => {
            const backend = new MockSaveBackend(testSaves);
            const result = SaveManager.Create(backend);

            expect(result.success).toBe(true);
            if (result.success) {
                const manager = result.value;
                expect(manager.getSavesForCmdr("cmdr1")).toEqual(testSaves.cmdr1);
            }
        });

        it("should return undefined for a non-existent cmdr", () => {
            const backend = new MockSaveBackend(testSaves);
            const result = SaveManager.Create(backend);

            expect(result.success).toBe(true);
            if (result.success) {
                const manager = result.value;
                expect(manager.getSavesForCmdr("nonexistent")).toBeUndefined();
            }
        });
    });

    describe("save", () => {
        it("should save data to the backend successfully", () => {
            const backend = new MockSaveBackend(testSaves);
            const writeSpy = vi.spyOn(backend, "write");

            const result = SaveManager.Create(backend);
            expect(result.success).toBe(true);

            if (result.success) {
                const manager = result.value;
                const saveResult = manager.save();

                expect(saveResult).toBe(true);
                expect(writeSpy).toHaveBeenCalledTimes(1);
                expect(writeSpy).toHaveBeenCalledWith(testSaves);
            }
        });

        it("should handle backend write failures", () => {
            const backend = new MockSaveBackend(testSaves);
            backend.writeShouldFail = true;

            const result = SaveManager.Create(backend);
            expect(result.success).toBe(true);

            if (result.success) {
                const manager = result.value;
                const saveResult = manager.save();

                expect(saveResult).toBe(false);
            }
        });
    });
});
