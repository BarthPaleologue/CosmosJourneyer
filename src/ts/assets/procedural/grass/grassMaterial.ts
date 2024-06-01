//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Effect } from "@babylonjs/core/Materials/effect";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { Scene } from "@babylonjs/core/scene";

import grassFragment from "../../../../shaders/grassMaterial/grassFragment.glsl";
import grassVertex from "../../../../shaders/grassMaterial/grassVertex.glsl";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import perlinNoise from "../../../../asset/perlin.png";
import { Transformable } from "../../../architecture/transformable";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import {
    setStellarObjectUniforms,
    StellarObjectUniformNames
} from "../../../postProcesses/uniforms/stellarObjectUniforms";

const GrassMaterialUniformNames = {
    WORLD: "world",
    WORLD_VIEW: "worldView",
    WORLD_VIEW_PROJECTION: "worldViewProjection",
    VIEW: "view",
    PROJECTION: "projection",
    VIEW_PROJECTION: "viewProjection",
    TIME: "time",
    CAMERA_POSITION: "cameraPosition",
    PLAYER_POSITION: "playerPosition"
};

const GrassMaterialSamplerNames = {
    PERLIN_NOISE: "perlinNoise"
};

export class GrassMaterial extends ShaderMaterial {
    private elapsedSeconds = 0;
    private stars: Transformable[] = [];
    private playerPosition: Vector3 = Vector3.Zero();

    private scene: Scene;

    constructor(scene: Scene, isDepthMaterial: boolean) {
        const shaderName = "grassMaterial";
        Effect.ShadersStore[`${shaderName}FragmentShader`] = grassFragment;
        Effect.ShadersStore[`${shaderName}VertexShader`] = grassVertex;

        const defines = ["#define INSTANCES"];
        if (isDepthMaterial) defines.push("#define FORDEPTH");

        const uniforms = [...Object.values(GrassMaterialUniformNames), ...Object.values(StellarObjectUniformNames)];
        if (isDepthMaterial) uniforms.push("depthValues");

        super(shaderName, scene, shaderName, {
            attributes: ["position", "normal"],
            uniforms: uniforms,
            defines: defines,
            samplers: [...Object.values(GrassMaterialSamplerNames)]
        });

        const perlinTexture = new Texture(perlinNoise, scene);

        this.backFaceCulling = false;
        this.setTexture("perlinNoise", perlinTexture);

        this.onBindObservable.add(() => {
            setStellarObjectUniforms(this.getEffect(), this.stars);

            this.getEffect().setVector3(GrassMaterialUniformNames.PLAYER_POSITION, this.playerPosition);
            this.getEffect().setFloat(GrassMaterialUniformNames.TIME, this.elapsedSeconds);

            const activeCamera = this.scene.activeCamera;
            if (activeCamera === null) throw new Error("No active camera in the scene");
            this.getEffect().setVector3(GrassMaterialUniformNames.CAMERA_POSITION, activeCamera.globalPosition);
        });

        this.scene = scene;
    }

    update(stars: Transformable[], playerPosition: Vector3, deltaSeconds: number) {
        this.elapsedSeconds += deltaSeconds;
        this.stars = stars;
        this.playerPosition = playerPosition;
    }
}
