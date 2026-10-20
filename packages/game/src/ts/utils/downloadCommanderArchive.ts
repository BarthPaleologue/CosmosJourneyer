import type { DeepReadonly } from "@cosmos-journeyer/typescript";

import { createCommanderArchive, createCommanderArchiveFileName } from "@/backend/save/commanderArchive";
import type { CmdrSaves } from "@/backend/save/saveFileData";

import { downloadBlob } from "./downloadBlob";

/**
 * Builds a commander archive and starts a browser download for it.
 * @param commanderUuid - Stable UUID identifying the commander in the archive.
 * @param commanderName - Display name used to create a safe download filename.
 * @param saves - Manual and automatic saves to include in the archive.
 */
export function downloadCommanderArchive(
    commanderUuid: string,
    commanderName: string,
    saves: DeepReadonly<CmdrSaves>,
): void {
    const archive = createCommanderArchive(commanderUuid, commanderName, saves);
    downloadBlob(
        new Blob([new Uint8Array(archive)], { type: "application/zip" }),
        createCommanderArchiveFileName(commanderUuid, commanderName),
    );
}
