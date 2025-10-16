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

import { type UniverseBackend } from "@/backend/universe/universeBackend";

import { jsonSafeParse } from "@/utils/json";
import { err, ok, type DeepReadonly, type Result } from "@/utils/types";

import { Settings } from "@/settings";

import type { ISaveBackend } from "./saveBackend";
import { parseSaveArray, SavesSchema, type CmdrSaves, type Save } from "./saveFileData";
import { SaveLoadingErrorType, type SaveLoadingError } from "./saveLoadingError";

/**
 * Interface defining the storage backend for save data.
 */
export interface IFile {
    /**
     * Writes save data to the storage backend.
     * @param content - JSON string containing all commander saves
     * @returns Boolean indicating success or failure of the write operation
     */
    write(content: string): Promise<boolean>;

    /**
     * Reads save data from the storage backend.
     * @returns Result containing either the loaded saves or an error
     */
    read(): Promise<string | null>;
}

/**
 * Implements save storage using a single storage file.
 * The entire file is rewritten when changes need to be saved
 */
export class SaveBackendSingleFile implements ISaveBackend {
    /**
     * The storage backend used for persisting save data
     * @private
     */
    private readonly backend: IFile;

    /**
     * Map storing commander saves, keyed by commander string
     * @private
     */
    private readonly saves: Map<string, CmdrSaves>;

    /**
     * Creates a new SaveManager instance.
     * @param backend - The storage backend to use
     * @param saves - Map of commander saves
     * @private
     */
    private constructor(backend: IFile, saves: Map<string, CmdrSaves>) {
        this.backend = backend;
        this.saves = saves;
    }

    /**
     * Factory method to create a SaveManager instance.
     * Reads save data from the provided backend and initializes the manager.
     * @param mainFile - The storage backend to use
     * @returns Result containing either the created SaveManager or an error
     */
    public static async CreateAsync(
        mainFile: IFile,
        backupFile: IFile,
        universeBackend: UniverseBackend,
    ): Promise<Result<SaveBackendSingleFile, SaveLoadingError>> {
        const rawSaves = await mainFile.read();
        const rawBackupSaves = await backupFile.read();

        const parsedSaves = jsonSafeParse(rawSaves ?? "{}");
        if (parsedSaves === null) {
            return err({ type: SaveLoadingErrorType.INVALID_JSON });
        }

        const parsedBackupSaves = jsonSafeParse(rawBackupSaves ?? "{}");
        if (parsedBackupSaves === null) {
            return err({ type: SaveLoadingErrorType.INVALID_JSON });
        }

        const savesResult = SavesSchema.safeParse(parsedSaves);
        if (!savesResult.success) {
            console.error(savesResult.error);
            return err({ type: SaveLoadingErrorType.INVALID_STORAGE_FORMAT, content: savesResult.error });
        }

        const backupSavesResult = SavesSchema.safeParse(parsedBackupSaves);
        if (!backupSavesResult.success) {
            console.error(backupSavesResult.error);
            return err({ type: SaveLoadingErrorType.INVALID_STORAGE_FORMAT, content: backupSavesResult.error });
        }

        const saves = savesResult.data;
        const backupSaves = backupSavesResult.data;

        const allSaves = {
            ...saves,
            ...backupSaves,
        };

        const correctSaves: Record<string, { manual: Save[]; auto: Save[] }> = {};
        const corruptedSaves: Record<string, { manual: unknown[]; auto: unknown[] }> = {};

        // filter saves
        for (const [cmdrUuid, cmdrSaves] of Object.entries(allSaves)) {
            const parsedManualSaves = parseSaveArray(cmdrSaves.manual, universeBackend);
            const parsedAutoSaves = parseSaveArray(cmdrSaves.auto, universeBackend);

            correctSaves[cmdrUuid] = {
                manual: parsedManualSaves.validSaves,
                auto: parsedAutoSaves.validSaves,
            };

            if (parsedManualSaves.invalidSaves.length > 0 || parsedAutoSaves.invalidSaves.length > 0) {
                corruptedSaves[cmdrUuid] = {
                    manual: parsedManualSaves.invalidSaves.map((save) => {
                        console.error("Corrupted manual save:", save.save, save.error);
                        return save.save;
                    }),
                    auto: parsedAutoSaves.invalidSaves.map((save) => {
                        console.error("Corrupted auto save:", save.save, save.error);
                        return save.save;
                    }),
                };
            }
        }

        await backupFile.write(JSON.stringify(corruptedSaves));

        if (Object.keys(corruptedSaves).length > 0) {
            console.warn("Some save files could not be validated! Check the console for more information.");
        }

        const savesMap = new Map<string, CmdrSaves>();
        for (const [cmdrId, cmdrSaves] of Object.entries(correctSaves)) {
            if (cmdrSaves.manual.length === 0 && cmdrSaves.auto.length === 0) {
                continue;
            }

            savesMap.set(cmdrId, cmdrSaves);
        }

        return ok(new SaveBackendSingleFile(mainFile, savesMap));
    }

