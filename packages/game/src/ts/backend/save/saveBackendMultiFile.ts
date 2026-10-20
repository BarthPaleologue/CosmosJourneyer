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

import { err, ok } from "@cosmos-journeyer/typescript";
import type { DeepReadonly, Result } from "@cosmos-journeyer/typescript";

import { jsonSafeParse } from "@/utils/json";

import { Settings } from "@/settings";

import type { ISaveBackend } from "./saveBackend";
import { safeParseSave } from "./saveFileData";
import type { CmdrSaves, Save } from "./saveFileData";
import type { SaveLoadingError } from "./saveLoadingError";

/**
 */
export interface IFileSystem {
    /**
     * @param path - The directory path to create
     * @returns Boolean indicating success or failure.
     */
    createDirectory(path: string): Promise<boolean>;

    /**
     * @param path - The directory path to delete
     * @returns Boolean indicating success or failure.
     */
    deleteDirectory(path: string): Promise<boolean>;

    /**
     * @param path - The directory path to list
     * @returns Array of file/directory names, or null if directory doesn't exist.
     */
    listDirectory(path: string): Promise<Array<string> | null>;

    /**
     * @param path - The directory path to check
     * @returns Boolean indicating if directory exists.
     */
    directoryExists(path: string): Promise<boolean>;

    /**
     * @param path - The file path to write to
     * @param content - The content to write
     * @returns Boolean indicating success or failure.
     */
    writeFile(path: string, content: string): Promise<boolean>;

    /**
     * @param path - The file path to read from
     * @returns File content or null if file doesn't exist.
     */
    readFile(path: string): Promise<string | null>;

    /**
     * @param path - The file path to delete
     * @returns Boolean indicating success or failure.
     */
    deleteFile(path: string): Promise<boolean>;

    /**
     * @param path - The file path to check
     * @returns Boolean indicating if file exists.
     */
    fileExists(path: string): Promise<boolean>;
}

/**
 * Information about a corrupted save file.
 */
interface CorruptedSave {
    filePath: string;
    error: unknown;
    rawContent: string;
}

/**
 * Implements save storage using multiple files in OPFS.
 * Each commander has their own directory with separate files for each save.
 */
export class SaveBackendMultiFile implements ISaveBackend {
    private readonly fileSystem: IFileSystem;
    private readonly corruptedSaves: CorruptedSave[] = [];

    private static readonly SAVES_DIR = "/saves";

    /**
     * @param fileSystem - Storage adapter used for commander directories and save files.
     */
    private constructor(fileSystem: IFileSystem) {
        this.fileSystem = fileSystem;
    }

    /**
     * @param fileSystem - The file system interface to use
     * @returns Result containing either the created SaveBackendMultiFile or an error.
     */
    public static async CreateAsync(fileSystem: IFileSystem): Promise<Result<SaveBackendMultiFile, SaveLoadingError>> {
        try {
            // Ensure the saves directory exists
            await fileSystem.createDirectory(SaveBackendMultiFile.SAVES_DIR);
            return ok(new SaveBackendMultiFile(fileSystem));
        } catch (error) {
            console.error("Failed to create SaveBackendMultiFile:", error);
            // For file system initialization errors, we use INVALID_JSON as a generic failure
            return err({ type: "INVALID_JSON" });
        }
    }

    /**
     * @returns Array of corrupted save information.
     */
    public getCorruptedSaves(): Array<CorruptedSave> {
        return [...this.corruptedSaves];
    }

    /**
     * @param filePath - Path to the save file
     * @returns The loaded save or null if corrupted/missing.
     */
    private async loadSaveFile(filePath: string): Promise<Result<Save, SaveLoadingError>> {
        const content = await this.fileSystem.readFile(filePath);
        if (content === null) {
            return err({ type: "SAVE_NOT_FOUND" });
        }

        const saveJson = jsonSafeParse(content);
        if (saveJson === null) {
            this.corruptedSaves.push({
                filePath,
                error: "invalid json",
                rawContent: content,
            });
            await this.quarantineCorruptedSave(filePath);
            return err({ type: "INVALID_JSON" });
        }

        const saveResult = safeParseSave(saveJson);
        if (!saveResult.success) {
            this.corruptedSaves.push({
                filePath,
                error: saveResult.error,
                rawContent: content,
            });
            await this.quarantineCorruptedSave(filePath);
        }

        return saveResult;
    }

