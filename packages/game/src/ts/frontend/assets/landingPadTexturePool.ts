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

import type { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { type Scene } from "@babylonjs/core/scene";

import { createSquareTextDecalTexture } from "./textures/squareTextDecalTexture";

export class LandingPadTexturePool {
    private readonly landingPadTextures: Map<number, Texture> = new Map();

    get(padNumber: number, scene: Scene): Texture {
        const texture = this.landingPadTextures.get(padNumber);
        if (texture !== undefined) {
            return texture;
        }

        const numberTexture = createSquareTextDecalTexture(`PadNumberTexture${padNumber}`, `${padNumber}`, scene);
        this.landingPadTextures.set(padNumber, numberTexture);

        return numberTexture;
    }
}
