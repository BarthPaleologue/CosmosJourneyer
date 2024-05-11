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

import volumetricCloudsFragment from "../../shaders/volumetricCloudsFragment.glsl";
import { ObjectPostProcess } from "../postProcesses/objectPostProcess";
import { FlatCloudsPostProcess } from "./flatCloudsPostProcess";
import { Effect } from "@babylonjs/core/Materials/effect";
import { CloudsUniforms } from "./cloudsUniforms";

import { BoundingSphere } from "../architecture/boundingSphere";
import { Transformable } from "../architecture/transformable";
import { StellarObject } from "../architecture/stellarObject";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { ObjectUniformNames, setObjectUniforms } from "../postProcesses/uniforms/objectUniforms";
import { setStellarObjectUniforms, StellarObjectUniformNames } from "../postProcesses/uniforms/stellarObjectUniforms";
import { CameraUniformNames, setCameraUniforms } from "../postProcesses/uniforms/cameraUniforms";
import { SamplerUniformNames, setSamplerUniforms } from "../postProcesses/uniforms/samplerUniforms";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Constants } from "@babylonjs/core/Engines/constants";
import { Scene } from "@babylonjs/core/scene";

export type CloudsPostProcess = FlatCloudsPostProcess | VolumetricCloudsPostProcess;

export class VolumetricCloudsPostProcess extends PostProcess implements ObjectPostProcess {
    readonly cloudUniforms: CloudsUniforms;
    readonly object: Transformable;

    private activeCamera: Camera | null = null;

    constructor(name: string, planet: Transformable & BoundingSphere, cloudsUniforms: CloudsUniforms, scene: Scene, stars: StellarObject[]) {
        const shaderName = "volumetricClouds";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = volumetricCloudsFragment;
        }

        const VolumetricCloudsUniformNames = {
            CLOUD_LAYER_MIN_HEIGHT: "cloudLayerMinHeight",
            CLOUD_LAYER_MAX_HEIGHT: "cloudLayerMaxHeight"
        };

        const uniforms: string[] = [
            ...Object.values(ObjectUniformNames),
            ...Object.values(StellarObjectUniformNames),
            ...Object.values(CameraUniformNames),
            ...Object.values(VolumetricCloudsUniformNames)
        ];

        const samplers: string[] = Object.values(SamplerUniformNames);

        super(name, shaderName, uniforms, samplers, 1, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, null, Constants.TEXTURETYPE_HALF_FLOAT);

        this.object = planet;
        this.cloudUniforms = cloudsUniforms;

        this.onActivateObservable.add((camera) => {
            this.activeCamera = camera;
        });

        this.onApplyObservable.add((effect) => {
            if (this.activeCamera === null) {
                throw new Error("Camera is null");
            }

            setCameraUniforms(effect, this.activeCamera);
            setObjectUniforms(effect, planet);
            setStellarObjectUniforms(effect, stars);

            effect.setFloat(VolumetricCloudsUniformNames.CLOUD_LAYER_MIN_HEIGHT, planet.getBoundingRadius());
            effect.setFloat(VolumetricCloudsUniformNames.CLOUD_LAYER_MAX_HEIGHT, planet.getBoundingRadius() + 30e3);

            setSamplerUniforms(effect, this.activeCamera, scene);
        });
    }
}
