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

import "../styles/index.scss";
import { SoundPlayerMock } from "./audio/soundPlayer";
import { CosmosJourneyer } from "./cosmosJourneyer";
import { safeParseSave } from "./saveFile/saveFileData";
import { decodeBase64 } from "./utils/base64";
import { alertModal } from "./utils/dialogModal";
import { jsonSafeParse } from "./utils/json";

const soundPlayerMock = new SoundPlayerMock();

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

    const result = safeParseSave(json, engine.starSystemDatabase);
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

    await simpleInit(engine);
}

await startCosmosJourneyer();
