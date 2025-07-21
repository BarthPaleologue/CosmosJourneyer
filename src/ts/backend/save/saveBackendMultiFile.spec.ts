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

import { beforeEach, describe, expect, it } from "vitest";

import { SerializedPlayerSchema } from "@/backend/player/serializedPlayer";
import { getLoneStarSystem } from "@/backend/universe/customSystems/loneStar";
import { StarSystemDatabase } from "@/backend/universe/starSystemDatabase";

import { SaveBackendMultiFile, type IFileSystem } from "./saveBackendMultiFile";
import { type CmdrSaves, type Save } from "./saveFileData";

/**
 * Mock implementation of IFileSystem for testing
 */
class MockFileSystem implements IFileSystem {
    private files = new Map<string, string>();
    private directories = new Set<string>();

    constructor() {
        // Always have root directories
        this.directories.add("/");
        this.directories.add("/saves");
        this.directories.add("/corrupted");
    }

    public createDirectory(path: string): Promise<boolean> {
        // Create all parent directories
        const parts = path.split("/").filter(Boolean);
        let currentPath = "";
        for (const part of parts) {
            currentPath += "/" + part;
            this.directories.add(currentPath);
        }
        return Promise.resolve(true);
    }

    public deleteDirectory(path: string): Promise<boolean> {
        // Delete directory and all files within it
        for (const filePath of this.files.keys()) {
            if (filePath.startsWith(path + "/")) {
                this.files.delete(filePath);
            }
        }

        // Delete the directory and all subdirectories
        for (const dirPath of this.directories) {
            if (dirPath === path || dirPath.startsWith(path + "/")) {
                this.directories.delete(dirPath);
            }
        }

        return Promise.resolve(true);
    }

    public listDirectory(path: string): Promise<string[] | null> {
        if (!this.directories.has(path)) {
            return Promise.resolve(null);
        }

        const items = new Set<string>();

        // Add files in this directory
        for (const filePath of this.files.keys()) {
            if (filePath.startsWith(path + "/")) {
                const relativePath = filePath.substring(path.length + 1);
                const nextSlash = relativePath.indexOf("/");
                if (nextSlash === -1) {
                    // Direct file
                    items.add(relativePath);
                } else {
                    // File in subdirectory, add the subdirectory name
                    items.add(relativePath.substring(0, nextSlash));
                }
            }
        }

        // Add subdirectories
        for (const dirPath of this.directories) {
            if (dirPath.startsWith(path + "/") && dirPath !== path) {
                const relativePath = dirPath.substring(path.length + 1);
                const nextSlash = relativePath.indexOf("/");
                if (nextSlash === -1) {
                    // Direct subdirectory
                    items.add(relativePath);
                } else {
                    // Nested subdirectory, add the top-level name
                    items.add(relativePath.substring(0, nextSlash));
                }
            }
        }

        return Promise.resolve(Array.from(items).sort());
    }

    public directoryExists(path: string): Promise<boolean> {
        return Promise.resolve(this.directories.has(path));
    }

    public async writeFile(path: string, content: string): Promise<boolean> {
        // Ensure parent directory exists
        const parentDir = path.substring(0, path.lastIndexOf("/"));
        if (parentDir && !this.directories.has(parentDir)) {
            await this.createDirectory(parentDir);
        }

        this.files.set(path, content);
        return true;
    }

    public readFile(path: string): Promise<string | null> {
        const content = this.files.get(path);
        return Promise.resolve(content ?? null);
    }

    public deleteFile(path: string): Promise<boolean> {
        return Promise.resolve(this.files.delete(path));
    }

    public fileExists(path: string): Promise<boolean> {
        return Promise.resolve(this.files.has(path));
    }

    // Helper methods for testing
    public getAllFiles(): Record<string, string> {
        return Object.fromEntries(this.files);
    }

    public getAllDirectories(): string[] {
        return Array.from(this.directories).sort();
    }

    public clear(): void {
        this.files.clear();
        this.directories.clear();
        this.directories.add("/");
        this.directories.add("/saves");
        this.directories.add("/corrupted");
    }
}

