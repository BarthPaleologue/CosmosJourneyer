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

import { err, ok, type DeepReadonly, type Result } from "@cosmos-journeyer/typescript";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { z } from "zod";

import { type UniverseBackend } from "@/backend/universe/universeBackend";

import { jsonSafeParse } from "@/utils/json";

import { safeParseSave, type CmdrSaves } from "./saveFileData";

const MANIFEST_FILE_NAME = "manifest.json";

const CommanderArchiveManifestSchema = z.object({
    formatVersion: z.literal(1),
    cmdrUuid: z.uuid(),
    cmdrName: z.string().min(1),
});

export type CommanderArchiveError = "INVALID_ZIP" | "INVALID_MANIFEST" | "INVALID_SAVE" | "EMPTY_ARCHIVE";

export interface CommanderArchive {
    readonly cmdrUuid: string;
    readonly cmdrName: string;
    readonly saves: CmdrSaves;
}

export function createCommanderArchive(cmdrUuid: string, cmdrName: string, saves: DeepReadonly<CmdrSaves>): Uint8Array {
    const archiveEntries: Record<string, Uint8Array> = {
        [MANIFEST_FILE_NAME]: strToU8(
            JSON.stringify({
                formatVersion: 1,
                cmdrUuid,
                cmdrName,
            }),
        ),
    };

    for (const save of saves.manual) {
        archiveEntries[`manual/${save.uuid}.json`] = strToU8(JSON.stringify(save));
    }
    for (const save of saves.auto) {
        archiveEntries[`auto/${save.uuid}.json`] = strToU8(JSON.stringify(save));
    }

    return zipSync(archiveEntries, { level: 6 });
}

export function createCommanderArchiveFileName(cmdrUuid: string, cmdrName: string): string {
    const safeCmdrName = cmdrName
        .trim()
        .replaceAll(/[^\p{L}\p{N}._-]+/gu, "_")
        .replaceAll(/^_+|_+$/g, "");
    return `CosmosJourneyer_${safeCmdrName || "Commander"}_${cmdrUuid}.zip`;
}

export function parseCommanderArchive(
    archiveData: Uint8Array,
    universeBackend: UniverseBackend,
): Result<CommanderArchive, CommanderArchiveError> {
    let entries: Record<string, Uint8Array>;
    try {
        entries = unzipSync(archiveData);
    } catch {
        return err("INVALID_ZIP");
    }

    const manifestData = entries[MANIFEST_FILE_NAME];
    if (manifestData === undefined) {
        return err("INVALID_MANIFEST");
    }

    const manifestJson = jsonSafeParse(strFromU8(manifestData));
    const manifestResult = CommanderArchiveManifestSchema.safeParse(manifestJson);
    if (!manifestResult.success) {
        return err("INVALID_MANIFEST");
    }

    const saves: CmdrSaves = { manual: [], auto: [] };
    const saveUuids = new Set<string>();

    for (const [path, data] of Object.entries(entries)) {
        if (path === MANIFEST_FILE_NAME || path.endsWith("/")) {
            continue;
        }

        const pathMatch = /^(manual|auto)\/([^/]+)\.json$/.exec(path);
        if (pathMatch === null) {
            return err("INVALID_SAVE");
        }

        const saveType = pathMatch[1] as "manual" | "auto";
        const fileUuid = pathMatch[2];
        const saveJson = jsonSafeParse(strFromU8(data));
        if (saveJson === null) {
            return err("INVALID_SAVE");
        }
        const saveResult = safeParseSave(saveJson, universeBackend);
        if (
            !saveResult.success ||
            saveResult.value.player.uuid !== manifestResult.data.cmdrUuid ||
            saveResult.value.uuid !== fileUuid ||
            saveUuids.has(saveResult.value.uuid)
        ) {
            return err("INVALID_SAVE");
        }

        saveUuids.add(saveResult.value.uuid);
        saves[saveType].push(saveResult.value);
    }

    if (saveUuids.size === 0) {
        return err("EMPTY_ARCHIVE");
    }

    return ok({
        cmdrUuid: manifestResult.data.cmdrUuid,
        cmdrName: manifestResult.data.cmdrName,
        saves,
    });
}