    /**
     * Moves a corrupted save file to quarantine.
     * @param filePath - Path to the corrupted save file
     */
    private async quarantineCorruptedSave(filePath: string): Promise<void> {
        try {
            const content = await this.fileSystem.readFile(filePath);
            if (content !== null) {
                const quarantinePath = filePath.replace("/saves/", "/corrupted/");
                const quarantineDir = quarantinePath.substring(0, quarantinePath.lastIndexOf("/"));

                await this.fileSystem.createDirectory(quarantineDir);
                await this.fileSystem.writeFile(quarantinePath, content);
            }
            await this.fileSystem.deleteFile(filePath);
        } catch (error) {
            console.error(`Failed to quarantine corrupted save: ${filePath}`, error);
        }
    }

    /**
     * @param cmdrUuid - The commander UUID
     * @returns The commander's saves or undefined if none exist.
     */
    public async getSavesForCmdr(cmdrUuid: string): Promise<CmdrSaves | undefined> {
        const cmdrDir = `${SaveBackendMultiFile.SAVES_DIR}/${cmdrUuid}`;

        if (!(await this.fileSystem.directoryExists(cmdrDir))) {
            return undefined;
        }

        const manualSaves: Save[] = [];
        const autoSaves: Save[] = [];

        // Load manual saves
        const manualDir = `${cmdrDir}/manual`;
        const manualFiles = await this.fileSystem.listDirectory(manualDir);
        if (manualFiles !== null) {
            for (const fileName of manualFiles) {
                const saveResult = await this.loadSaveFile(`${manualDir}/${fileName}`);
                if (!saveResult.success) {
                    continue;
                }

                manualSaves.push(saveResult.value);
            }
        }

        // Load auto saves
        const autoDir = `${cmdrDir}/auto`;
        const autoFiles = await this.fileSystem.listDirectory(autoDir);
        if (autoFiles !== null) {
            for (const fileName of autoFiles) {
                const saveResult = await this.loadSaveFile(`${autoDir}/${fileName}`);
                if (!saveResult.success) {
                    continue;
                }

                autoSaves.push(saveResult.value);
            }
        }

        // Sort by timestamp (newest first)
        manualSaves.sort((a, b) => b.timestamp - a.timestamp);
        autoSaves.sort((a, b) => b.timestamp - a.timestamp);

        return {
            manual: manualSaves,
            auto: autoSaves,
        };
    }

    /**
     * @param cmdrUuid - The commander UUID
     * @param saveUuid - The save UUID to delete
     * @returns Boolean indicating success.
     */
    public async deleteSaveForCmdr(cmdrUuid: string, saveUuid: string): Promise<boolean> {
        const cmdrDir = `${SaveBackendMultiFile.SAVES_DIR}/${cmdrUuid}`;

        // Try to delete from manual saves
        const manualPath = `${cmdrDir}/manual/${saveUuid}.json`;
        if (await this.fileSystem.fileExists(manualPath)) {
            return await this.fileSystem.deleteFile(manualPath);
        }

        // Try to delete from auto saves
        const autoPath = `${cmdrDir}/auto/${saveUuid}.json`;
        if (await this.fileSystem.fileExists(autoPath)) {
            return await this.fileSystem.deleteFile(autoPath);
        }

        return false; // Save not found
    }

    /**
     * @param cmdrUuid - The commander UUID
     * @returns Boolean indicating success.
     */
    public async deleteCmdr(cmdrUuid: string): Promise<boolean> {
        const cmdrDir = `${SaveBackendMultiFile.SAVES_DIR}/${cmdrUuid}`;
        return await this.fileSystem.deleteDirectory(cmdrDir);
    }

    /**
     * Lists commanders that have at least one readable manual or automatic save.
     * @returns UUIDs of commanders with saved data; missing saves directories produce an empty list.
     */
    public async getCmdrUuids(): Promise<Array<string>> {
        const savesDir = SaveBackendMultiFile.SAVES_DIR;
        if (!(await this.fileSystem.directoryExists(savesDir))) {
            return [];
        }

        const entries = await this.fileSystem.listDirectory(savesDir);
        if (entries === null) {
            return [];
        }

        const cmdrUuids: string[] = [];
        for (const entry of entries) {
            const cmdrSaves = await this.getSavesForCmdr(entry);
            if (cmdrSaves === undefined) {
                continue;
            }

            if (cmdrSaves.manual.length > 0 || cmdrSaves.auto.length > 0) {
                cmdrUuids.push(entry);
            }
        }

        return cmdrUuids;
    }

