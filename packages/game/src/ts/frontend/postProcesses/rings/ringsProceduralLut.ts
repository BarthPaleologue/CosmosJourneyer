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
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { type Scene } from "@babylonjs/core/scene";

import { type ProceduralRingsModel } from "@/backend/universe/orbitalObjects/ringsModel";

import { type DeepReadonly } from "@/utils/types";

import ringsPatternLutCode from "@shaders/textures/ringsPatternLUT.glsl";

export class RingsProceduralPatternLut {
    private readonly lut: ProceduralTexture;

    constructor(scene: Scene) {
        if (Effect.ShadersStore[`ringsLUTFragmentShader`] === undefined) {
            Effect.ShadersStore[`ringsLUTFragmentShader`] = ringsPatternLutCode;
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

    setModel(model: DeepReadonly<ProceduralRingsModel>): void {
        this.lut.setFloat("seed", model.seed);
        this.lut.setFloat("frequency", model.frequency);
        this.lut.setColor3("iceAlbedo", Color3.FromArray([model.iceAlbedo.r, model.iceAlbedo.g, model.iceAlbedo.b]));
        this.lut.setColor3(
            "dustAlbedo",
            Color3.FromArray([model.dustAlbedo.r, model.dustAlbedo.g, model.dustAlbedo.b]),
        );
        this.lut.setFloat("innerRadius", model.innerRadius);
        this.lut.setFloat("outerRadius", model.outerRadius);

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
