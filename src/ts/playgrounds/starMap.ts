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

import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";

import { EncyclopaediaGalacticaLocal } from "@/backend/encyclopaedia/encyclopaediaGalacticaLocal";
import { StarSystemDatabase } from "@/backend/universe/starSystemDatabase";

import { SoundPlayerMock } from "../audio/soundPlayer";
import { initI18n } from "../i18n";
import { Player } from "../player/player";
import { StarMap } from "../starmap/starMap";
import { getLoneStarSystem } from "../starSystem/customSystems/loneStar";

export async function createStarMapScene(
    engine: AbstractEngine,
    progressCallback: (progress: number, text: string) => void,
): Promise<Scene> {
    await initI18n();

    const starSystemDatabase = new StarSystemDatabase(getLoneStarSystem());

    const player = Player.Default(starSystemDatabase);

    const encyclopaediaGalactica = new EncyclopaediaGalacticaLocal(starSystemDatabase);

    const soundPlayerMock = new SoundPlayerMock();

    const starMap = new StarMap(player, engine, encyclopaediaGalactica, starSystemDatabase, soundPlayerMock);
    starMap.setCurrentStarSystem(starSystemDatabase.fallbackSystem.coordinates);

    progressCallback(1, "Loaded star map");

    return starMap.scene;
}
