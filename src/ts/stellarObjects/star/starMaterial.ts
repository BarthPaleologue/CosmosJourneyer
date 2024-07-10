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

import starMaterialFragment from "../../../shaders/starMaterial/fragment.glsl";
import starMaterialVertex from "../../../shaders/starMaterial/vertex.glsl";
import { Effect } from "@babylonjs/core/Materials/effect";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { ProceduralTexture } from "@babylonjs/core/Materials/Textures/Procedurals/proceduralTexture";
import lutFragment from "../../../shaders/starMaterial/utils/lut.glsl";
import { StellarObjectModel } from "../../architecture/stellarObject";
import { Textures } from "../../assets/textures";

const StarMaterialUniformNames = {
    WORLD: "world",
    WORLD_VIEW_PROJECTION: "worldViewProjection",
    SEED: "seed",
    STAR_COLOR: "starColor",
    TIME: "time"
};

const StarMaterialSamplerNames = {
    LUT: "lut"
};

export class StarMaterial extends ShaderMaterial {
    star: TransformNode;
    starModel: StellarObjectModel;
    starSeed: number;

    private elapsedSeconds = 0;

    constructor(star: TransformNode, model: StellarObjectModel, scene: Scene) {
        const shaderName = "starMaterial";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = starMaterialFragment;
        }
        if (Effect.ShadersStore[`${shaderName}VertexShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}VertexShader`] = starMaterialVertex;
        }

        super("starColor", scene, shaderName, {
            attributes: ["position"],
            uniforms: [...Object.values(StarMaterialUniformNames)],
            samplers: [...Object.values(StarMaterialSamplerNames)]
        });

        if (Effect.ShadersStore["starLutFragmentShader"] === undefined) {
            Effect.ShadersStore["starLutFragmentShader"] = lutFragment;
        }

        this.setTexture("lut", Textures.EMPTY_TEXTURE);
        const lut = new ProceduralTexture("lut", 4096, "starLut", scene, null, true, false);
        lut.refreshRate = 0;
        lut.executeWhenReady(() => {
            this.setTexture(StarMaterialSamplerNames.LUT, lut);
        });

        this.star = star;
        this.starModel = model;
        this.starSeed = model.seed;

        this.onBindObservable.add(() => {
            this.getEffect().setFloat(StarMaterialUniformNames.TIME, this.elapsedSeconds % 100000);
            this.getEffect().setColor3(StarMaterialUniformNames.STAR_COLOR, this.starModel.color);
            this.getEffect().setFloat(StarMaterialUniformNames.SEED, this.starSeed);
        });
    }

    public update(deltaSeconds: number) {
        this.elapsedSeconds += deltaSeconds;
    }
}
