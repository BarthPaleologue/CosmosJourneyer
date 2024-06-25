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

import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { Scene } from "@babylonjs/core/scene";
import { Effect } from "@babylonjs/core/Materials/effect";
import { setStellarObjectUniforms, StellarObjectUniformNames } from "../../../postProcesses/uniforms/stellarObjectUniforms";
import { Transformable } from "../../../architecture/transformable";

import metalSectionMaterialFragment from "../../../../shaders/metalSectionMaterial/fragment.glsl";
import metalSectionMaterialVertex from "../../../../shaders/metalSectionMaterial/vertex.glsl";
import { Textures } from "../../textures";

const MetalSectionUniformNames = {
    WORLD: "world",
    WORLD_VIEW_PROJECTION: "worldViewProjection",
    CAMERA_POSITION: "cameraPosition"
};

const MetalSectionSamplerNames = {
    ALBEDO_MAP: "albedoMap",
    NORMAL_MAP: "normalMap",
    METALLIC_MAP: "metallicMap",
    ROUGHNESS_MAP: "roughnessMap",
};

export class MetalSectionMaterial extends ShaderMaterial {
    private stellarObjects: Transformable[] = [];

    constructor(scene: Scene) {
        const shaderName = "metalSectionMaterial";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = metalSectionMaterialFragment;
        }
        if (Effect.ShadersStore[`${shaderName}VertexShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}VertexShader`] = metalSectionMaterialVertex;
        }

        super(`MetalSectionMaterial`, scene, shaderName, {
            attributes: ["position", "normal", "uv"],
            uniforms: [...Object.values(MetalSectionUniformNames), ...Object.values(StellarObjectUniformNames)],
            samplers: [...Object.values(MetalSectionSamplerNames)]
        });

        this.onBindObservable.add(() => {
            const activeCamera = scene.activeCamera;
            if (activeCamera === null) {
                throw new Error("No active camera");
            }

            this.getEffect().setVector3(MetalSectionUniformNames.CAMERA_POSITION, activeCamera.globalPosition);

            this.getEffect().setTexture(MetalSectionSamplerNames.ALBEDO_MAP, Textures.METAL_PANELS_ALBEDO);
            this.getEffect().setTexture(MetalSectionSamplerNames.NORMAL_MAP, Textures.METAL_PANELS_NORMAL);
            this.getEffect().setTexture(MetalSectionSamplerNames.METALLIC_MAP, Textures.METAL_PANELS_METALLIC);
            this.getEffect().setTexture(MetalSectionSamplerNames.ROUGHNESS_MAP, Textures.METAL_PANELS_ROUGHNESS);

            setStellarObjectUniforms(this.getEffect(), this.stellarObjects);
        });
    }

    update(stellarObjects: Transformable[]): void {
        this.stellarObjects = stellarObjects;
    }
}
