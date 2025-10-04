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

import { Constants } from "@babylonjs/core/Engines/constants";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { type Scene } from "@babylonjs/core/scene";

import colorCorrectionFragment from "@shaders/colorCorrection.glsl";

const shaderName = "colorCorrection";
Effect.ShadersStore[`${shaderName}FragmentShader`] = colorCorrectionFragment;

export class ColorCorrection extends PostProcess {
    brightness = 0;
    contrast = 1;
    exposure = 1;
    gamma = 1;
    saturation = 1;

    constructor(name: string, scene: Scene) {
        super(
            name,
            shaderName,
            ["brightness", "contrast", "exposure", "gamma", "saturation"],
            ["textureSampler"],
            1,
            null,
            Texture.BILINEAR_SAMPLINGMODE,
            scene.getEngine(),
            false,
            null,
            Constants.TEXTURETYPE_HALF_FLOAT,
        );

        // This is necessary because BabylonJS post process sets the scene using the camera. However, I don't pass a camera to the constructor as I use a PostProcessRenderPipeline.
        this._scene = scene;

        this.onApplyObservable.add((effect: Effect) => {
            effect.setFloat("brightness", this.brightness);
            effect.setFloat("contrast", this.contrast);
            effect.setFloat("exposure", this.exposure);
            effect.setFloat("gamma", this.gamma);
            effect.setFloat("saturation", this.saturation);
        });
    }
}
