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

import { VolumetricLightScatteringPostProcess } from "@babylonjs/core/PostProcesses/volumetricLightScatteringPostProcess";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { ObjectPostProcess } from "./objectPostProcess";
import { Star } from "../stellarObjects/star/star";
import { NeutronStar } from "../stellarObjects/neutronStar/neutronStar";
import { Scene } from "@babylonjs/core/scene";

export class VolumetricLight extends VolumetricLightScatteringPostProcess implements ObjectPostProcess {
    readonly object: Star | NeutronStar;
    private readonly scene: Scene;

    constructor(star: Star | NeutronStar, scene: Scene) {
        if (scene.activeCameras === null || scene.activeCameras.length === 0) throw new Error("no camera");
        super(`${star.name}VolumetricLight`, 1, null, star.mesh, 100, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, scene);

        // This is necessary because BabylonJS post process sets the scene using the camera. However, I don't pass a camera to the constructor as I use a PostProcessRenderPipeline.
        this._scene = scene;

        this.object = star;

        this.exposure = 0.26;
        this.decay = 0.95;

        this.scene = scene;
    }
}
