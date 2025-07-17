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

import { type Camera } from "@babylonjs/core/Cameras/camera";
import { type Effect } from "@babylonjs/core/Materials/effect";
import { type Scene } from "@babylonjs/core/scene";

export const SamplerUniformNames = {
    TEXTURE_SAMPLER: "textureSampler",
    DEPTH_SAMPLER: "depthSampler",
};

export function setSamplerUniforms(effect: Effect, camera: Camera, scene: Scene): void {
    const depthRenderers = Object.values(scene._depthRenderer);
    const depthRenderer = depthRenderers.find((depthRenderer) => depthRenderer.getDepthMap().activeCamera === camera);
    if (depthRenderer === undefined) {
        console.log("Depth renderer", scene._depthRenderer);
        throw new Error("Depth renderer not found for camera: " + camera.name);
    }
    effect.setTexture(SamplerUniformNames.DEPTH_SAMPLER, depthRenderer.getDepthMap());
}
