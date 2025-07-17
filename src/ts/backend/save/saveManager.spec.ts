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
import { getLoneStarSystem } from "@/backend/universe/customSystems/loneStar";
import { StarSystemDatabase } from "@/backend/universe/starSystemDatabase";

import { err, ok, type Result } from "@/utils/types";

import { type CmdrSaves } from "./saveFileData";
import { SaveLoadingErrorType, type SaveLoadingError } from "./saveLoadingError";
import { SaveManager, type SaveBackend } from "./saveManager";

/**
 * Mock implementation of SaveBackend for testing
 */
class MockSaveBackend implements SaveBackend {
    private mockData: Record<string, CmdrSaves> = {};
    public readShouldFail = false;
    public writeShouldFail = false;

    constructor(initialData?: Record<string, CmdrSaves>) {
        if (initialData !== undefined) {
            this.mockData = structuredClone(initialData);
        }
    }

    public write(saves: Record<string, CmdrSaves>): boolean {
        if (this.writeShouldFail) {
            return false;
        }
        this.mockData = { ...saves };
        return true;
    }

    public read(): Promise<Result<Record<string, CmdrSaves>, SaveLoadingError>> {
        if (this.readShouldFail) {
            return Promise.resolve(err({ type: SaveLoadingErrorType.INVALID_JSON }));
        }
        return Promise.resolve(ok(this.mockData));
    }
}

