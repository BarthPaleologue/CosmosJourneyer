import { type DeepReadonly } from "@cosmos-journeyer/typescript";

import { createCommanderArchive, createCommanderArchiveFileName } from "@/backend/save/commanderArchive";
import { type CmdrSaves } from "@/backend/save/saveFileData";

import { downloadBlob } from "./downloadBlob";

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
