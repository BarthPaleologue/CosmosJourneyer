//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.

import { type DeepReadonly } from "@cosmos-journeyer/typescript";
import { strToU8, zipSync } from "fflate";

import { type CmdrSaves } from "./saveFileData";

const MANIFEST_FILE_NAME = "manifest.json";

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
