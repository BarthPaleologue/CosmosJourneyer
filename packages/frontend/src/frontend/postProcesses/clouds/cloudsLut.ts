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

import { Effect } from "@babylonjs/core/Materials/effect";
import { ProceduralTexture } from "@babylonjs/core/Materials/Textures/Procedurals/proceduralTexture";
import { type Scene } from "@babylonjs/core/scene";

import { type CloudsModel } from "@/backend/universe/orbitalObjects/cloudsModel";

import { type DeepReadonly } from "@/utils/types";

import flatCloudLUT from "@shaders/textures/flatCloudLUT.glsl";

export class CloudsLut {
    private readonly lut: ProceduralTexture;

    constructor(scene: Scene) {
        if (Effect.ShadersStore[`flatCloudsLUTFragmentShader`] === undefined) {
            Effect.ShadersStore[`flatCloudsLUTFragmentShader`] = flatCloudLUT;
        }

        this.lut = new ProceduralTexture("flatCloudLUT", 4096, "flatCloudsLUT", scene, undefined, true, false);
        this.lut.refreshRate = 0;
    }

    isReady(): boolean {
        return this.lut.isReady();
    }

    setModel(model: DeepReadonly<CloudsModel>) {
        this.lut.setFloat("worleyFrequency", model.frequency);
        this.lut.setFloat("detailFrequency", model.detailFrequency);
        this.lut.resetRefreshCounter();
    }

    getTexture(): ProceduralTexture {
        return this.lut;
    }

    dispose() {
        this.lut.dispose();
    }
}
