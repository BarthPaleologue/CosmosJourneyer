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
import { Scene } from "@babylonjs/core/scene";

import { RingsModel } from "@/backend/universe/orbitalObjects/ringsModel";

import { DeepReadonly } from "@/utils/types";

import ringsLUT from "@shaders/textures/ringsLUT.glsl";

export class RingsLut {
    private readonly lut: ProceduralTexture;

    constructor(scene: Scene) {
        if (Effect.ShadersStore[`ringsLUTFragmentShader`] === undefined) {
            Effect.ShadersStore[`ringsLUTFragmentShader`] = ringsLUT;
        }

        this.lut = new ProceduralTexture(
            "ringsLUT",
            {
                width: 4096,
                height: 1,
            },
            "ringsLUT",
            scene,
            undefined,
            true,
            false,
        );

        this.lut.refreshRate = 0;
    }

    setModel(model: DeepReadonly<RingsModel>): void {
        this.lut.setFloat("seed", model.seed);
        this.lut.setFloat("frequency", model.ringFrequency);
        this.lut.setFloat("ringStart", model.ringStart);
        this.lut.setFloat("ringEnd", model.ringEnd);

        this.lut.resetRefreshCounter();
    }

    isReady(): boolean {
        return this.lut.isReady();
    }

    getTexture(): ProceduralTexture {
        return this.lut;
    }

    dispose() {
        this.lut.dispose();
    }
}
