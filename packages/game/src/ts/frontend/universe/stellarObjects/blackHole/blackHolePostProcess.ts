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
import { Effect } from "@babylonjs/core/Materials/effect";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { type Scene } from "@babylonjs/core/scene";

import { CameraUniformNames, setCameraUniforms } from "@/frontend/postProcesses/uniforms/cameraUniforms";
import { ObjectUniformNames, setObjectUniforms } from "@/frontend/postProcesses/uniforms/objectUniforms";
import { SamplerUniformNames, setSamplerUniforms } from "@/frontend/postProcesses/uniforms/samplerUniforms";
import { type UpdatablePostProcess } from "@/frontend/postProcesses/updatablePostProcess";

import { BlackHoleSamplerNames, BlackHoleUniformNames, type BlackHoleUniforms } from "./blackHoleUniforms";

import blackHoleFragment from "@shaders/blackhole.glsl";

export class BlackHolePostProcess extends PostProcess implements UpdatablePostProcess {
    private activeCamera: Camera | null = null;

    private readonly blackHoleUniforms: BlackHoleUniforms;

    constructor(blackHoleTransform: TransformNode, blackHoleUniforms: BlackHoleUniforms, scene: Scene) {
        const shaderName = "blackhole";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = blackHoleFragment;
        }

        const uniforms: string[] = [
            ...Object.values(ObjectUniformNames),
            ...Object.values(CameraUniformNames),
            ...Object.values(BlackHoleUniformNames),
        ];

        const samplers: string[] = [...Object.values(SamplerUniformNames), ...Object.values(BlackHoleSamplerNames)];

        super(
            blackHoleTransform.name,
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

        this.blackHoleUniforms = blackHoleUniforms;

        this.onActivateObservable.add((camera) => {
            this.activeCamera = camera;
        });

        this.onApplyObservable.add((effect) => {
            if (this.activeCamera === null) {
                throw new Error("Camera is null");
            }

            const floatingOriginOffset = scene.floatingOriginOffset;
            const floatingOriginEnabled = scene.floatingOriginMode;

            setCameraUniforms(effect, this.activeCamera, floatingOriginEnabled);
            setObjectUniforms(effect, blackHoleTransform, blackHoleUniforms.schwarzschildRadius, floatingOriginOffset);
            blackHoleUniforms.setUniforms(effect, blackHoleTransform);

            setSamplerUniforms(effect, this.activeCamera, scene);
            blackHoleUniforms.setSamplers(effect);
        });
    }

    public update(deltaSeconds: number): void {
        this.blackHoleUniforms.time += deltaSeconds;
        this.blackHoleUniforms.time %= 60 * 60;
    }
}
