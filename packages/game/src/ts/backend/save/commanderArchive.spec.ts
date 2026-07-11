import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";

import { getLoneStarSystem } from "@/backend/universe/customSystems/loneStar";
import { UniverseBackend } from "@/backend/universe/universeBackend";

import { createCommanderArchive, createCommanderArchiveFileName, parseCommanderArchive } from "./commanderArchive";
import { safeParseSave } from "./saveFileData";

import saveData from "@assets/tutorials/starMapTutorial/save.json";

describe("Commander archives", () => {
    const universeBackend = new UniverseBackend(getLoneStarSystem());
    const saveResult = safeParseSave(saveData, universeBackend);
    if (!saveResult.success) {
        throw new Error("Tutorial save fixture is invalid");
    }
    const save = saveResult.value;

    it("stores the manifest and Commander saves", () => {
        const archive = createCommanderArchive(save.player.uuid, "Cmdr Python", {
            manual: [save],
            auto: [],
        });

        const entries = unzipSync(archive);

        expect(JSON.parse(strFromU8(entries["manifest.json"] ?? new Uint8Array()))).toEqual({
            formatVersion: 1,
            cmdrUuid: save.player.uuid,
            cmdrName: "Cmdr Python",
        });
        expect(JSON.parse(strFromU8(entries[`manual/${save.uuid}.json`] ?? new Uint8Array()))).toEqual(save);
    });

    it("includes a sanitized Commander name and UUID in the file name", () => {
        expect(createCommanderArchiveFileName(save.player.uuid, " Cmdr / Python ")).toBe(
            `CosmosJourneyer_Cmdr_Python_${save.player.uuid}.zip`,
        );
    });

    it("round-trips a Commander archive", () => {
        const archive = createCommanderArchive(save.player.uuid, "Cmdr Python", {
            manual: [save],
            auto: [],
        });

        expect(parseCommanderArchive(archive, universeBackend)).toEqual({
            success: true,
            value: {
                cmdrUuid: save.player.uuid,
                cmdrName: "Cmdr Python",
                saves: { manual: [save], auto: [] },
            },
        });
    });

    it("rejects data that is not a ZIP archive", () => {
        expect(parseCommanderArchive(new Uint8Array([1, 2, 3]), universeBackend)).toEqual({
            success: false,
            error: "INVALID_ZIP",
        });
    });
});
