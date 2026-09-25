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

import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import type { Texture } from "@babylonjs/core/Materials/Textures/texture";

import type { ILoadingProgressMonitor } from "../loadingProgressMonitor";
import { loadTextureAsync } from "./utils";

import butterflyTexture from "@assets/butterfly.webp";
import flareParticle from "@assets/flare.png";
import blackHoleTexture from "@assets/textures/blackholeParticleSmall.png";
import plumeParticle from "@assets/textures/plume.png";
import starTexturePath from "@assets/textures/starParticle.png";

export type ParticleTextures = {
    plume: Texture;
    flare: Texture;
    butterfly: Texture;
    starSprite: Texture;
    blackHoleSprite: Texture;
};

export async function loadParticleTextures(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor,
): Promise<ParticleTextures> {
    const plumeParticlePromise = loadTextureAsync("PlumeParticle", plumeParticle, engine, progressMonitor);
    const flareTexturePromise = loadTextureAsync("FlareTexture", flareParticle, engine, progressMonitor);
    const butterflyPromise = loadTextureAsync("Butterfly", butterflyTexture, engine, progressMonitor);
    const starSpritePromise = loadTextureAsync("StarSprite", starTexturePath, engine, progressMonitor);
    const blackHoleSpritePromise = loadTextureAsync("BlackHoleSprite", blackHoleTexture, engine, progressMonitor);

    return {
        plume: await plumeParticlePromise,
        flare: await flareTexturePromise,
        butterfly: await butterflyPromise,
        starSprite: await starSpritePromise,
        blackHoleSprite: await blackHoleSpritePromise,
    };
}
