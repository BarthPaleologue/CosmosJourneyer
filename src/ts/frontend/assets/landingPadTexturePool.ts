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

import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { type Scene } from "@babylonjs/core/scene";

import { Settings } from "@/settings";

export class LandingPadTexturePool {
    private readonly landingPadTextures: Map<number, DynamicTexture> = new Map();

    get(padNumber: number, scene: Scene): DynamicTexture {
        const texture = this.landingPadTextures.get(padNumber);
        if (texture !== undefined) {
            return texture;
        }

        const padNumberTextureResolution = 1024;
        const numberTexture = new DynamicTexture(
            `PadNumberTexture${padNumber}`,
            {
                width: padNumberTextureResolution,
                height: padNumberTextureResolution * Settings.LANDING_PAD_ASPECT_RATIO,
            },
            scene,
            true,
        );

        //Add text to dynamic texture
        const font = `bold 256px ${Settings.MAIN_FONT}`;
        numberTexture.drawText(`${padNumber}`, null, null, font, "white", null, true, true);

        this.landingPadTextures.set(padNumber, numberTexture);

        return numberTexture;
    }
}
