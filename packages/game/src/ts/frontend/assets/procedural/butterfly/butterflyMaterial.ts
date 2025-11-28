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
            const floatingOriginEnabled = scene.floatingOriginMode;

            setStellarObjectUniforms(this.getEffect(), this.stars, floatingOriginOffset);

            this.getEffect().setFloat(ButterflyMaterialUniformNames.TIME, this.elapsedSeconds);

            const activeCamera = this.scene.activeCamera;
            if (activeCamera === null) {
                console.error("No active camera in the scene");
                return;
            }
            this.getEffect().setVector3(
                ButterflyMaterialUniformNames.CAMERA_POSITION,
                floatingOriginEnabled ? Vector3.ZeroReadOnly : activeCamera.globalPosition,
            );
        });

        this.scene = scene;
    }

    update(stars: ReadonlyArray<PointLight>, deltaSeconds: number) {
        this.elapsedSeconds += deltaSeconds;
        this.stars = stars;
    }
}
