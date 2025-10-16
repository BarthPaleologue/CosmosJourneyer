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

import { type PointLight } from "@babylonjs/core/Lights/pointLight";
import { Effect } from "@babylonjs/core/Materials/effect";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { type Scene } from "@babylonjs/core/scene";

import { OffsetWorldToRef } from "@/frontend/helpers/floatingOrigin";
import {
    setStellarObjectUniforms,
    StellarObjectUniformNames,
} from "@/frontend/postProcesses/uniforms/stellarObjectUniforms";

import { type NoiseTextures } from "../../textures";

import grassFragment from "@shaders/grassMaterial/grassFragment.glsl";
import grassVertex from "@shaders/grassMaterial/grassVertex.glsl";

const GrassMaterialUniformNames = {
    WORLD: "world",
    WORLD_VIEW: "worldView",
    WORLD_VIEW_PROJECTION: "worldViewProjection",
    VIEW: "view",
    PROJECTION: "projection",
    VIEW_PROJECTION: "viewProjection",
    TIME: "time",
    CAMERA_POSITION: "cameraPosition",
    PLAYER_POSITION: "playerPosition",
    PLANET_POSITION: "planetPosition",
    PLANET_WORLD: "planetWorld",
};

const GrassMaterialSamplerNames = {
    PERLIN_NOISE: "perlinNoise",
};

export class GrassMaterial extends ShaderMaterial {
    private elapsedSeconds = 0;
    private stars: ReadonlyArray<PointLight> = [];
    private playerPosition: Vector3 = Vector3.Zero();

    private scene: Scene;

    private planet: TransformNode | null = null;

    constructor(scene: Scene, noiseTextures: NoiseTextures, isDepthMaterial: boolean) {
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
            samplers: [...Object.values(GrassMaterialSamplerNames)],
        });

        this.backFaceCulling = false;
        this.setTexture("perlinNoise", noiseTextures.seamlessPerlin);

        const tempPlayerPosition = Vector3.Zero();
        const tempCameraPosition = Vector3.Zero();
        const tempPlanetPosition = Vector3.Zero();
        const tempPlanetWorld = new Matrix();
        this.onBindObservable.add(() => {
            const floatingOriginOffset = scene.floatingOriginOffset;
            const floatingOriginEnabled = scene.floatingOriginMode;

            setStellarObjectUniforms(this.getEffect(), this.stars, floatingOriginOffset);

            this.getEffect().setVector3(
                GrassMaterialUniformNames.PLAYER_POSITION,
                this.playerPosition.subtractToRef(floatingOriginOffset, tempPlayerPosition),
            );
            this.getEffect().setFloat(GrassMaterialUniformNames.TIME, this.elapsedSeconds);

            const activeCamera = this.scene.activeCamera;
            if (activeCamera === null) {
                console.warn("No active camera in the scene");
                return;
            }

            this.getEffect().setVector3(
                GrassMaterialUniformNames.CAMERA_POSITION,
                floatingOriginEnabled
                    ? Vector3.ZeroReadOnly
                    : activeCamera.getWorldMatrix().getTranslationToRef(tempCameraPosition),
            );

            if (this.planet !== null) {
                this.getEffect().setVector3(
                    GrassMaterialUniformNames.PLANET_POSITION,
                    this.planet.getAbsolutePosition().subtractToRef(floatingOriginOffset, tempPlanetPosition),
                );
                this.getEffect().setMatrix(
                    GrassMaterialUniformNames.PLANET_WORLD,
                    OffsetWorldToRef(floatingOriginOffset, this.planet.getWorldMatrix(), tempPlanetWorld),
                );
            }
        });

        this.scene = scene;
    }

    setPlanet(planet: TransformNode) {
        this.planet = planet;
    }

    update(stars: ReadonlyArray<PointLight>, playerPosition: Vector3, deltaSeconds: number) {
        this.elapsedSeconds += deltaSeconds;
        this.stars = stars;
        this.playerPosition = playerPosition;
    }
}
