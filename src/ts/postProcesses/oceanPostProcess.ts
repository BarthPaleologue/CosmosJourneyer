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

import oceanFragment from "../../shaders/oceanFragment.glsl";
import { UpdatablePostProcess } from "./updatablePostProcess";
import { Transformable } from "../architecture/transformable";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { CameraUniformNames, setCameraUniforms } from "./uniforms/cameraUniforms";
import { setStellarObjectUniforms, StellarObjectUniformNames } from "./uniforms/stellarObjectUniforms";
import { ObjectUniformNames, setObjectUniforms } from "./uniforms/objectUniforms";
import { SamplerUniformNames, setSamplerUniforms } from "./uniforms/samplerUniforms";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Constants } from "@babylonjs/core/Engines/constants";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { Scene } from "@babylonjs/core/scene";
import { Textures } from "../assets/textures";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { TelluricPlanetaryMassObjectModel } from "../planets/telluricPlanet/telluricPlanetaryMassObjectModel";

export type OceanUniforms = {
    smoothness: number;
    specularPower: number;
    depthModifier: number;
    alphaModifier: number;
    waveBlendingSharpness: number;
    time: number;
};

export class OceanPostProcess extends PostProcess implements UpdatablePostProcess {
    readonly oceanUniforms: OceanUniforms;
    readonly planetTransform: TransformNode;

    private activeCamera: Camera | null = null;

    constructor(planetTransform: TransformNode, boundingRadius: number, planetModel: TelluricPlanetaryMassObjectModel, stellarObjects: Transformable[], scene: Scene) {
        const shaderName = "ocean";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = oceanFragment;
        }

        const oceanUniforms: OceanUniforms = {
            depthModifier: 0.0015,
            alphaModifier: 0.0025,
            specularPower: 1.0,
            smoothness: 0.8,
            waveBlendingSharpness: 0.5,
            time: 0
        };

        const OceanUniformNames = {
            OCEAN_RADIUS: "ocean_radius",
            OCEAN_SMOOTHNESS: "ocean_smoothness",
            OCEAN_SPECULAR_POWER: "ocean_specularPower",
            OCEAN_ALPHA_MODIFIER: "ocean_alphaModifier",
            OCEAN_DEPTH_MODIFIER: "ocean_depthModifier",
            OCEAN_WAVE_BLENDING_SHARPNESS: "ocean_waveBlendingSharpness",
            PLANET_INVERSE_ROTATION_MATRIX: "planetInverseRotationMatrix",
            TIME: "time"
        };

        const uniforms: string[] = [
            ...Object.values(CameraUniformNames),
            ...Object.values(StellarObjectUniformNames),
            ...Object.values(ObjectUniformNames),
            ...Object.values(OceanUniformNames)
        ];

        const OceanSamplerNames = {
            NORMAL_MAP_1: "normalMap1",
            NORMAL_MAP_2: "normalMap2"
        };

        const samplers: string[] = [...Object.values(SamplerUniformNames), ...Object.values(OceanSamplerNames)];

        super(
            `${planetModel.name}OceanPostProcess`,
            shaderName,
            uniforms,
            samplers,
            1,
            null,
            Texture.BILINEAR_SAMPLINGMODE,
            scene.getEngine(),
            false,
            null,
            Constants.TEXTURETYPE_HALF_FLOAT
        );

        this.planetTransform = planetTransform;
        this.oceanUniforms = oceanUniforms;

        this.onActivateObservable.add((camera) => (this.activeCamera = camera));

        this.onApplyObservable.add((effect) => {
            if (this.activeCamera === null) {
                throw new Error("Camera is null");
            }

            setCameraUniforms(effect, this.activeCamera);
            setStellarObjectUniforms(effect, stellarObjects);
            setObjectUniforms(effect, planetTransform, boundingRadius);

            effect.setFloat(OceanUniformNames.OCEAN_RADIUS, planetModel.radius + planetModel.physics.oceanLevel);
            effect.setFloat(OceanUniformNames.OCEAN_SMOOTHNESS, oceanUniforms.smoothness);
            effect.setFloat(OceanUniformNames.OCEAN_SPECULAR_POWER, oceanUniforms.specularPower);
            effect.setFloat(OceanUniformNames.OCEAN_ALPHA_MODIFIER, oceanUniforms.alphaModifier);
            effect.setFloat(OceanUniformNames.OCEAN_DEPTH_MODIFIER, oceanUniforms.depthModifier);
            effect.setFloat(OceanUniformNames.OCEAN_WAVE_BLENDING_SHARPNESS, oceanUniforms.waveBlendingSharpness);
            effect.setMatrix(OceanUniformNames.PLANET_INVERSE_ROTATION_MATRIX, planetTransform.getWorldMatrix().getRotationMatrix().transpose());
            effect.setFloat(OceanUniformNames.TIME, oceanUniforms.time % 100000); //TODO: do not hardcode the 100000

            setSamplerUniforms(effect, this.activeCamera, scene);
            effect.setTexture(OceanSamplerNames.NORMAL_MAP_1, Textures.WATER_NORMAL_MAP_1);
            effect.setTexture(OceanSamplerNames.NORMAL_MAP_2, Textures.WATER_NORMAL_MAP_2);
        });
    }

    public update(deltaTime: number) {
        this.oceanUniforms.time += deltaTime;
    }
}