    public getSavesForCmdr(cmdrId: string): Promise<CmdrSaves | undefined> {
        return Promise.resolve(this.saves.get(cmdrId));
    }

    /**
     * Persists the current saves to the storage backend.
     * @returns Boolean indicating success or failure of the save operation
     */
    private save(): Promise<boolean> {
        const savesJson = Object.fromEntries(this.saves);
        return this.backend.write(JSON.stringify(savesJson));
    }

    public deleteSaveForCmdr(cmdrUuid: string, saveUuid: string): Promise<boolean> {
        const cmdrSaves = this.saves.get(cmdrUuid);
        if (cmdrSaves === undefined) {
            return Promise.resolve(false);
        }

        const manualIndex = cmdrSaves.manual.findIndex((s) => s.uuid === saveUuid);
        if (manualIndex !== -1) {
            cmdrSaves.manual.splice(manualIndex, 1);
        }

        const autoIndex = cmdrSaves.auto.findIndex((s) => s.uuid === saveUuid);
        if (autoIndex !== -1) {
            cmdrSaves.auto.splice(autoIndex, 1);
        }

        return this.save();
    }

    public deleteCmdr(cmdrUuid: string): Promise<boolean> {
        this.saves.delete(cmdrUuid);
        return this.save();
    }

    public getCmdrUuids(): Promise<string[]> {
        return Promise.resolve([...this.saves.keys()]);
    }

    public async addManualSave(cmdrUuid: string, save: DeepReadonly<Save>) {
        const cmdrSaves = (await this.getSavesForCmdr(cmdrUuid)) ?? { manual: [], auto: [] };

        const existingSave = cmdrSaves.manual.find((s) => s.uuid === save.uuid);
        if (existingSave !== undefined) {
            return Promise.resolve(false);
        }

        cmdrSaves.manual.unshift(save);

        this.saves.set(cmdrUuid, cmdrSaves);

        return this.save();
    }

    public async addAutoSave(cmdrUuid: string, save: DeepReadonly<Save>) {
        const cmdrSaves = (await this.getSavesForCmdr(cmdrUuid)) ?? { manual: [], auto: [] };

        const existingSave = cmdrSaves.auto.find((s) => s.uuid === save.uuid);
        if (existingSave !== undefined) {
            return Promise.resolve(false);
        }

        cmdrSaves.auto.unshift(save);

        while (cmdrSaves.auto.length > Settings.MAX_AUTO_SAVES) {
            cmdrSaves.auto.pop(); // dequeue the oldest autosave
        }

        this.saves.set(cmdrUuid, cmdrSaves);

        return this.save();
    }

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

    public exportSaves(): Promise<Record<string, CmdrSaves>> {
        return Promise.resolve(structuredClone(Object.fromEntries(this.saves)));
    }
}