    /**
     * Writes a manual save under the commander's manual-save directory.
     * @param cmdrUuid - Commander UUID used to select the save directory.
     * @param save - Save snapshot to serialize as JSON.
     * @returns `false` if that UUID already exists; otherwise whether the file write succeeded.
     */
    public async addManualSave(cmdrUuid: string, save: DeepReadonly<Save>): Promise<boolean> {
        const cmdrDir = `${SaveBackendMultiFile.SAVES_DIR}/${cmdrUuid}`;
        const manualDir = `${cmdrDir}/manual`;

        // Create directories if they don't exist
        await this.fileSystem.createDirectory(cmdrDir);
        await this.fileSystem.createDirectory(manualDir);

        // Check if save already exists
        const savePath = `${manualDir}/${save.uuid}.json`;
        if (await this.fileSystem.fileExists(savePath)) {
            return false; // Save already exists
        }

        // Write the save file
        return await this.fileSystem.writeFile(savePath, JSON.stringify(save));
    }

    /**
     * Writes an automatic save and prunes older automatic saves after a successful write.
     * @param cmdrUuid - Commander UUID used to select the save directory.
     * @param save - Save snapshot to serialize as JSON.
     * @returns `false` if the UUID already exists or writing fails; otherwise `true` after cleanup.
     */
    public async addAutoSave(cmdrUuid: string, save: DeepReadonly<Save>): Promise<boolean> {
        const cmdrDir = `${SaveBackendMultiFile.SAVES_DIR}/${cmdrUuid}`;
        const autoDir = `${cmdrDir}/auto`;

        // Create directories if they don't exist
        await this.fileSystem.createDirectory(cmdrDir);
        await this.fileSystem.createDirectory(autoDir);

        // Check if save already exists
        const savePath = `${autoDir}/${save.uuid}.json`;
        if (await this.fileSystem.fileExists(savePath)) {
            return false; // Save already exists
        }

        // Write the new save file
        const writeSuccess = await this.fileSystem.writeFile(savePath, JSON.stringify(save));
        if (!writeSuccess) {
            return false;
        }

        // Immediate cleanup - enforce auto save limit
        await this.cleanupAutoSaves(cmdrUuid);

        return true;
    }

    /**
     * @param cmdrUuid - The commander UUID
     */
    private async cleanupAutoSaves(cmdrUuid: string): Promise<void> {
        const autoDir = `${SaveBackendMultiFile.SAVES_DIR}/${cmdrUuid}/auto`;
        const autoFiles = await this.fileSystem.listDirectory(autoDir);

        if (!autoFiles) {
            return;
        }

        // Load all auto saves to get their timestamps
        const autoSaves: Array<{ uuid: string; timestamp: number }> = [];

        for (const fileName of autoFiles) {
            const saveResult = await this.loadSaveFile(`${autoDir}/${fileName}`);
            if (!saveResult.success) {
                continue;
            }
            const save = saveResult.value;
            autoSaves.push({ uuid: save.uuid, timestamp: save.timestamp });
        }

        // Sort by timestamp (newest first) and remove excess
        autoSaves.sort((a, b) => b.timestamp - a.timestamp);

        while (autoSaves.length > Settings.MAX_AUTO_SAVES) {
            const oldestSave = autoSaves.pop();
            if (oldestSave !== undefined) {
                await this.fileSystem.deleteFile(`${autoDir}/${oldestSave.uuid}.json`);
            }
        }
    }

    /**
     * Imports manual and automatic saves for each commander through the normal write paths.
     * @param saves - Commander-keyed collections of manual and automatic save snapshots.
     * @returns Whether every individual save write succeeded; duplicate UUIDs count as failures.
     */
    public async importSaves(saves: DeepReadonly<Record<string, CmdrSaves>>): Promise<boolean> {
        const promises: Array<Promise<boolean>> = [];
        for (const [cmdrUuid, cmdrSaves] of Object.entries(saves)) {
            for (const manualSave of cmdrSaves.manual) {
                promises.push(this.addManualSave(cmdrUuid, manualSave));
            }

            for (const autoSave of cmdrSaves.auto) {
                promises.push(this.addAutoSave(cmdrUuid, autoSave));
            }
        }

        const results = await Promise.all(promises);

        return results.every((result) => result);
    }

    /**
     * Reads each commander directory and collects its valid manual and automatic saves.
     * @returns Commander-keyed save collections; commanders without readable saves are omitted.
     */
    public async exportSaves(): Promise<Record<string, CmdrSaves>> {
        const result: Record<string, CmdrSaves> = {};
        const cmdrUuids = await this.getCmdrUuids();

        for (const cmdrUuid of cmdrUuids) {
            const saves = await this.getSavesForCmdr(cmdrUuid);
            if (saves !== undefined) {
                result[cmdrUuid] = saves;
            }
        }

        return result;
    }
}
