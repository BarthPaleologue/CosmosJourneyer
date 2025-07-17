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

import { type Scene } from "@babylonjs/core/scene";

import { type StarSystemDatabase } from "@/backend/universe/starSystemDatabase";

import { type RenderingAssets } from "@/frontend/assets/renderingAssets";
import { type ISoundPlayer } from "@/frontend/audio/soundPlayer";
import { AiSpaceshipControls } from "@/frontend/spaceship/aiSpaceshipControls";
import { Spaceship } from "@/frontend/spaceship/spaceship";

import { Player } from "./player";

export class AiPlayerControls {
    readonly player: Player;
    readonly spaceshipControls: AiSpaceshipControls;

    constructor(
        starSystemDatabase: StarSystemDatabase,
        scene: Scene,
        assets: RenderingAssets,
        soundPlayer: ISoundPlayer,
    ) {
        this.player = Player.Default(starSystemDatabase);
        this.player.setName("AI");

        const spaceshipSerialized = this.player.serializedSpaceships.shift();
        if (spaceshipSerialized === undefined) {
            throw new Error("No spaceship serialized for AI player");
        }

        const spaceship = Spaceship.Deserialize(
            spaceshipSerialized,
            this.player.spareSpaceshipComponents,
            scene,
            assets,
            soundPlayer,
        );

        this.spaceshipControls = new AiSpaceshipControls(spaceship, scene);
    }

    dispose(soundPlayer: ISoundPlayer) {
        this.spaceshipControls.dispose(soundPlayer);
    }
}