describe("SaveBackendMultiFile", () => {
    let fileSystem: MockFileSystem;
    let starSystemDatabase: StarSystemDatabase;

    const cmdrUuid1 = "68ea941b-e163-4ec0-9039-76949d435a96";
    const cmdrUuid2 = "a8052d9f-1ccd-4d74-a17d-84f50b467745";

    const createTestSave = (timestamp: number, uuid?: string) => {
        return {
            uuid: uuid ?? crypto.randomUUID(),
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

    beforeEach(() => {
        fileSystem = new MockFileSystem();
        starSystemDatabase = new StarSystemDatabase(getLoneStarSystem());
    });

    describe("CreateAsync", () => {
        it("should create a SaveBackendMultiFile successfully", async () => {
            const result = await SaveBackendMultiFile.CreateAsync(fileSystem, starSystemDatabase);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toBeInstanceOf(SaveBackendMultiFile);
            }
        });

        it("should ensure saves directory exists", async () => {
            await SaveBackendMultiFile.CreateAsync(fileSystem, starSystemDatabase);
            expect(await fileSystem.directoryExists("/saves")).toBe(true);
        });
    });

    describe("getSavesForCmdr", () => {
        it("should return undefined for non-existent commander", async () => {
            const result = await SaveBackendMultiFile.CreateAsync(fileSystem, starSystemDatabase);
            expect(result.success).toBe(true);

            if (result.success) {
                const backend = result.value;
                const saves = await backend.getSavesForCmdr("nonexistent");
                expect(saves).toBeUndefined();
            }
        });

        it("should return empty saves for commander with no saves", async () => {
            // Create commander directory but no saves
            await fileSystem.createDirectory(`/saves/${cmdrUuid1}`);
            await fileSystem.createDirectory(`/saves/${cmdrUuid1}/manual`);
            await fileSystem.createDirectory(`/saves/${cmdrUuid1}/auto`);

            const result = await SaveBackendMultiFile.CreateAsync(fileSystem, starSystemDatabase);
            expect(result.success).toBe(true);

            if (result.success) {
                const backend = result.value;
                const saves = await backend.getSavesForCmdr(cmdrUuid1);
                expect(saves).toEqual({
                    manual: [],
                    auto: [],
                });
            }
        });

        it("should load and sort saves correctly", async () => {
            const save1 = createTestSave(1000, "save1");
            const save2 = createTestSave(2000, "save2");
            const save3 = createTestSave(1500, "save3");

            // Create saves manually in file system
            await fileSystem.createDirectory(`/saves/${cmdrUuid1}/manual`);
            await fileSystem.createDirectory(`/saves/${cmdrUuid1}/auto`);

            await fileSystem.writeFile(`/saves/${cmdrUuid1}/manual/save1.json`, JSON.stringify(save1));
            await fileSystem.writeFile(`/saves/${cmdrUuid1}/manual/save2.json`, JSON.stringify(save2));
            await fileSystem.writeFile(`/saves/${cmdrUuid1}/auto/save3.json`, JSON.stringify(save3));

            const result = await SaveBackendMultiFile.CreateAsync(fileSystem, starSystemDatabase);
            expect(result.success).toBe(true);

            if (result.success) {
                const backend = result.value;
                const saves = await backend.getSavesForCmdr(cmdrUuid1);
                expect(saves).toBeDefined();

                if (saves) {
                    // Should be sorted by timestamp (newest first)
                    expect(saves.manual).toHaveLength(2);
                    expect(saves.manual[0]?.timestamp).toBe(2000); // save2
                    expect(saves.manual[1]?.timestamp).toBe(1000); // save1

                    expect(saves.auto).toHaveLength(1);
                    expect(saves.auto[0]?.timestamp).toBe(1500); // save3
                }
            }
        });

        it("should quarantine corrupted saves", async () => {
            // Create a corrupted save file
            await fileSystem.createDirectory(`/saves/${cmdrUuid1}/manual`);
            await fileSystem.writeFile(`/saves/${cmdrUuid1}/manual/corrupted.json`, "invalid json");

            const result = await SaveBackendMultiFile.CreateAsync(fileSystem, starSystemDatabase);
            expect(result.success).toBe(true);

            if (result.success) {
                const backend = result.value;
                const saves = await backend.getSavesForCmdr(cmdrUuid1);

                // Corrupted save should not be in the results
                expect(saves).toEqual({
                    manual: [],
                    auto: [],
                });

                // Corrupted save should be tracked
                const corruptedSaves = backend.getCorruptedSaves();
                expect(corruptedSaves).toHaveLength(1);
                expect(corruptedSaves[0]?.filePath).toBe(
                    "/saves/68ea941b-e163-4ec0-9039-76949d435a96/manual/corrupted.json",
                );

                // Original file should be deleted
                expect(await fileSystem.fileExists(`/saves/${cmdrUuid1}/manual/corrupted.json`)).toBe(false);

                // Corrupted file should be in quarantine
                expect(await fileSystem.fileExists(`/corrupted/${cmdrUuid1}/manual/corrupted.json`)).toBe(true);
            }
        });
    });

    describe("addManualSave", () => {
        it("should add a manual save successfully", async () => {
            const result = await SaveBackendMultiFile.CreateAsync(fileSystem, starSystemDatabase);
            expect(result.success).toBe(true);

            if (result.success) {
                const backend = result.value;
                const save = createTestSave(1000);

                const success = await backend.addManualSave(cmdrUuid1, save);
                expect(success).toBe(true);

                // Verify save was written to file system
                const saveContent = await fileSystem.readFile(`/saves/${cmdrUuid1}/manual/${save.uuid}.json`);
                expect(saveContent).toBe(JSON.stringify(save));

                // Verify save can be retrieved
                const saves = await backend.getSavesForCmdr(cmdrUuid1);
                expect(saves?.manual).toHaveLength(1);
                expect(saves?.manual[0]).toEqual(save);
            }
        });

        it("should refuse to add duplicate save", async () => {
            const result = await SaveBackendMultiFile.CreateAsync(fileSystem, starSystemDatabase);
            expect(result.success).toBe(true);

            if (result.success) {
                const backend = result.value;
                const save = createTestSave(1000);

                // Add save first time
                const success1 = await backend.addManualSave(cmdrUuid1, save);
                expect(success1).toBe(true);

                // Try to add same save again
                const success2 = await backend.addManualSave(cmdrUuid1, save);
                expect(success2).toBe(false);

                // Should still only have one save
                const saves = await backend.getSavesForCmdr(cmdrUuid1);
                expect(saves?.manual).toHaveLength(1);
            }
        });

        it("should create commander directories if they don't exist", async () => {
            const result = await SaveBackendMultiFile.CreateAsync(fileSystem, starSystemDatabase);
            expect(result.success).toBe(true);

            if (result.success) {
                const backend = result.value;
                const save = createTestSave(1000);

                // Verify directories don't exist yet
                expect(await fileSystem.directoryExists(`/saves/${cmdrUuid1}`)).toBe(false);

                const success = await backend.addManualSave(cmdrUuid1, save);
                expect(success).toBe(true);

                // Verify directories were created
                expect(await fileSystem.directoryExists(`/saves/${cmdrUuid1}`)).toBe(true);
                expect(await fileSystem.directoryExists(`/saves/${cmdrUuid1}/manual`)).toBe(true);
            }
        });
    });

    describe("addAutoSave", () => {
        it("should add an auto save successfully", async () => {
            const result = await SaveBackendMultiFile.CreateAsync(fileSystem, starSystemDatabase);
            expect(result.success).toBe(true);

            if (result.success) {
                const backend = result.value;
                const save = createTestSave(1000);

                const success = await backend.addAutoSave(cmdrUuid1, save);
                expect(success).toBe(true);

                // Verify save was written to file system
                const saveContent = await fileSystem.readFile(`/saves/${cmdrUuid1}/auto/${save.uuid}.json`);
                expect(saveContent).toBe(JSON.stringify(save));

                // Verify save can be retrieved
                const saves = await backend.getSavesForCmdr(cmdrUuid1);
                expect(saves?.auto).toHaveLength(1);
                expect(saves?.auto[0]).toEqual(save);
            }
        });

        it("should limit auto saves to MAX_AUTO_SAVES and remove oldest", async () => {
            const result = await SaveBackendMultiFile.CreateAsync(fileSystem, starSystemDatabase);
            expect(result.success).toBe(true);

            if (result.success) {
                const backend = result.value;

                // Add 7 auto saves (more than the limit of 5)
                const saves: Save[] = [];
                for (let i = 1; i <= 7; i++) {
                    const save = createTestSave(i * 1000);
                    saves.push(save);
                    const success = await backend.addAutoSave(cmdrUuid1, save);
                    expect(success).toBe(true);
                }

                // Should only have the 5 most recent saves
                const cmdrSaves = await backend.getSavesForCmdr(cmdrUuid1);
                expect(cmdrSaves?.auto).toHaveLength(5);

                if (cmdrSaves && cmdrSaves.auto.length >= 5) {
                    // Should contain saves 7, 6, 5, 4, 3 (most recent 5)
                    expect(cmdrSaves.auto[0]?.timestamp).toBe(7000);
                    expect(cmdrSaves.auto[1]?.timestamp).toBe(6000);
                    expect(cmdrSaves.auto[2]?.timestamp).toBe(5000);
                    expect(cmdrSaves.auto[3]?.timestamp).toBe(4000);
                    expect(cmdrSaves.auto[4]?.timestamp).toBe(3000);
                }

                // Oldest saves should be deleted from file system
                expect(await fileSystem.fileExists(`/saves/${cmdrUuid1}/auto/${saves[0]?.uuid}.json`)).toBe(false);
                expect(await fileSystem.fileExists(`/saves/${cmdrUuid1}/auto/${saves[1]?.uuid}.json`)).toBe(false);
            }
        });

        it("should refuse to add duplicate save", async () => {
            const result = await SaveBackendMultiFile.CreateAsync(fileSystem, starSystemDatabase);
            expect(result.success).toBe(true);

            if (result.success) {
                const backend = result.value;
                const save = createTestSave(1000);

                // Add save first time
                const success1 = await backend.addAutoSave(cmdrUuid1, save);
                expect(success1).toBe(true);

                // Try to add same save again
                const success2 = await backend.addAutoSave(cmdrUuid1, save);
                expect(success2).toBe(false);

                // Should still only have one save
                const saves = await backend.getSavesForCmdr(cmdrUuid1);
                expect(saves?.auto).toHaveLength(1);
            }
        });
    });

    describe("deleteSaveForCmdr", () => {
        it("should delete manual save successfully", async () => {
            const result = await SaveBackendMultiFile.CreateAsync(fileSystem, starSystemDatabase);
            expect(result.success).toBe(true);

            if (result.success) {
                const backend = result.value;
                const save = createTestSave(1000);

                // Add save
                await backend.addManualSave(cmdrUuid1, save);
                expect(await fileSystem.fileExists(`/saves/${cmdrUuid1}/manual/${save.uuid}.json`)).toBe(true);

                // Delete save
                const success = await backend.deleteSaveForCmdr(cmdrUuid1, save.uuid);
                expect(success).toBe(true);

                // Verify save was deleted
                expect(await fileSystem.fileExists(`/saves/${cmdrUuid1}/manual/${save.uuid}.json`)).toBe(false);

                const saves = await backend.getSavesForCmdr(cmdrUuid1);
                expect(saves?.manual).toHaveLength(0);
            }
        });

        it("should delete auto save successfully", async () => {
            const result = await SaveBackendMultiFile.CreateAsync(fileSystem, starSystemDatabase);
            expect(result.success).toBe(true);

            if (result.success) {
                const backend = result.value;
                const save = createTestSave(1000);

                // Add save
                await backend.addAutoSave(cmdrUuid1, save);
                expect(await fileSystem.fileExists(`/saves/${cmdrUuid1}/auto/${save.uuid}.json`)).toBe(true);

                // Delete save
                const success = await backend.deleteSaveForCmdr(cmdrUuid1, save.uuid);
                expect(success).toBe(true);

                // Verify save was deleted
                expect(await fileSystem.fileExists(`/saves/${cmdrUuid1}/auto/${save.uuid}.json`)).toBe(false);

                const saves = await backend.getSavesForCmdr(cmdrUuid1);
                expect(saves?.auto).toHaveLength(0);
            }
        });

        it("should return false for non-existent save", async () => {
            const result = await SaveBackendMultiFile.CreateAsync(fileSystem, starSystemDatabase);
            expect(result.success).toBe(true);

            if (result.success) {
                const backend = result.value;
                const success = await backend.deleteSaveForCmdr(cmdrUuid1, "nonexistent");
                expect(success).toBe(false);
            }
        });
    });

    describe("deleteCmdr", () => {
        it("should delete commander and all saves", async () => {
            const result = await SaveBackendMultiFile.CreateAsync(fileSystem, starSystemDatabase);
            expect(result.success).toBe(true);

            if (result.success) {
                const backend = result.value;

                // Add some saves
                await backend.addManualSave(cmdrUuid1, createTestSave(1000));
                await backend.addAutoSave(cmdrUuid1, createTestSave(2000));

                // Verify commander exists
                expect(await fileSystem.directoryExists(`/saves/${cmdrUuid1}`)).toBe(true);

                // Delete commander
                const success = await backend.deleteCmdr(cmdrUuid1);
                expect(success).toBe(true);

                // Verify commander directory was deleted
                expect(await fileSystem.directoryExists(`/saves/${cmdrUuid1}`)).toBe(false);

                // Verify saves are gone
                const saves = await backend.getSavesForCmdr(cmdrUuid1);
                expect(saves).toBeUndefined();
            }
        });
    });

    describe("getCmdrUuids", () => {
        it("should return empty array when no commanders exist", async () => {
            const result = await SaveBackendMultiFile.CreateAsync(fileSystem, starSystemDatabase);
            expect(result.success).toBe(true);

            if (result.success) {
                const backend = result.value;
                const uuids = await backend.getCmdrUuids();
                expect(uuids).toEqual([]);
            }
        });

        it("should return all commander UUIDs", async () => {
            const result = await SaveBackendMultiFile.CreateAsync(fileSystem, starSystemDatabase);
            expect(result.success).toBe(true);

            if (result.success) {
                const backend = result.value;

                // Add saves for two commanders
                await backend.addManualSave(cmdrUuid1, createTestSave(1000));
                await backend.addManualSave(cmdrUuid2, createTestSave(2000));

                const uuids = await backend.getCmdrUuids();
                expect(uuids).toHaveLength(2);
                expect(uuids).toContain(cmdrUuid1);
                expect(uuids).toContain(cmdrUuid2);
            }
        });
    });

    describe("importSaves", () => {
        it("should import saves successfully", async () => {
            const result = await SaveBackendMultiFile.CreateAsync(fileSystem, starSystemDatabase);
            expect(result.success).toBe(true);

            if (result.success) {
                const backend = result.value;

                const savesToImport = {
                    [cmdrUuid1]: {
                        manual: [createTestSave(1000), createTestSave(2000)],
                        auto: [createTestSave(3000)],
                    },
                    [cmdrUuid2]: {
                        manual: [createTestSave(4000)],
                        auto: [],
                    },
                } satisfies Record<string, CmdrSaves>;

                const success = await backend.importSaves(savesToImport);
                expect(success).toBe(true);

                // Verify all saves were imported
                const cmdr1Saves = await backend.getSavesForCmdr(cmdrUuid1);
                expect(cmdr1Saves?.manual).toHaveLength(2);
                expect(cmdr1Saves?.auto).toHaveLength(1);

                const cmdr2Saves = await backend.getSavesForCmdr(cmdrUuid2);
                expect(cmdr2Saves?.manual).toHaveLength(1);
                expect(cmdr2Saves?.auto).toHaveLength(0);
            }
        });
    });

    describe("exportSaves", () => {
        it("should export all saves", async () => {
            const result = await SaveBackendMultiFile.CreateAsync(fileSystem, starSystemDatabase);
            expect(result.success).toBe(true);

            if (result.success) {
                const backend = result.value;

                // Add some saves
                const save1 = createTestSave(1000);
                const save2 = createTestSave(2000);
                const save3 = createTestSave(3000);

                await backend.addManualSave(cmdrUuid1, save1);
                await backend.addAutoSave(cmdrUuid1, save2);
                await backend.addManualSave(cmdrUuid2, save3);

                const exported = await backend.exportSaves();

                expect(Object.keys(exported)).toHaveLength(2);
                expect(exported[cmdrUuid1]?.manual).toHaveLength(1);
                expect(exported[cmdrUuid1]?.auto).toHaveLength(1);
                expect(exported[cmdrUuid2]?.manual).toHaveLength(1);
                expect(exported[cmdrUuid2]?.auto).toHaveLength(0);
            }
        });

        it("should return empty object when no saves exist", async () => {
            const result = await SaveBackendMultiFile.CreateAsync(fileSystem, starSystemDatabase);
            expect(result.success).toBe(true);

            if (result.success) {
                const backend = result.value;
                const exported = await backend.exportSaves();
                expect(exported).toEqual({});
            }
        });
    });
});
