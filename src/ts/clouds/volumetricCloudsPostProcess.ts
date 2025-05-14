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

import { Camera } from "@babylonjs/core/Cameras/camera";
import { Constants } from "@babylonjs/core/Engines/constants";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { Scene } from "@babylonjs/core/scene";

import { CameraUniformNames, setCameraUniforms } from "../postProcesses/uniforms/cameraUniforms";
import { ObjectUniformNames, setObjectUniforms } from "../postProcesses/uniforms/objectUniforms";
import { SamplerUniformNames, setSamplerUniforms } from "../postProcesses/uniforms/samplerUniforms";
import { setStellarObjectUniforms, StellarObjectUniformNames } from "../postProcesses/uniforms/stellarObjectUniforms";
import { CloudsUniforms } from "./cloudsUniforms";
import { FlatCloudsPostProcess } from "./flatCloudsPostProcess";

import volumetricCloudsFragment from "@shaders/volumetricCloudsFragment.glsl";

export type CloudsPostProcess = FlatCloudsPostProcess | VolumetricCloudsPostProcess;

export class VolumetricCloudsPostProcess extends PostProcess {
    readonly cloudUniforms: CloudsUniforms;

    private activeCamera: Camera | null = null;

    constructor(
        name: string,
        transform: TransformNode,
        boundingRadius: number,
        cloudsUniforms: CloudsUniforms,
        scene: Scene,
        stars: ReadonlyArray<PointLight>,
    ) {
        const shaderName = "volumetricClouds";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = volumetricCloudsFragment;
        }

        const VolumetricCloudsUniformNames = {
            CLOUD_LAYER_MIN_HEIGHT: "cloudLayerMinHeight",
            CLOUD_LAYER_MAX_HEIGHT: "cloudLayerMaxHeight",
        };

        const uniforms: string[] = [
            ...Object.values(ObjectUniformNames),
            ...Object.values(StellarObjectUniformNames),
            ...Object.values(CameraUniformNames),
            ...Object.values(VolumetricCloudsUniformNames),
        ];

        const samplers: string[] = Object.values(SamplerUniformNames);

        super(
            name,
            shaderName,
            uniforms,
            samplers,
            1,
            null,
            Texture.BILINEAR_SAMPLINGMODE,
            scene.getEngine(),
            false,
            null,
            Constants.TEXTURETYPE_HALF_FLOAT,
        );

        this.cloudUniforms = cloudsUniforms;

        this.onActivateObservable.add((camera) => {
            this.activeCamera = camera;
        });

        this.onApplyObservable.add((effect) => {
            if (this.activeCamera === null) {
                throw new Error("Camera is null");
            }

            setCameraUniforms(effect, this.activeCamera);
            setObjectUniforms(effect, transform, boundingRadius);
            setStellarObjectUniforms(effect, stars);

            effect.setFloat(VolumetricCloudsUniformNames.CLOUD_LAYER_MIN_HEIGHT, boundingRadius);
            effect.setFloat(VolumetricCloudsUniformNames.CLOUD_LAYER_MAX_HEIGHT, boundingRadius + 30e3);

            setSamplerUniforms(effect, this.activeCamera, scene);
        });
    }
}
