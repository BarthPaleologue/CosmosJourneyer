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

import juliaFragment from "../../../shaders/juliaSet.glsl";
import { ObjectPostProcess, UpdatablePostProcess } from "../../postProcesses/objectPostProcess";
import { Effect } from "@babylonjs/core/Materials/effect";
import { JuliaSet } from "./juliaSet";
import { StellarObject } from "../../architecture/stellarObject";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { ObjectUniformNames, setObjectUniforms } from "../../postProcesses/uniforms/objectUniforms";
import { CameraUniformNames, setCameraUniforms } from "../../postProcesses/uniforms/cameraUniforms";
import { setStellarObjectUniforms, StellarObjectUniformNames } from "../../postProcesses/uniforms/stellarObjectUniforms";
import { SamplerUniformNames, setSamplerUniforms } from "../../postProcesses/uniforms/samplerUniforms";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Constants } from "@babylonjs/core/Engines/constants";
import { Scene } from "@babylonjs/core/scene";

export class JuliaSetPostProcess extends PostProcess implements ObjectPostProcess, UpdatablePostProcess {
    readonly object: JuliaSet;

    private elapsedSeconds = 0;

    private activeCamera: Camera | null = null;

    constructor(julia: JuliaSet, scene: Scene, stellarObjects: StellarObject[]) {
        const shaderName = "julia";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = juliaFragment;
        }

        const JuliaUniformNames = {
            ELAPSED_SECONDS: "elapsedSeconds",
            ACCENT_COLOR: "accentColor"
        };

        const uniforms: string[] = [
            ...Object.values(ObjectUniformNames),
            ...Object.values(CameraUniformNames),
            ...Object.values(StellarObjectUniformNames),
            ...Object.values(JuliaUniformNames)
        ];

        const samplers: string[] = Object.values(SamplerUniformNames);

        super(julia.name, shaderName, uniforms, samplers, 1, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, null, Constants.TEXTURETYPE_HALF_FLOAT);

        this.object = julia;

        this.onActivateObservable.add((camera) => {
            this.activeCamera = camera;
        });

        this.onApplyObservable.add((effect) => {
            if (this.activeCamera === null) {
                throw new Error("Camera is null");
            }

            setCameraUniforms(effect, this.activeCamera);
            setStellarObjectUniforms(effect, stellarObjects);
            setObjectUniforms(effect, julia);

            effect.setFloat(JuliaUniformNames.ELAPSED_SECONDS, this.elapsedSeconds);
            effect.setColor3(JuliaUniformNames.ACCENT_COLOR, julia.model.accentColor);

            setSamplerUniforms(effect, this.activeCamera, scene);
        });
    }

    public update(deltaSeconds: number): void {
        this.elapsedSeconds += deltaSeconds;
    }
}
