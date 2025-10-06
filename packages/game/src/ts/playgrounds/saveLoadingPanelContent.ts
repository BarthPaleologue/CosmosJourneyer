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

import { FreeCamera, Vector3 } from "@babylonjs/core";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";

import { SaveBackendSingleFile } from "@/backend/save/saveBackendSingleFile";
import { SaveLocalStorage } from "@/backend/save/saveLocalStorage";
import { getLoneStarSystem } from "@/backend/universe/customSystems/loneStar";
import { StarSystemDatabase } from "@/backend/universe/starSystemDatabase";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { SoundPlayerMock } from "@/frontend/audio/soundPlayer";
import { alertModal } from "@/frontend/ui/dialogModal";
import { NotificationManagerMock } from "@/frontend/ui/notificationManager";
import { SaveLoadingPanelContent } from "@/frontend/ui/saveLoadingPanelContent";

import { initI18n } from "@/i18n";

export async function createSaveLoadingPanelContentScene(
    engine: AbstractEngine,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);

    const camera = new FreeCamera("camera", Vector3.Zero(), scene);
    camera.attachControl();

    await initI18n();

    const starSystemDatabase = new StarSystemDatabase(getLoneStarSystem());

    const soundPlayer = new SoundPlayerMock();
    const notificationManager = new NotificationManagerMock();

    const saveLoadingPanelContent = new SaveLoadingPanelContent(starSystemDatabase, soundPlayer, notificationManager);
    saveLoadingPanelContent.htmlRoot.style.position = "absolute";
    document.body.appendChild(saveLoadingPanelContent.htmlRoot);

    const saveManager = await SaveBackendSingleFile.CreateAsync(
        new SaveLocalStorage(SaveLocalStorage.SAVES_KEY),
        new SaveLocalStorage(SaveLocalStorage.BACKUP_SAVE_KEY),
        starSystemDatabase,
    );
    if (!saveManager.success) {
        await alertModal("Could not load saves", soundPlayer);
        return scene;
    }

    await saveLoadingPanelContent.populateCmdrList(starSystemDatabase, saveManager.value);

    return scene;
}
