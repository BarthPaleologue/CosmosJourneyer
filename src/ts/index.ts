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
import { parseSaveFileData } from "./saveFile/saveFileData";
import { Settings } from "./settings";
import { decodeBase64 } from "./utils/base64";
import { alertModal } from "./utils/dialogModal";
import { createNotification, NotificationIntent, NotificationOrigin } from "./utils/notification";

const engine = await CosmosJourneyer.CreateAsync();

const urlParams = new URLSearchParams(window.location.search);
const universeCoordinatesString = urlParams.get("universeCoordinates");
const saveString = urlParams.get("save");

if (universeCoordinatesString !== null) {
    engine.player.copyFrom(Player.Default());
    engine.player.uuid = Settings.SHARED_POSITION_SAVE_UUID;
    const jsonString = decodeBase64(universeCoordinatesString);
    await engine.loadUniverseCoordinates(JSON.parse(jsonString));
    engine.starSystemView.setUIEnabled(true);
} else if (saveString !== null) {
    const jsonString = decodeBase64(saveString);
    const result = parseSaveFileData(jsonString);
    result.logs.forEach((log) => {
        createNotification(NotificationOrigin.GENERAL, NotificationIntent.WARNING, log, 5_000);
        console.warn(log);
    });
    if (result.data !== null) {
        await engine.loadSave(result.data);
        engine.starSystemView.setUIEnabled(true);
    } else {
        await alertModal("Error, this save file is invalid. See the console for more details.");
    }
} else {
    engine.init(false);
}
