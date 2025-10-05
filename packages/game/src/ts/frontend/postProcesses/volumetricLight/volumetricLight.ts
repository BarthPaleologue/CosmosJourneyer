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

import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { type AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { type Mesh } from "@babylonjs/core/Meshes/mesh";
import { VolumetricLightScatteringPostProcess } from "@babylonjs/core/PostProcesses/volumetricLightScatteringPostProcess";
import { type Scene } from "@babylonjs/core/scene";

import { type VolumetricLightUniforms } from "./volumetricLightUniforms";

export class VolumetricLight extends VolumetricLightScatteringPostProcess {
    constructor(
        starMesh: Mesh,
        volumetricLightUniforms: VolumetricLightUniforms,
        excludedMeshes: ReadonlyArray<AbstractMesh>,
        scene: Scene,
    ) {
        if (scene.activeCamera === null) throw new Error("no camera");
        super(
            `${starMesh.name}VolumetricLight`,
            1,
            null,
            starMesh,
            100,
            Texture.BILINEAR_SAMPLINGMODE,
            scene.getEngine(),
            false,
            scene,
        );

        // This is necessary because BabylonJS post process sets the scene using the camera. However, I don't pass a camera to the constructor as I use a PostProcessRenderPipeline.
        this._scene = scene;

        this.exposure = volumetricLightUniforms.exposure;
        this.decay = volumetricLightUniforms.decay;

        this.excludedMeshes = [...excludedMeshes];
    }
}
