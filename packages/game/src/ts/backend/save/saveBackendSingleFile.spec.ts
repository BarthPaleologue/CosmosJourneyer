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

import { SerializedPlayerSchema } from "@/backend/player/serializedPlayer";
import { getLoneStarSystem } from "@/backend/universe/customSystems/loneStar";
import { UniverseBackend } from "@/backend/universe/universeBackend";

import { SaveBackendSingleFile, type IFile } from "./saveBackendSingleFile";
import { type CmdrSaves, type Save } from "./saveFileData";
import { SaveLoadingErrorType } from "./saveLoadingError";

/**
 * Mock implementation of SaveBackend for testing
 */
class MockSaveBackend implements IFile {
    private mockData = "{}";

    constructor(initialData?: string) {
        if (initialData !== undefined) {
            this.mockData = initialData;
        }
    }

    public write(content: string): Promise<boolean> {
        this.mockData = content;
        return Promise.resolve(true);
    }

    public read(): Promise<string | null> {
        return Promise.resolve(this.mockData);
    }
}

describe("SaveManager", () => {
    const cmdrUuid1 = "68ea941b-e163-4ec0-9039-76949d435a96";
    const cmdrUuid2 = "a8052d9f-1ccd-4d74-a17d-84f50b467745";
    const testSaves = {
        [cmdrUuid1]: {
            manual: [
                {
                    uuid: "3e9bb421-7779-4c16-920f-42aeafd160aa",
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
        [cmdrUuid2]: {
            manual: [],
            auto: [
                {
                    uuid: "b8c69a25-4aba-4358-b131-7949923e55f9",
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
    } as const satisfies Record<string, CmdrSaves>;

    const createTestSave = (timestamp: number) => {
        return {
            uuid: crypto.randomUUID(),
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
        } satisfies Save;
    };

    describe("Create", () => {
        it("should create a SaveManager with existing saves", async () => {
            const universeBackend = new UniverseBackend(getLoneStarSystem());
            const backend = new MockSaveBackend(JSON.stringify(testSaves));
            const backupBackend = new MockSaveBackend();
            const result = await SaveBackendSingleFile.CreateAsync(backend, backupBackend, universeBackend);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(await result.value.getSavesForCmdr(cmdrUuid1)).toEqual(testSaves[cmdrUuid1]);
                expect(await result.value.getSavesForCmdr(cmdrUuid2)).toEqual(testSaves[cmdrUuid2]);
            }
        });

        it("should create a SaveManager with empty saves", async () => {
            const universeBackend = new UniverseBackend(getLoneStarSystem());
            const backend = new MockSaveBackend();
            const backupBackend = new MockSaveBackend();
            const result = await SaveBackendSingleFile.CreateAsync(backend, backupBackend, universeBackend);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(await result.value.getSavesForCmdr(cmdrUuid1)).toBeUndefined();
            }
        });

        it("should handle read errors", async () => {
            const universeBackend = new UniverseBackend(getLoneStarSystem());
            const backend = new MockSaveBackend("invalid json data");
            const backupBackend = new MockSaveBackend();
            const result = await SaveBackendSingleFile.CreateAsync(backend, backupBackend, universeBackend);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toEqual({ type: SaveLoadingErrorType.INVALID_JSON });
            }
        });

        it("should assign unique timestamps when they are missing", async () => {
            const universeBackend = new UniverseBackend(getLoneStarSystem());
            const { timestamp: firstTimestampValue, ...manualSaveWithoutTimestamp1 } = createTestSave(0);
            void firstTimestampValue;
            const { timestamp: secondTimestampValue, ...manualSaveWithoutTimestamp2 } = createTestSave(0);
            void secondTimestampValue;

            const backend = new MockSaveBackend(
                JSON.stringify({
                    [cmdrUuid1]: {
                        manual: [manualSaveWithoutTimestamp1, manualSaveWithoutTimestamp2],
                        auto: [],
                    },
                }),
            );
            const backupBackend = new MockSaveBackend();

            const firstTimestamp = 1_000_000;
            const secondTimestamp = 2_000_000;
            const nowSpy = vi.spyOn(Date, "now");
            nowSpy
                .mockImplementationOnce(() => firstTimestamp)
                .mockImplementationOnce(() => secondTimestamp)
                .mockImplementation(() => secondTimestamp + 1);

            try {
                const result = await SaveBackendSingleFile.CreateAsync(backend, backupBackend, universeBackend);

                expect(result.success).toBe(true);
                if (result.success) {
                    const saves = await result.value.getSavesForCmdr(cmdrUuid1);
                    expect(saves).toBeDefined();
                    if (saves !== undefined) {
                        expect(saves.manual).toHaveLength(2);
                        expect(saves.manual[0]?.timestamp).toBe(firstTimestamp);
                        expect(saves.manual[1]?.timestamp).toBe(secondTimestamp);
                        expect(saves.manual[0]?.timestamp).not.toEqual(saves.manual[1]?.timestamp);
                    }
                }
            } finally {
                nowSpy.mockRestore();
            }
        });
    });

    describe("getSavesForCmdr", () => {
        it("should return saves for an existing cmdr", async () => {
            const universeBackend = new UniverseBackend(getLoneStarSystem());
            const backend = new MockSaveBackend(JSON.stringify(testSaves));
            const backupBackend = new MockSaveBackend();
            const result = await SaveBackendSingleFile.CreateAsync(backend, backupBackend, universeBackend);

            expect(result.success).toBe(true);
            if (result.success) {
                const manager = result.value;
                expect(await manager.getSavesForCmdr(cmdrUuid1)).toEqual(testSaves[cmdrUuid1]);
            }
        });

        it("should return undefined for a non-existent cmdr", async () => {
            const universeBackend = new UniverseBackend(getLoneStarSystem());
            const backend = new MockSaveBackend(JSON.stringify(testSaves));
            const backupBackend = new MockSaveBackend();
            const result = await SaveBackendSingleFile.CreateAsync(backend, backupBackend, universeBackend);

            expect(result.success).toBe(true);
            if (result.success) {
                const manager = result.value;
                expect(await manager.getSavesForCmdr("nonexistent")).toBeUndefined();
            }
        });
    });

    describe("addManualSave", () => {
        it("should add a manual save to an existing cmdr", async () => {
            const universeBackend = new UniverseBackend(getLoneStarSystem());
            const backend = new MockSaveBackend(JSON.stringify(testSaves));
            const backupBackend = new MockSaveBackend();
            const result = await SaveBackendSingleFile.CreateAsync(backend, backupBackend, universeBackend);

            expect(result.success).toBe(true);
            if (result.success) {
                const manager = result.value;
                const newSave = createTestSave(99999);
                const originalLength = (await manager.getSavesForCmdr(cmdrUuid1))?.manual.length ?? 0;
                const saveResult = await manager.addManualSave(cmdrUuid1, newSave);

                expect(saveResult).toBe(true);
                const cmdrSaves = await manager.getSavesForCmdr(cmdrUuid1);
                expect(cmdrSaves).toBeDefined();
                expect(cmdrSaves?.manual).toHaveLength(originalLength + 1);
                expect(cmdrSaves?.manual[0]?.timestamp).toBe(99999); // Should be at the beginning (unshift)
                if (cmdrSaves && originalLength > 0) {
                    expect(cmdrSaves.manual[1]?.timestamp).toBe(testSaves[cmdrUuid1].manual[0].timestamp); // Original save should be second
                }
            }
        });

        it("should create new cmdr saves when adding manual save to non-existent cmdr", async () => {
            const universeBackend = new UniverseBackend(getLoneStarSystem());
            const backend = new MockSaveBackend();
            const backupBackend = new MockSaveBackend();
            const result = await SaveBackendSingleFile.CreateAsync(backend, backupBackend, universeBackend);

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
    });

    describe("addAutoSave", () => {
        it("should add an auto save to an existing cmdr", async () => {
            const universeBackend = new UniverseBackend(getLoneStarSystem());
            const backend = new MockSaveBackend(JSON.stringify(testSaves));
            const backupBackend = new MockSaveBackend();
            const result = await SaveBackendSingleFile.CreateAsync(backend, backupBackend, universeBackend);

            expect(result.success).toBe(true);
            if (result.success) {
                const cmdrUuid = "676a0451-d081-4ad7-a18c-285ea7a98e8e";
                const manager = result.value;
                const newSave = createTestSave(88888);
                const originalLength = (await manager.getSavesForCmdr(cmdrUuid))?.auto.length ?? 0;
                const saveResult = await manager.addAutoSave(cmdrUuid, newSave);

                expect(saveResult).toBe(true);
                const cmdrSaves = await manager.getSavesForCmdr(cmdrUuid);
                expect(cmdrSaves).toBeDefined();
                expect(cmdrSaves?.auto).toHaveLength(originalLength + 1);
                expect(cmdrSaves?.auto[0]?.timestamp).toBe(88888); // Should be at the beginning (unshift)
                if (cmdrSaves && originalLength > 0) {
                    expect(cmdrSaves.auto[1]?.timestamp).toBe(testSaves[cmdrUuid2].auto[0].timestamp); // Original save should be second
                }
            }
        });

        it("should create new cmdr saves when adding auto save to non-existent cmdr", async () => {
            const universeBackend = new UniverseBackend(getLoneStarSystem());
            const backend = new MockSaveBackend();
            const backupBackend = new MockSaveBackend();
            const result = await SaveBackendSingleFile.CreateAsync(backend, backupBackend, universeBackend);

            expect(result.success).toBe(true);
            if (result.success) {
                const cmdrUuid = "c6c25aa0-ef6a-42c4-a780-1e794e3b2676";
                const manager = result.value;
                const newSave = createTestSave(22222);
                const saveResult = await manager.addAutoSave(cmdrUuid, newSave);

                expect(saveResult).toBe(true);
                const cmdrSaves = await manager.getSavesForCmdr(cmdrUuid);
                expect(cmdrSaves?.auto).toHaveLength(1);
                expect(cmdrSaves?.auto[0]).toEqual(newSave);
                expect(cmdrSaves?.manual).toHaveLength(0);
            }
        });

        it("should limit auto saves to MAX_AUTO_SAVES and remove oldest", async () => {
            const universeBackend = new UniverseBackend(getLoneStarSystem());
            // Create a cmdr with already 5 auto saves (at the limit)
            const cmdrUuid = "7471ef79-7a4a-4b82-9779-44bb43e9ad66";
            const initialData = {
                [cmdrUuid]: {
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
            const backend = new MockSaveBackend(JSON.stringify(initialData));
            const backupBackend = new MockSaveBackend();
            const result = await SaveBackendSingleFile.CreateAsync(backend, backupBackend, universeBackend);

            expect(result.success).toBe(true);
            if (result.success) {
                const manager = result.value;
                const newSave = createTestSave(6);
                const saveResult = await manager.addAutoSave(cmdrUuid, newSave);

                expect(saveResult).toBe(true);
                const cmdrSaves = await manager.getSavesForCmdr(cmdrUuid);
                expect(cmdrSaves).toBeDefined();
                expect(cmdrSaves?.auto).toHaveLength(5); // Should still be 5
                expect(cmdrSaves?.auto[0]?.timestamp).toBe(6); // New save at beginning
                expect(cmdrSaves?.auto[4]?.timestamp).toBe(2); // Oldest remaining save
                // The save with timestamp 1 should be removed
                expect(cmdrSaves?.auto.find((save) => save.timestamp === 1)).toBeUndefined();
            }
        });

        it("should handle adding multiple auto saves and maintain limit", async () => {
            const universeBackend = new UniverseBackend(getLoneStarSystem());
            const backend = new MockSaveBackend();
            const backupBackend = new MockSaveBackend();
            const result = await SaveBackendSingleFile.CreateAsync(backend, backupBackend, universeBackend);

            expect(result.success).toBe(true);
            if (result.success) {
                const manager = result.value;
                const cmdrUuid = "64db79f4-1f3d-4c85-82d3-49c55590b4c2";

                // Add 7 auto saves (more than the limit of 5)
                for (let i = 1; i <= 7; i++) {
                    const saveResult = await manager.addAutoSave(cmdrUuid, createTestSave(i));
                    expect(saveResult).toBe(true);
                }

                const cmdrSaves = await manager.getSavesForCmdr(cmdrUuid);
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
    });
});