describe("SaveManager", () => {
    const testSaves: Record<string, CmdrSaves> = {
        cmdr1: {
            manual: [
                {
                    timestamp: 12345,
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
                },
            ],
            auto: [],
        },
        cmdr2: {
            manual: [],
            auto: [
                {
                    timestamp: 67890,
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
                },
            ],
        },
    };

    describe("Create", () => {
        it("should create a SaveManager with existing saves", async () => {
            const starSystemDatabase = new StarSystemDatabase(getLoneStarSystem());
            const backend = new MockSaveBackend(testSaves);
            const result = await SaveManager.CreateAsync(backend, starSystemDatabase);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(await result.value.getSavesForCmdr("cmdr1")).toEqual(testSaves["cmdr1"]);
                expect(await result.value.getSavesForCmdr("cmdr2")).toEqual(testSaves["cmdr2"]);
            }
        });

        it("should create a SaveManager with empty saves", async () => {
            const starSystemDatabase = new StarSystemDatabase(getLoneStarSystem());
            const backend = new MockSaveBackend({});
            const result = await SaveManager.CreateAsync(backend, starSystemDatabase);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(await result.value.getSavesForCmdr("cmdr1")).toBeUndefined();
            }
        });

        it("should handle read errors", async () => {
            const starSystemDatabase = new StarSystemDatabase(getLoneStarSystem());
            const backend = new MockSaveBackend();
            backend.readShouldFail = true;
            const result = await SaveManager.CreateAsync(backend, starSystemDatabase);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toEqual({ type: SaveLoadingErrorType.INVALID_JSON });
            }
        });
    });

    describe("getSavesForCmdr", () => {
        it("should return saves for an existing cmdr", async () => {
            const starSystemDatabase = new StarSystemDatabase(getLoneStarSystem());
            const backend = new MockSaveBackend(testSaves);
            const result = await SaveManager.CreateAsync(backend, starSystemDatabase);

            expect(result.success).toBe(true);
            if (result.success) {
                const manager = result.value;
                expect(await manager.getSavesForCmdr("cmdr1")).toEqual(testSaves["cmdr1"]);
            }
        });

        it("should return undefined for a non-existent cmdr", async () => {
            const starSystemDatabase = new StarSystemDatabase(getLoneStarSystem());
            const backend = new MockSaveBackend(testSaves);
            const result = await SaveManager.CreateAsync(backend, starSystemDatabase);

            expect(result.success).toBe(true);
            if (result.success) {
                const manager = result.value;
                expect(await manager.getSavesForCmdr("nonexistent")).toBeUndefined();
            }
        });
    });

    describe("addManualSave", () => {
        const createTestSave = (timestamp: number) => ({
            timestamp,
            player: SerializedPlayerSchema.parse({}),
            playerLocation: {
                type: "relative" as const,
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
        });

        it("should add a manual save to an existing cmdr", async () => {
            const starSystemDatabase = new StarSystemDatabase(getLoneStarSystem());
            const backend = new MockSaveBackend(testSaves);
            const result = await SaveManager.CreateAsync(backend, starSystemDatabase);

            expect(result.success).toBe(true);
            if (result.success) {
                const manager = result.value;
                const newSave = createTestSave(99999);
                const originalLength = (await manager.getSavesForCmdr("cmdr1"))?.manual.length ?? 0;
                const saveResult = await manager.addManualSave("cmdr1", newSave);

                expect(saveResult).toBe(true);
                const cmdrSaves = await manager.getSavesForCmdr("cmdr1");
                expect(cmdrSaves).toBeDefined();
                expect(cmdrSaves?.manual).toHaveLength(originalLength + 1);
                expect(cmdrSaves?.manual[0]?.timestamp).toBe(99999); // Should be at the beginning (unshift)
                if (cmdrSaves && originalLength > 0 && testSaves["cmdr1"]?.manual[0]) {
                    expect(cmdrSaves.manual[1]?.timestamp).toBe(testSaves["cmdr1"].manual[0].timestamp); // Original save should be second
                }
            }
        });

        it("should create new cmdr saves when adding manual save to non-existent cmdr", async () => {
            const starSystemDatabase = new StarSystemDatabase(getLoneStarSystem());
            const backend = new MockSaveBackend({});
            const result = await SaveManager.CreateAsync(backend, starSystemDatabase);

            expect(result.success).toBe(true);
            if (result.success) {
                const manager = result.value;
                const newSave = createTestSave(11111);
                const saveResult = await manager.addManualSave("newCmdr", newSave);

                expect(saveResult).toBe(true);
                const cmdrSaves = await manager.getSavesForCmdr("newCmdr");
                expect(cmdrSaves?.manual).toHaveLength(1);
                expect(cmdrSaves?.manual[0]).toEqual(newSave);
                expect(cmdrSaves?.auto).toHaveLength(0);
            }
        });

        it("should handle backend write failures when adding manual save", async () => {
            const starSystemDatabase = new StarSystemDatabase(getLoneStarSystem());
            const backend = new MockSaveBackend(testSaves);
            backend.writeShouldFail = true;

            const result = await SaveManager.CreateAsync(backend, starSystemDatabase);
            expect(result.success).toBe(true);

            if (result.success) {
                const manager = result.value;
                const originalLength = (await manager.getSavesForCmdr("cmdr1"))?.manual.length ?? 0;
                const newSave = createTestSave(55555);
                const saveResult = await manager.addManualSave("cmdr1", newSave);

                expect(saveResult).toBe(false);
                // Save should still be added to memory even if backend write fails
                const cmdrSaves = await manager.getSavesForCmdr("cmdr1");
                expect(cmdrSaves?.manual).toHaveLength(originalLength + 1);
                expect(cmdrSaves?.manual[0]?.timestamp).toBe(55555);
            }
        });
    });

    describe("addAutoSave", () => {
        const createTestSave = (timestamp: number) => ({
            timestamp,
            player: SerializedPlayerSchema.parse({}),
            playerLocation: {
                type: "relative" as const,
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
        });

        it("should add an auto save to an existing cmdr", async () => {
            const starSystemDatabase = new StarSystemDatabase(getLoneStarSystem());
            const backend = new MockSaveBackend(testSaves);
            const result = await SaveManager.CreateAsync(backend, starSystemDatabase);

            expect(result.success).toBe(true);
            if (result.success) {
                const manager = result.value;
                const newSave = createTestSave(88888);
                const originalLength = (await manager.getSavesForCmdr("cmdr2"))?.auto.length ?? 0;
                const saveResult = await manager.addAutoSave("cmdr2", newSave);

                expect(saveResult).toBe(true);
                const cmdrSaves = await manager.getSavesForCmdr("cmdr2");
                expect(cmdrSaves).toBeDefined();
                expect(cmdrSaves?.auto).toHaveLength(originalLength + 1);
                expect(cmdrSaves?.auto[0]?.timestamp).toBe(88888); // Should be at the beginning (unshift)
                if (cmdrSaves && originalLength > 0 && testSaves["cmdr2"]?.auto[0]) {
                    expect(cmdrSaves.auto[1]?.timestamp).toBe(testSaves["cmdr2"].auto[0].timestamp); // Original save should be second
                }
            }
        });

        it("should create new cmdr saves when adding auto save to non-existent cmdr", async () => {
            const starSystemDatabase = new StarSystemDatabase(getLoneStarSystem());
            const backend = new MockSaveBackend({});
            const result = await SaveManager.CreateAsync(backend, starSystemDatabase);

            expect(result.success).toBe(true);
            if (result.success) {
                const manager = result.value;
                const newSave = createTestSave(22222);
                const saveResult = await manager.addAutoSave("newCmdr", newSave);

                expect(saveResult).toBe(true);
                const cmdrSaves = await manager.getSavesForCmdr("newCmdr");
                expect(cmdrSaves?.auto).toHaveLength(1);
                expect(cmdrSaves?.auto[0]).toEqual(newSave);
                expect(cmdrSaves?.manual).toHaveLength(0);
            }
        });

        it("should limit auto saves to MAX_AUTO_SAVES and remove oldest", async () => {
            const starSystemDatabase = new StarSystemDatabase(getLoneStarSystem());
            // Create a cmdr with already 5 auto saves (at the limit)
            const initialData = {
                cmdr3: {
                    manual: [],
                    auto: [
                        createTestSave(5),
                        createTestSave(4),
                        createTestSave(3),
                        createTestSave(2),
                        createTestSave(1), // This should be removed when we add a new one
                    ],
                },
            };
            const backend = new MockSaveBackend(initialData);
            const result = await SaveManager.CreateAsync(backend, starSystemDatabase);

            expect(result.success).toBe(true);
            if (result.success) {
                const manager = result.value;
                const newSave = createTestSave(6);
                const saveResult = await manager.addAutoSave("cmdr3", newSave);

                expect(saveResult).toBe(true);
                const cmdrSaves = await manager.getSavesForCmdr("cmdr3");
                expect(cmdrSaves).toBeDefined();
                expect(cmdrSaves?.auto).toHaveLength(5); // Should still be 5
                expect(cmdrSaves?.auto[0]?.timestamp).toBe(6); // New save at beginning
                expect(cmdrSaves?.auto[4]?.timestamp).toBe(2); // Oldest remaining save
                // The save with timestamp 1 should be removed
                expect(cmdrSaves?.auto.find((save) => save.timestamp === 1)).toBeUndefined();
            }
        });

        it("should handle adding multiple auto saves and maintain limit", async () => {
            const starSystemDatabase = new StarSystemDatabase(getLoneStarSystem());
            const backend = new MockSaveBackend({});
            const result = await SaveManager.CreateAsync(backend, starSystemDatabase);

            expect(result.success).toBe(true);
            if (result.success) {
                const manager = result.value;

                // Add 7 auto saves (more than the limit of 5)
                for (let i = 1; i <= 7; i++) {
                    const saveResult = await manager.addAutoSave("testCmdr", createTestSave(i));
                    expect(saveResult).toBe(true);
                }

                const cmdrSaves = await manager.getSavesForCmdr("testCmdr");
                expect(cmdrSaves).toBeDefined();
                expect(cmdrSaves?.auto).toHaveLength(5); // Should be limited to 5

                if (cmdrSaves && cmdrSaves.auto.length >= 5) {
                    // Should contain saves 7, 6, 5, 4, 3 (most recent 5)
                    expect(cmdrSaves.auto[0]?.timestamp).toBe(7);
                    expect(cmdrSaves.auto[1]?.timestamp).toBe(6);
                    expect(cmdrSaves.auto[2]?.timestamp).toBe(5);
                    expect(cmdrSaves.auto[3]?.timestamp).toBe(4);
                    expect(cmdrSaves.auto[4]?.timestamp).toBe(3);

                    // Saves 1 and 2 should be removed
                    expect(cmdrSaves.auto.find((save) => save.timestamp === 1)).toBeUndefined();
                    expect(cmdrSaves.auto.find((save) => save.timestamp === 2)).toBeUndefined();
                }
            }
        });

        it("should handle backend write failures when adding auto save", async () => {
            const starSystemDatabase = new StarSystemDatabase(getLoneStarSystem());
            const backend = new MockSaveBackend(testSaves);
            backend.writeShouldFail = true;

            const result = await SaveManager.CreateAsync(backend, starSystemDatabase);
            expect(result.success).toBe(true);

            if (result.success) {
                const manager = result.value;
                const originalLength = (await manager.getSavesForCmdr("cmdr2"))?.auto.length ?? 0;
                const newSave = createTestSave(77777);
                const saveResult = await manager.addAutoSave("cmdr2", newSave);

                expect(saveResult).toBe(false);
                // Save should still be added to memory even if backend write fails
                const cmdrSaves = await manager.getSavesForCmdr("cmdr2");
                expect(cmdrSaves?.auto).toHaveLength(originalLength + 1);
                expect(cmdrSaves?.auto[0]?.timestamp).toBe(77777);
            }
        });
    });
});
