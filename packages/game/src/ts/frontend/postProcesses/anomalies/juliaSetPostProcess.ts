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

import type { RGBColor } from "@/utils/colors";
import { type DeepReadonly } from "@/utils/types";

import juliaFragment from "@shaders/juliaSet.glsl";

export class JuliaSetPostProcess extends PostProcess implements UpdatablePostProcess {
    private elapsedSeconds = 0;

    private activeCamera: Camera | null = null;

    constructor(
        transform: TransformNode,
        boundingRadius: number,
        accentColor: DeepReadonly<RGBColor>,
        scene: Scene,
        stellarObjects: ReadonlyArray<PointLight>,
    ) {
        const shaderName = "julia";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = juliaFragment;
        }

        const JuliaUniformNames = {
            ELAPSED_SECONDS: "elapsedSeconds",
            ACCENT_COLOR: "accentColor",
        };

        const uniforms: string[] = [
            ...Object.values(ObjectUniformNames),
            ...Object.values(CameraUniformNames),
            ...Object.values(StellarObjectUniformNames),
            ...Object.values(JuliaUniformNames),
        ];

        const samplers: string[] = Object.values(SamplerUniformNames);

        super(
            transform.name,
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

        this.onActivateObservable.add((camera) => {
            this.activeCamera = camera;
        });

        this.onApplyObservable.add((effect) => {
            if (this.activeCamera === null) {
                throw new Error("Camera is null");
            }

            const floatingOriginOffset = scene.floatingOriginOffset;

            setCameraUniforms(effect, this.activeCamera);
            setStellarObjectUniforms(effect, stellarObjects);
            setObjectUniforms(effect, transform, boundingRadius, floatingOriginOffset);

            effect.setFloat(JuliaUniformNames.ELAPSED_SECONDS, this.elapsedSeconds);
            effect.setColor3(JuliaUniformNames.ACCENT_COLOR, accentColor);

            setSamplerUniforms(effect, this.activeCamera, scene);
        });
    }

    public update(deltaSeconds: number): void {
        this.elapsedSeconds += deltaSeconds;
        this.elapsedSeconds %= 60 * 60;
    }
}
