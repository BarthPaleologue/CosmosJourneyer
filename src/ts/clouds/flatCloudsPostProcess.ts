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

import flatCloudsFragment from "../../shaders/flatCloudsFragment.glsl";
import { ObjectPostProcess, UpdatablePostProcess } from "../postProcesses/objectPostProcess";
import { Transformable } from "../architecture/transformable";
import { CloudsSamplerNames, CloudsUniformNames, CloudsUniforms } from "./cloudsUniforms";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { ObjectUniformNames, setObjectUniforms } from "../postProcesses/uniforms/objectUniforms";
import { setStellarObjectUniforms, StellarObjectUniformNames } from "../postProcesses/uniforms/stellarObjectUniforms";
import { CameraUniformNames, setCameraUniforms } from "../postProcesses/uniforms/cameraUniforms";
import { SamplerUniformNames, setSamplerUniforms } from "../postProcesses/uniforms/samplerUniforms";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Constants } from "@babylonjs/core/Engines/constants";
import { BoundingSphere } from "../architecture/boundingSphere";
import { Scene } from "@babylonjs/core/scene";

export class FlatCloudsPostProcess extends PostProcess implements ObjectPostProcess, UpdatablePostProcess {
    readonly cloudUniforms: CloudsUniforms;
    readonly object: Transformable & BoundingSphere;

    private activeCamera: Camera | null = null;

    constructor(name: string, planet: Transformable & BoundingSphere, cloudUniforms: CloudsUniforms, scene: Scene, stellarObjects: Transformable[]) {
        const shaderName = "flatClouds";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = flatCloudsFragment;
        }

        const uniforms: string[] = [
            ...Object.values(ObjectUniformNames),
            ...Object.values(StellarObjectUniformNames),
            ...Object.values(CameraUniformNames),
            ...Object.values(CloudsUniformNames)
        ];

        const samplers: string[] = [...Object.values(SamplerUniformNames), ...Object.values(CloudsSamplerNames)];

        super(name, shaderName, uniforms, samplers, 1, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, null, Constants.TEXTURETYPE_HALF_FLOAT);

        this.object = planet;
        this.cloudUniforms = cloudUniforms;

        this.onActivateObservable.add((camera) => {
            this.activeCamera = camera;
        });

        this.onApplyObservable.add((effect) => {
            if (this.activeCamera === null) {
                throw new Error("FlatCloudsPostProcess: activeCamera is null");
            }
            setCameraUniforms(effect, this.activeCamera);
            setStellarObjectUniforms(effect, stellarObjects);
            setObjectUniforms(effect, this.object);
            this.cloudUniforms.setUniforms(effect);

            this.cloudUniforms.setSamplers(effect);
            setSamplerUniforms(effect, this.activeCamera, scene);
        });
    }

    public update(deltaTime: number): void {
        this.cloudUniforms.update(deltaTime);
    }
}
