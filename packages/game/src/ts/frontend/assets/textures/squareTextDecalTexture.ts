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
import type { Scene } from "@babylonjs/core/scene";

import { Settings } from "@/settings";

export function createSquareTextDecalTexture(
    name: string,
    text: string,
    scene: Scene,
    options?: Partial<{ resolution: number; fontSize: number; color: string }>,
): DynamicTexture {
    const resolution = options?.resolution ?? 1024;
    const numberTexture = new DynamicTexture(
        name,
        {
            width: resolution,
            height: resolution * Settings.LANDING_PAD_ASPECT_RATIO,
        },
        scene,
        true,
    );

    const fontSize = options?.fontSize ?? Math.floor(resolution / 2);
    const font = `bold ${fontSize}px ${Settings.MAIN_FONT}`;
    const fontColor = options?.color ?? "white";
    numberTexture.drawText(text, null, null, font, fontColor, null, true, true);

    return numberTexture;
}
