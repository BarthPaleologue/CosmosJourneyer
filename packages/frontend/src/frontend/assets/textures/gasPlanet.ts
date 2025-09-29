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

import jupiterTexturePath from "@assets/sol/textures/jupiter.jpg";
import neptuneTexturePath from "@assets/sol/textures/neptune.jpg";
import saturnTexturePath from "@assets/sol/textures/saturn.jpg";
import uranusTexturePath from "@assets/sol/textures/uranus.jpg";

export type GasPlanetTextures = {
    jupiter: Texture;
    saturn: Texture;
    uranus: Texture;
    neptune: Texture;
};

export async function loadGasPlanetTextures(
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<GasPlanetTextures> {
    const jupiterTexturePromise = loadTextureAsync("JupiterTexture", jupiterTexturePath, scene, progressMonitor);
    const saturnTexturePromise = loadTextureAsync("SaturnTexture", saturnTexturePath, scene, progressMonitor);
    const uranusTexturePromise = loadTextureAsync("UranusTexture", uranusTexturePath, scene, progressMonitor);
    const neptuneTexturePromise = loadTextureAsync("NeptuneTexture", neptuneTexturePath, scene, progressMonitor);

    return {
        jupiter: await jupiterTexturePromise,
        saturn: await saturnTexturePromise,
        uranus: await uranusTexturePromise,
        neptune: await neptuneTexturePromise,
    };
}
