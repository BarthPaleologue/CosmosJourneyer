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

import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { type Scene } from "@babylonjs/core/scene";

import { EncyclopaediaGalacticaLocal } from "@/backend/encyclopaedia/encyclopaediaGalacticaLocal";
import { getLoneStarSystem } from "@/backend/universe/customSystems/loneStar";
import { StarSystemCoordinatesSchema } from "@/backend/universe/starSystemCoordinates";
import { UniverseBackend } from "@/backend/universe/universeBackend";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { SoundPlayerMock } from "@/frontend/audio/soundPlayer";
import { Player } from "@/frontend/player/player";
import { StarMapView } from "@/frontend/starmap/starMapView";
import { NotificationManagerMock } from "@/frontend/ui/notificationManager";

import { jsonSafeParse } from "@/utils/json";

import { initI18n } from "@/i18n";

export async function createStarMapViewScene(
    engine: AbstractEngine,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    await initI18n();

    const universeBackend = new UniverseBackend(getLoneStarSystem());

    const player = Player.Default(universeBackend);

    const encyclopaediaGalactica = new EncyclopaediaGalacticaLocal(universeBackend);

    const soundPlayerMock = new SoundPlayerMock();
    const notificationManager = new NotificationManagerMock();

    const starMap = new StarMapView(
        player,
        engine,
        encyclopaediaGalactica,
        universeBackend,
        soundPlayerMock,
        notificationManager,
    );
    starMap.setCurrentStarSystem(universeBackend.fallbackSystem.coordinates, true);

    // Get system coordinates from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const customSystemCoordinates = urlParams.get("systemCoordinates");

    // If system parameter was provided, focus on the specified system
    if (customSystemCoordinates !== null) {
        const systemCoordinates = jsonSafeParse(decodeURIComponent(customSystemCoordinates));
        if (systemCoordinates === null) {
            throw new Error("Invalid system coordinates json provided in URL parameters.");
        }

        starMap.focusOnSystem(StarSystemCoordinatesSchema.parse(systemCoordinates), true);
    }

    return starMap.scene;
}
