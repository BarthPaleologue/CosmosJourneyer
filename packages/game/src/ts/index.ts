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

import "@styles/index.css";

import { safeParseSave } from "@/backend/save/saveFileData";
import { getLatestSaveFromBackend } from "@/backend/save/saveHelpers";

import { SoundPlayerMock } from "@/frontend/audio/soundPlayer";
import { CosmosJourneyer } from "@/frontend/cosmosJourneyer";
import { alertModal } from "@/frontend/ui/dialogModal";

import { decodeBase64 } from "@/utils/base64";
import { jsonSafeParse } from "@/utils/json";

import { ConsoleDumper } from "./utils/consoleDumper";
import { CrashReporter } from "./utils/crashReporter";

const consoleDumper = new ConsoleDumper();
const crashReporter = new CrashReporter(consoleDumper);
const soundPlayerMock = new SoundPlayerMock();

try {
    await startCosmosJourneyer();
} catch (error: unknown) {
    await crashReporter.reportCrash({ type: "startup", value: error });
}

async function simpleInit(engine: CosmosJourneyer) {
    await engine.init(false);
}

async function initWithSaveString(engine: CosmosJourneyer, saveString: string) {
    const jsonString = decodeBase64(saveString);
    const json = jsonSafeParse(jsonString);
    if (json === null) {
        console.error(jsonString);
        await alertModal("Error, this save file is not a valid json.", soundPlayerMock);
        await simpleInit(engine);
        return;
    }

    const result = safeParseSave(json, engine.backend.universe);
    if (!result.success) {
        await alertModal("Error, this save file is invalid. See the console for more details.", soundPlayerMock);
        await simpleInit(engine);
        return;
    }

    await engine.loadSave(result.value);
    engine.starSystemView.setUIEnabled(true);
}

async function startCosmosJourneyer() {
    const engine = await CosmosJourneyer.CreateAsync();

    const urlParams = new URLSearchParams(window.location.search);

    const saveString = urlParams.get("save");
    if (saveString !== null) {
        await initWithSaveString(engine, saveString);
        return;
    }

    if (urlParams.has("continue")) {
        const latestSave = await getLatestSaveFromBackend(engine.backend.save);
        if (latestSave !== null) {
            await engine.loadSave(latestSave);
            engine.starSystemView.setUIEnabled(true);
            return;
        }
    }

    await simpleInit(engine);
}
