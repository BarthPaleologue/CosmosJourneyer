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

import { type StarSystemDatabase } from "@/backend/universe/starSystemDatabase";

import { type ISoundPlayer } from "@/frontend/audio/soundPlayer";

import i18n from "@/i18n";

import { type INotificationManager } from "../notificationManager";
import { SaveLoadingPanelContent } from "../saveLoadingPanelContent";

export class LoadSavePanel {
    readonly htmlRoot: HTMLElement;
    readonly content: SaveLoadingPanelContent;

    constructor(
        starSystemDatabase: StarSystemDatabase,
        soundPlayer: ISoundPlayer,
        notificationManager: INotificationManager,
    ) {
        this.content = new SaveLoadingPanelContent(starSystemDatabase, soundPlayer, notificationManager);
        this.htmlRoot = this.createPanelHTML();
    }

    private createPanelHTML(): HTMLElement {
        const panel = document.createElement("div");
        panel.className = "sidePanel";

        // Create title
        const title = document.createElement("h2");
        title.textContent = i18n.t("sidePanel:loadSave");
        panel.appendChild(title);

        // Append the content
        panel.appendChild(this.content.htmlRoot);

        return panel;
    }
}
