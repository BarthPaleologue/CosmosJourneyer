//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024-2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import type { Scene } from "@babylonjs/core/scene";

import colorPath from "@assets/materials/foil/Color.jpg";
import normalPath from "@assets/materials/foil/NormalGL.jpg";
import roughnessPath from "@assets/materials/foil/Roughness.jpg";

/** The caller owns this material and its three textures. */
export function createInsulationSheetMaterial(scene: Scene, sheetSize: number): PBRMaterial {
    const material = new PBRMaterial("insulationSheet", scene);
    material.metallic = 1;
    material.roughness = 1;
    material.backFaceCulling = false;
    material.twoSidedLighting = true;
    const color = new Texture(colorPath, scene);
    const normal = new Texture(normalPath, scene);
    const roughness = new Texture(roughnessPath, scene);
    for (const texture of [color, normal, roughness]) {
        // Repeat the foil every 10 meters so its folds remain visible at telescope scale.
        texture.uScale = sheetSize / 10;
        texture.vScale = sheetSize / 10;
    }
    normal.gammaSpace = false;
    normal.level = 0.2;
    roughness.gammaSpace = false;
    material.albedoTexture = color;
    material.bumpTexture = normal;
    material.metallicTexture = roughness;
    material.useMetallnessFromMetallicTextureBlue = false;
    material.useRoughnessFromMetallicTextureAlpha = false;
    material.useRoughnessFromMetallicTextureGreen = true;
    return material;
}
