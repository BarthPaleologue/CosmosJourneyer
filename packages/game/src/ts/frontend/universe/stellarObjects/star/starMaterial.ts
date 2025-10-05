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
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { type Scene } from "@babylonjs/core/scene";

import { createEmptyTexture } from "@/frontend/assets/procedural/proceduralTexture";

import type { RGBColor } from "@/utils/colors";
import { type ItemPool } from "@/utils/itemPool";
import { getRgbFromTemperature } from "@/utils/specrend";

import { type StarMaterialLut } from "./starMaterialLut";

import starMaterialFragment from "@shaders/starMaterial/fragment.glsl";
import starMaterialVertex from "@shaders/starMaterial/vertex.glsl";

const StarMaterialUniformNames = {
    WORLD: "world",
    WORLD_VIEW_PROJECTION: "worldViewProjection",
    SEED: "seed",
    STAR_COLOR: "starColor",
    TIME: "time",
};

const StarMaterialSamplerNames = {
    LUT: "lut",
};

export class StarMaterial extends ShaderMaterial {
    private readonly starSeed: number;

    private readonly starColor: RGBColor;

    private elapsedSeconds = 0;

    constructor(seed: number, temperature: number, starLutPool: ItemPool<StarMaterialLut>, scene: Scene) {
        const shaderName = "starMaterial";
        Effect.ShadersStore[`${shaderName}FragmentShader`] ??= starMaterialFragment;
        Effect.ShadersStore[`${shaderName}VertexShader`] ??= starMaterialVertex;

        super("starColor", scene, shaderName, {
            attributes: ["position"],
            uniforms: [...Object.values(StarMaterialUniformNames)],
            samplers: [...Object.values(StarMaterialSamplerNames)],
        });

        const emptyTexture = createEmptyTexture(scene);

        this.setTexture("lut", emptyTexture);
        const lut = starLutPool.get();
        lut.getTexture().executeWhenReady(() => {
            this.setTexture(StarMaterialSamplerNames.LUT, lut.getTexture());
            emptyTexture.dispose();
        });

        this.starSeed = seed;

        this.starColor = getRgbFromTemperature(temperature);

        this.onBindObservable.add(() => {
            this.getEffect().setFloat(StarMaterialUniformNames.TIME, this.elapsedSeconds % 100000);
            this.getEffect().setColor3(StarMaterialUniformNames.STAR_COLOR, this.starColor);
            this.getEffect().setFloat(StarMaterialUniformNames.SEED, this.starSeed);
        });

        this.onDisposeObservable.addOnce(() => {
            starLutPool.release(lut);
            emptyTexture.dispose();
        });
    }

    public update(deltaSeconds: number) {
        this.elapsedSeconds += deltaSeconds;
    }
}
