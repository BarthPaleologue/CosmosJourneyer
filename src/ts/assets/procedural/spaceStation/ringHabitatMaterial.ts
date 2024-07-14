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

import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { Scene } from "@babylonjs/core/scene";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Transformable } from "../../../architecture/transformable";

import ringHabitatMaterialFragment from "../../../../shaders/ringHabitatMaterial/fragment.glsl";
import ringHabitatMaterialVertex from "../../../../shaders/ringHabitatMaterial/vertex.glsl";
import {
    setStellarObjectUniforms,
    StellarObjectUniformNames
} from "../../../postProcesses/uniforms/stellarObjectUniforms";
import { Textures } from "../../textures";
import { SpaceStationModel } from "../../../spacestation/spacestationModel";

const RingHabitatUniformNames = {
    WORLD: "world",
    WORLD_VIEW_PROJECTION: "worldViewProjection",
    CAMERA_POSITION: "cameraPosition",
    MEAN_RADIUS: "meanRadius",
    DELTA_RADIUS: "deltaRadius",
    HEIGHT: "height"
}

const RingHabitatSamplerNames = {
    ALBEDO: "albedo",
    NORMAL: "normal",
    METALLIC: "metallic",
    ROUGHNESS: "roughness",
    OCCLUSION: "occlusion",
}

export class RingHabitatMaterial extends ShaderMaterial {
    private stellarObjects: Transformable[] = [];

    constructor(stationModel: SpaceStationModel, meanRadius: number, deltaRadius: number, height: number, scene: Scene) {
        const shaderName = "ringHabitatMaterial";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = ringHabitatMaterialFragment;
        }
        if (Effect.ShadersStore[`${shaderName}VertexShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}VertexShader`] = ringHabitatMaterialVertex;
        }

        super(`RingHabitatMaterial`, scene, shaderName, {
            attributes: ["position", "normal", "uv"],
            uniforms: [
                ...Object.values(RingHabitatUniformNames),
                ...Object.values(StellarObjectUniformNames)
            ],
            samplers: [
                ...Object.values(RingHabitatSamplerNames),
            ]
        });


        this.onBindObservable.add(() => {
            const activeCamera = scene.activeCamera;
            if(activeCamera === null) {
                throw new Error("No active camera");
            }

            this.getEffect().setVector3(RingHabitatUniformNames.CAMERA_POSITION, activeCamera.globalPosition);
            this.getEffect().setFloat(RingHabitatUniformNames.MEAN_RADIUS, meanRadius);
            this.getEffect().setFloat(RingHabitatUniformNames.DELTA_RADIUS, deltaRadius);
            this.getEffect().setFloat(RingHabitatUniformNames.HEIGHT, height);

            setStellarObjectUniforms(this.getEffect(), this.stellarObjects);

            this.getEffect().setTexture(RingHabitatSamplerNames.ALBEDO, Textures.SPACE_STATION_ALBEDO);
            this.getEffect().setTexture(RingHabitatSamplerNames.NORMAL, Textures.SPACE_STATION_NORMAL);
            this.getEffect().setTexture(RingHabitatSamplerNames.METALLIC, Textures.SPACE_STATION_METALLIC);
            this.getEffect().setTexture(RingHabitatSamplerNames.ROUGHNESS, Textures.SPACE_STATION_ROUGHNESS);
            this.getEffect().setTexture(RingHabitatSamplerNames.OCCLUSION, Textures.SPACE_STATION_AMBIENT_OCCLUSION);
        });
    }

    update(stellarObjects: Transformable[]) {
        this.stellarObjects = stellarObjects;
    }
}