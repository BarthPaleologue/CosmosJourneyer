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

import grassFragment from "../../../shaders/grassMaterial/grassFragment.glsl";
import grassVertex from "../../../shaders/grassMaterial/grassVertex.glsl";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import perlinNoise from "../../../asset/perlin.png";
import { Transformable } from "../../architecture/transformable";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export class GrassMaterial extends ShaderMaterial {
    private elapsedSeconds = 0;
    private stars: Transformable[] = [];
    private playerPosition: Vector3 = Vector3.Zero();

    constructor(scene: Scene) {
        const shaderName = "grassMaterial";
        Effect.ShadersStore[`${shaderName}FragmentShader`] = grassFragment;
        Effect.ShadersStore[`${shaderName}VertexShader`] = grassVertex;

        super(shaderName, scene, shaderName, {
            attributes: ["position", "normal"],
            uniforms: ["world", "worldView", "worldViewProjection", "view", "projection", "viewProjection", "time", "lightDirection", "cameraPosition", "playerPosition"],
            defines: ["#define INSTANCES"],
            samplers: ["perlinNoise"]
        });

        const perlinTexture = new Texture(perlinNoise, scene);

        this.backFaceCulling = false;
        this.setTexture("perlinNoise", perlinTexture);

        this.onBindObservable.add(() => {
            if (this.stars.length > 0) {
                const star = this.stars[0];
                const lightDirection = star.getTransform().getAbsolutePosition().subtract(this.playerPosition).normalize();
                this.getEffect().setVector3("lightDirection", lightDirection);
            }

            this.getEffect().setVector3("playerPosition", this.playerPosition);
            this.getEffect().setFloat("time", this.elapsedSeconds);
        });
    }

    update(stars: Transformable[], playerPosition: Vector3, deltaSeconds: number) {
        this.elapsedSeconds += deltaSeconds;
        this.stars = stars;
        this.playerPosition = playerPosition;

    }
}
