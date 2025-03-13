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

import { CosmosJourneyer } from "./cosmosJourneyer";
import { Player } from "./player/player";
import { safeParseSave } from "./saveFile/saveFileData";
import { Settings } from "./settings";
import { decodeBase64 } from "./utils/base64";
import { UniverseCoordinatesSchema } from "./utils/coordinates/universeCoordinates";
import { alertModal } from "./utils/dialogModal";
import { jsonSafeParse } from "./utils/json";

const engine = await CosmosJourneyer.CreateAsync();

const urlParams = new URLSearchParams(window.location.search);
const universeCoordinatesString = urlParams.get("universeCoordinates");
const saveString = urlParams.get("save");

if (universeCoordinatesString !== null) {
    engine.player.copyFrom(Player.Default());
    engine.player.uuid = Settings.SHARED_POSITION_SAVE_UUID;
    const jsonString = decodeBase64(universeCoordinatesString);
    const parsedJson = jsonSafeParse(jsonString);
    if (parsedJson === null) {
        await alertModal("Error, this universe coordinates URL data is not a valid json.");
    }

    const universeCoordinates = UniverseCoordinatesSchema.safeParse(parsedJson);
    if (!universeCoordinates.success) {
        console.error(universeCoordinates.error);
        await alertModal(
            "Error, this universe coordinates URL data do not match the expected schema. Check the console for more information."
        );
        await engine.init(false);
    } else {
        await engine.loadUniverseCoordinates(universeCoordinates.data);
        engine.starSystemView.setUIEnabled(true);
    }
} else if (saveString !== null) {
    const jsonString = decodeBase64(saveString);
    const result = safeParseSave(jsonString);
    if (result.success) {
        await engine.loadSave(result.value);
        engine.starSystemView.setUIEnabled(true);
    } else {
        await alertModal("Error, this save file is invalid. See the console for more details.");
        await engine.init(false);
    }
} else {
    await engine.init(false);
}
