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

import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { type Scene } from "@babylonjs/core/scene";

import { type GasPlanetTextureId } from "@/backend/universe/orbitalObjects/gasPlanetModel";

import { type GasPlanetTextures } from "@/frontend/assets/textures/gasPlanet";

import { assertUnreachable } from "@/utils/types";

export function createGasPlanetTextureMaterial(
    textureId: GasPlanetTextureId,
    textures: GasPlanetTextures,
    scene: Scene,
) {
    const material = new StandardMaterial("gasPlanetMaterial", scene);
    switch (textureId) {
        case "jupiter":
            material.diffuseTexture = textures.jupiter;
            break;
        case "saturn":
            material.diffuseTexture = textures.saturn;
            break;
        case "uranus":
            material.diffuseTexture = textures.uranus;
            break;
        case "neptune":
            material.diffuseTexture = textures.neptune;
            break;
        default:
            assertUnreachable(textureId);
    }

    material.specularColor.setAll(0.1);
    material.specularPower = 32;

    return material;
}
