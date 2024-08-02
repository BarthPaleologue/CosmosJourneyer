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

import landingBayMaterialFragment from "../../../../shaders/landingBayMaterial/fragment.glsl";
import landingBayMaterialVertex from "../../../../shaders/landingBayMaterial/vertex.glsl";
import { setStellarObjectUniforms, StellarObjectUniformNames } from "../../../postProcesses/uniforms/stellarObjectUniforms";
import { Textures } from "../../textures";
import { DynamicTexture } from "@babylonjs/core";
import { Settings } from "../../../settings";
import { SpaceStationModel } from "../../../spacestation/spacestationModel";

const LandingBayUniformNames = {
    WORLD: "world",
    WORLD_VIEW_PROJECTION: "worldViewProjection",
    CAMERA_POSITION: "cameraPosition",
    MEAN_RADIUS: "meanRadius",
    DELTA_RADIUS: "deltaRadius",
    HEIGHT: "height"
};

const LandingBaySamplerNames = {
    ALBEDO: "albedoMap",
    NORMAL: "normalMap",
    METALLIC: "metallicMap",
    ROUGHNESS: "roughnessMap",
    OCCLUSION: "occlusionMap",
    NAME_PLATE: "namePlate"
};

export class LandingBayMaterial extends ShaderMaterial {
    private stellarObjects: Transformable[] = [];

    constructor(stationModel: SpaceStationModel, meanRadius: number, deltaRadius: number, height: number, scene: Scene) {
        const shaderName = "landingBayMaterial";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = landingBayMaterialFragment;
        }
        if (Effect.ShadersStore[`${shaderName}VertexShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}VertexShader`] = landingBayMaterialVertex;
        }

        super(`LandingBayMaterial`, scene, shaderName, {
            attributes: ["position", "normal", "uv"],
            uniforms: [...Object.values(LandingBayUniformNames), ...Object.values(StellarObjectUniformNames)],
            samplers: [...Object.values(LandingBaySamplerNames)]
        });

        const circumference = 2 * Math.PI * meanRadius;

        const aspectRatio = (0.5 * circumference) / deltaRadius;

        const textureResolution = 256;
        const namePlateTexture = new DynamicTexture(
            `NamePlateTexture`,
            {
                width: textureResolution * aspectRatio,
                height: textureResolution
            },
            scene
        );

        const font_size = 128;

        //Add text to dynamic texture
        namePlateTexture.drawText(stationModel.name, null, null, `${font_size}px ${Settings.MAIN_FONT}`, "white", null, true, true);

        this.onBindObservable.add(() => {
            const activeCamera = scene.activeCamera;
            if (activeCamera === null) {
                throw new Error("No active camera");
            }

            this.getEffect().setVector3(LandingBayUniformNames.CAMERA_POSITION, activeCamera.globalPosition);
            this.getEffect().setFloat(LandingBayUniformNames.MEAN_RADIUS, meanRadius);
            this.getEffect().setFloat(LandingBayUniformNames.DELTA_RADIUS, deltaRadius);
            this.getEffect().setFloat(LandingBayUniformNames.HEIGHT, height);

            setStellarObjectUniforms(this.getEffect(), this.stellarObjects);

            this.getEffect().setTexture(LandingBaySamplerNames.ALBEDO, Textures.SPACE_STATION_ALBEDO);
            this.getEffect().setTexture(LandingBaySamplerNames.NORMAL, Textures.SPACE_STATION_NORMAL);
            this.getEffect().setTexture(LandingBaySamplerNames.METALLIC, Textures.SPACE_STATION_METALLIC);
            this.getEffect().setTexture(LandingBaySamplerNames.ROUGHNESS, Textures.SPACE_STATION_ROUGHNESS);
            this.getEffect().setTexture(LandingBaySamplerNames.OCCLUSION, Textures.SPACE_STATION_AMBIENT_OCCLUSION);

            this.getEffect().setTexture(LandingBaySamplerNames.NAME_PLATE, namePlateTexture);
        });

        this.onDisposeObservable.add(() => {
            namePlateTexture.dispose();
        });
    }

    update(stellarObjects: Transformable[]) {
        this.stellarObjects = stellarObjects;
    }
}
