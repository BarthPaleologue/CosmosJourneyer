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

import { type Texture } from "@babylonjs/core/Materials/Textures/texture";
import { type Scene } from "@babylonjs/core/scene";

import { type ILoadingProgressMonitor } from "../loadingProgressMonitor";
import { loadTextureAsync } from "./utils";

import butterflyTexture from "@assets/butterfly.webp";
import flareParticle from "@assets/flare.png";
import plumeParticle from "@assets/textures/plume.png";

export type ParticleTextures = {
    plume: Texture;
    flare: Texture;
    butterfly: Texture;
};

export async function loadParticleTextures(scene: Scene, progressMonitor: ILoadingProgressMonitor | null) {
    const plumeParticlePromise = loadTextureAsync("PlumeParticle", plumeParticle, scene, progressMonitor);
    const flareTexturePromise = loadTextureAsync("FlareTexture", flareParticle, scene, progressMonitor);
    const butterflyPromise = loadTextureAsync("Butterfly", butterflyTexture, scene, progressMonitor);

    return {
        plume: await plumeParticlePromise,
        flare: await flareTexturePromise,
        butterfly: await butterflyPromise,
    };
}
