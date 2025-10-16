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

import { type Camera } from "@babylonjs/core/Cameras/camera";
import { Constants } from "@babylonjs/core/Engines/constants";
import { type PointLight } from "@babylonjs/core/Lights/pointLight";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { type Scene } from "@babylonjs/core/scene";

import { CameraUniformNames, setCameraUniforms } from "@/frontend/postProcesses/uniforms/cameraUniforms";
import { ObjectUniformNames, setObjectUniforms } from "@/frontend/postProcesses/uniforms/objectUniforms";
import { SamplerUniformNames, setSamplerUniforms } from "@/frontend/postProcesses/uniforms/samplerUniforms";
import {
    setStellarObjectUniforms,
    StellarObjectUniformNames,
} from "@/frontend/postProcesses/uniforms/stellarObjectUniforms";
import { type UpdatablePostProcess } from "@/frontend/postProcesses/updatablePostProcess";

import { CloudsSamplerNames, CloudsUniformNames, type CloudsUniforms } from "./cloudsUniforms";

import flatCloudsFragment from "@shaders/flatCloudsFragment.glsl";

export class FlatCloudsPostProcess extends PostProcess implements UpdatablePostProcess {
    readonly cloudUniforms: CloudsUniforms;

    private activeCamera: Camera | null = null;

    constructor(
        planetTransform: TransformNode,
        boundingRadius: number,
        cloudUniforms: CloudsUniforms,
        stellarObjects: ReadonlyArray<PointLight>,
        scene: Scene,
    ) {
        const shaderName = "flatClouds";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = flatCloudsFragment;
        }

        const uniforms: string[] = [
            ...Object.values(ObjectUniformNames),
            ...Object.values(StellarObjectUniformNames),
            ...Object.values(CameraUniformNames),
            ...Object.values(CloudsUniformNames),
        ];

        const samplers: string[] = [...Object.values(SamplerUniformNames), ...Object.values(CloudsSamplerNames)];

        super(
            `${planetTransform.name}CloudsPostProcess`,
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

        this.cloudUniforms = cloudUniforms;

        this.onActivateObservable.add((camera) => {
            this.activeCamera = camera;
        });

        this.onApplyObservable.add((effect) => {
            if (this.activeCamera === null) {
                throw new Error("FlatCloudsPostProcess: activeCamera is null");
            }

            const floatingOriginOffset = scene.floatingOriginOffset;

            setCameraUniforms(effect, this.activeCamera);
            setStellarObjectUniforms(effect, stellarObjects);
            setObjectUniforms(effect, planetTransform, boundingRadius, floatingOriginOffset);
            this.cloudUniforms.setUniforms(effect);

            this.cloudUniforms.setSamplers(effect);
            setSamplerUniforms(effect, this.activeCamera, scene);
        });
    }

    public update(deltaTime: number): void {
        this.cloudUniforms.update(deltaTime);
    }
}
