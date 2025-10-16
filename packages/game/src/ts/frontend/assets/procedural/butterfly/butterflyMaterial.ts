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
import { type Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { type Scene } from "@babylonjs/core/scene";

import {
    setStellarObjectUniforms,
    StellarObjectUniformNames,
} from "@/frontend/postProcesses/uniforms/stellarObjectUniforms";

import butterflyFragment from "@shaders/butterflyMaterial/butterflyFragment.glsl";
import butterflyVertex from "@shaders/butterflyMaterial/butterflyVertex.glsl";

const ButterflyMaterialUniformNames = {
    WORLD: "world",
    WORLD_VIEW: "worldView",
    WORLD_VIEW_PROJECTION: "worldViewProjection",
    VIEW: "view",
    PROJECTION: "projection",
    VIEW_PROJECTION: "viewProjection",
    TIME: "time",
    PLAYER_POSITION: "playerPosition",
    CAMERA_POSITION: "cameraPosition",
    PLANET_POSITION: "planetPosition",
    PLANET_WORLD: "planetWorld",
};

const ButterflyMaterialSamplerNames = {
    BUTTERFLY_TEXTURE: "butterflyTexture",
};

export class ButterflyMaterial extends ShaderMaterial {
    private elapsedSeconds = 0;
    private stars: ReadonlyArray<PointLight> = [];
    private playerPosition: Vector3 = Vector3.Zero();

    private planet: TransformNode | null = null;

    private scene: Scene;

    constructor(butterflyTexture: Texture, scene: Scene, isDepthMaterial: boolean) {
        const shaderName = "butterflyMaterial";
        Effect.ShadersStore[`${shaderName}FragmentShader`] = butterflyFragment;
        Effect.ShadersStore[`${shaderName}VertexShader`] = butterflyVertex;

        const defines = ["#define INSTANCES"];
        if (isDepthMaterial) defines.push("#define FORDEPTH");

        const uniforms = [...Object.values(ButterflyMaterialUniformNames), ...Object.values(StellarObjectUniformNames)];
        if (isDepthMaterial) uniforms.push("depthValues");

        super(shaderName, scene, shaderName, {
            attributes: ["position", "normal", "uv"],
            uniforms: uniforms,
            defines: defines,
            samplers: [...Object.values(ButterflyMaterialSamplerNames)],
        });

        this.backFaceCulling = false;
        this.setTexture(ButterflyMaterialSamplerNames.BUTTERFLY_TEXTURE, butterflyTexture);

        this.onBindObservable.add(() => {
            const floatingOriginOffset = scene.floatingOriginOffset;
            setStellarObjectUniforms(this.getEffect(), this.stars, floatingOriginOffset);

            this.getEffect().setVector3(ButterflyMaterialUniformNames.PLAYER_POSITION, this.playerPosition);
            this.getEffect().setFloat(ButterflyMaterialUniformNames.TIME, this.elapsedSeconds);

            const activeCamera = this.scene.activeCamera;
            if (activeCamera === null) throw new Error("No active camera in the scene");
            this.getEffect().setVector3(ButterflyMaterialUniformNames.CAMERA_POSITION, activeCamera.globalPosition);

            if (this.planet !== null) {
                this.getEffect().setVector3(
                    ButterflyMaterialUniformNames.PLANET_POSITION,
                    this.planet.getAbsolutePosition(),
                );
                this.getEffect().setMatrix(ButterflyMaterialUniformNames.PLANET_WORLD, this.planet.getWorldMatrix());
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
