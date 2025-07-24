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

import { type StarSystemDatabase } from "@/backend/universe/starSystemDatabase";

import { jsonSafeParse } from "@/utils/json";
import { err, ok, type DeepReadonly, type Result } from "@/utils/types";

import { Settings } from "@/settings";

import type { ISaveBackend } from "./saveBackend";
import { safeParseSave, type CmdrSaves, type Save } from "./saveFileData";
import { saveLoadingErrorToI18nString, SaveLoadingErrorType, type SaveLoadingError } from "./saveLoadingError";

/**
 * Interface defining the file system operations for save data.
 */
export interface IFileSystem {
    /**
     * Creates a directory at the specified path.
     * @param path - The directory path to create
     * @returns Boolean indicating success or failure
     */
    createDirectory(path: string): Promise<boolean>;

    /**
     * Deletes a directory at the specified path.
     * @param path - The directory path to delete
     * @returns Boolean indicating success or failure
     */
    deleteDirectory(path: string): Promise<boolean>;

    /**
     * Lists the contents of a directory.
     * @param path - The directory path to list
     * @returns Array of file/directory names, or null if directory doesn't exist
     */
    listDirectory(path: string): Promise<Array<string> | null>;

    /**
     * Checks if a directory exists.
     * @param path - The directory path to check
     * @returns Boolean indicating if directory exists
     */
    directoryExists(path: string): Promise<boolean>;

    /**
     * Writes content to a file.
     * @param path - The file path to write to
     * @param content - The content to write
     * @returns Boolean indicating success or failure
     */
    writeFile(path: string, content: string): Promise<boolean>;

    /**
     * Reads content from a file.
     * @param path - The file path to read from
     * @returns File content or null if file doesn't exist
     */
    readFile(path: string): Promise<string | null>;

    /**
     * Deletes a file.
     * @param path - The file path to delete
     * @returns Boolean indicating success or failure
     */
    deleteFile(path: string): Promise<boolean>;

    /**
     * Checks if a file exists.
     * @param path - The file path to check
     * @returns Boolean indicating if file exists
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
    private readonly starSystemDatabase: StarSystemDatabase;
    private readonly corruptedSaves: CorruptedSave[] = [];

    private static readonly SAVES_DIR = "/saves";

    /**
     * Creates a new SaveBackendMultiFile instance.
     * @param fileSystem - The file system interface to use
     * @param starSystemDatabase - The star system database for save validation
     * @private
     */
    private constructor(fileSystem: IFileSystem, starSystemDatabase: StarSystemDatabase) {
        this.fileSystem = fileSystem;
        this.starSystemDatabase = starSystemDatabase;
    }

    /**
     * Factory method to create a SaveBackendMultiFile instance.
     * @param fileSystem - The file system interface to use
     * @param starSystemDatabase - The star system database for save validation
     * @returns Result containing either the created SaveBackendMultiFile or an error
     */
    public static async CreateAsync(
        fileSystem: IFileSystem,
        starSystemDatabase: StarSystemDatabase,
    ): Promise<Result<SaveBackendMultiFile, SaveLoadingError>> {
        try {
            // Ensure the saves directory exists
            await fileSystem.createDirectory(SaveBackendMultiFile.SAVES_DIR);
            return ok(new SaveBackendMultiFile(fileSystem, starSystemDatabase));
        } catch (error) {
            console.error("Failed to create SaveBackendMultiFile:", error);
            // For file system initialization errors, we use INVALID_JSON as a generic failure
            return err({ type: SaveLoadingErrorType.INVALID_JSON });
        }
    }

    /**
     * Gets the corrupted saves that were encountered during operations.
     * @returns Array of corrupted save information
     */
    public getCorruptedSaves(): Array<CorruptedSave> {
        return [...this.corruptedSaves];
    }

    /**
     * Loads a save file and validates it.
     * @param filePath - Path to the save file
     * @returns The loaded save or null if corrupted/missing
     */
    private async loadSaveFile(filePath: string): Promise<Save | null> {
        try {
            const content = await this.fileSystem.readFile(filePath);
            if (content === null) return null;

            const saveJson = jsonSafeParse(content);
            if (!saveJson) throw new Error("Invalid JSON");

            const saveResult = safeParseSave(saveJson, this.starSystemDatabase);
            if (!saveResult.success) {
                throw new Error(`Save validation failed: ${saveLoadingErrorToI18nString(saveResult.error)}`);
            }

            return saveResult.value;
        } catch (error) {
            // Quarantine corrupted save
            const content = await this.fileSystem.readFile(filePath);
            this.corruptedSaves.push({
                filePath,
                error,
                rawContent: content ?? "",
            });

            console.error(`Corrupted save file: ${filePath}`, error);
            await this.quarantineCorruptedSave(filePath);
            return null;
        }
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
     * Loads all saves for a commander from their directory.
     * @param cmdrUuid - The commander UUID
     * @returns The commander's saves or undefined if none exist
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
                const save = await this.loadSaveFile(`${manualDir}/${fileName}`);
                if (save === null) {
                    continue;
                }

                manualSaves.push(save);
            }
        }

        // Load auto saves
        const autoDir = `${cmdrDir}/auto`;
        const autoFiles = await this.fileSystem.listDirectory(autoDir);
        if (autoFiles !== null) {
            for (const fileName of autoFiles) {
                const save = await this.loadSaveFile(`${autoDir}/${fileName}`);
                if (save === null) {
                    continue;
                }

                autoSaves.push(save);
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
     * Deletes a specific save for a commander.
     * @param cmdrUuid - The commander UUID
     * @param saveUuid - The save UUID to delete
     * @returns Boolean indicating success
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
     * Deletes a commander and all their saves.
     * @param cmdrUuid - The commander UUID
     * @returns Boolean indicating success
     */
    public async deleteCmdr(cmdrUuid: string): Promise<boolean> {
        const cmdrDir = `${SaveBackendMultiFile.SAVES_DIR}/${cmdrUuid}`;
        return await this.fileSystem.deleteDirectory(cmdrDir);
    }

    /**
     * @inheritdoc
     */
    public async getCmdrUuids(): Promise<Array<string>> {
        const savesDir = SaveBackendMultiFile.SAVES_DIR;
        if (!(await this.fileSystem.directoryExists(savesDir))) {
            return [];
        }

        const directories = await this.fileSystem.listDirectory(savesDir);
        return directories ?? [];
    }

    /**
     * @inheritdoc
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
     * @inheritdoc
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
     * Cleans up old auto saves to enforce the maximum limit.
     * @param cmdrUuid - The commander UUID
     */
    private async cleanupAutoSaves(cmdrUuid: string): Promise<void> {
        const autoDir = `${SaveBackendMultiFile.SAVES_DIR}/${cmdrUuid}/auto`;
        const autoFiles = await this.fileSystem.listDirectory(autoDir);

        if (!autoFiles) return;

        // Load all auto saves to get their timestamps
        const autoSaves: Array<{ uuid: string; timestamp: number }> = [];

        for (const fileName of autoFiles) {
            const save = await this.loadSaveFile(`${autoDir}/${fileName}`);
            if (save !== null) {
                autoSaves.push({ uuid: save.uuid, timestamp: save.timestamp });
            }
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
     * @inheritdoc
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
     * @inheritdoc
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
