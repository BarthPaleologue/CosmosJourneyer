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

import mandelbulbFragment from "../../shaders/mandelbulb.glsl";
import { UberScene } from "../uberCore/uberScene";
import { ObjectPostProcess } from "./objectPostProcess";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Mandelbulb } from "../mandelbulb/mandelbulb";
import { StellarObject } from "../architecture/stellarObject";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { ObjectUniformNames, setObjectUniforms } from "./uniforms/objectUniforms";
import { CameraUniformNames, setCameraUniforms } from "./uniforms/cameraUniforms";
import { setStellarObjectUniforms, StellarObjectUniformNames } from "./uniforms/stellarObjectUniforms";
import { SamplerUniformNames, setSamplerUniforms } from "./uniforms/samplerUniforms";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Constants } from "@babylonjs/core/Engines/constants";

export interface MandelbulbSettings {
    rotationPeriod: number;
}

export class MandelbulbPostProcess extends PostProcess implements ObjectPostProcess {
    readonly settings: MandelbulbSettings;
    readonly object: Mandelbulb;

    private activeCamera: Camera | null = null;

    constructor(mandelbulb: Mandelbulb, scene: UberScene, stellarObjects: StellarObject[]) {
        const shaderName = "mandelbulb";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = mandelbulbFragment;
        }

        const settings: MandelbulbSettings = {
            rotationPeriod: 1.5
        };

        const MandelbulbUniformNames = {
            POWER: "power",
            ACCENT_COLOR: "accentColor"
        }

        const uniforms: string[] = [
            ...Object.values(ObjectUniformNames),
            ...Object.values(CameraUniformNames),
            ...Object.values(StellarObjectUniformNames),
            ...Object.values(MandelbulbUniformNames)
        ];

        const samplers: string[] = Object.values(SamplerUniformNames);

        super(mandelbulb.name, shaderName, uniforms, samplers, 1, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, null, Constants.TEXTURETYPE_HALF_FLOAT);

        this.object = mandelbulb;
        this.settings = settings;

        this.onActivateObservable.add((camera) => {
            this.activeCamera = camera;
        });

        this.onApplyObservable.add((effect) => {
            if(this.activeCamera === null) {
                throw new Error("Camera is null");
            }

            setCameraUniforms(effect, this.activeCamera);
            setStellarObjectUniforms(effect, stellarObjects);
            setObjectUniforms(effect, mandelbulb);

            effect.setFloat(MandelbulbUniformNames.POWER, mandelbulb.model.power);
            effect.setColor3(MandelbulbUniformNames.ACCENT_COLOR, mandelbulb.model.accentColor);

            setSamplerUniforms(effect, this.activeCamera, scene);
        });
    }
}
