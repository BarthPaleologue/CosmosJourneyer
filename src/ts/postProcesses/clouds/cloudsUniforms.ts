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

import { Color3 } from "@babylonjs/core/Maths/math.color";
import { ProceduralTexture } from "@babylonjs/core/Materials/Textures/Procedurals/proceduralTexture";
import { gcd } from "terrain-generation";
import { Scene } from "@babylonjs/core/scene";
import { Effect } from "@babylonjs/core/Materials/effect";
import flatCloudLUT from "../../../shaders/textures/flatCloudLUT.glsl";
import { Assets } from "../../assets";

export const CloudsUniformNames = {
    LAYER_RADIUS: "clouds_layerRadius",
    SMOOTHNESS: "clouds_smoothness",
    SPECULAR_POWER: "clouds_specularPower",
    FREQUENCY: "clouds_frequency",
    DETAIL_FREQUENCY: "clouds_detailFrequency",
    COVERAGE: "clouds_coverage",
    SHARPNESS: "clouds_sharpness",
    COLOR: "clouds_color",
    WORLEY_SPEED: "clouds_worleySpeed",
    DETAIL_SPEED: "clouds_detailSpeed",
    TIME: "time"
};

export const CloudsSamplerNames = {
    LUT: "clouds_lut"
};

export class CloudsUniforms {
    layerRadius: number;
    smoothness: number;
    specularPower: number;
    frequency: number;
    detailFrequency: number;
    coverage: number;
    sharpness: number;
    color: Color3;
    worleySpeed: number;
    detailSpeed: number;
    time: number;

    lut: ProceduralTexture | null = null;

    constructor(planetRadius: number, cloudLayerHeight: number, waterAmount: number, pressure: number) {
        this.layerRadius = planetRadius + cloudLayerHeight;
        this.specularPower = 2;
        this.smoothness = 0.7;
        this.frequency = 4;
        this.detailFrequency = 12;
        this.coverage = 0.75 * Math.exp(-waterAmount * pressure);
        this.sharpness = 2.5;
        this.color = new Color3(0.8, 0.8, 0.8);
        this.worleySpeed = 0.0005;
        this.detailSpeed = 0.003;
        this.time = 0;
    }

    public setUniforms(effect: Effect) {
        effect.setFloat(CloudsUniformNames.LAYER_RADIUS, this.layerRadius);
        effect.setFloat(CloudsUniformNames.FREQUENCY, this.frequency);
        effect.setFloat(CloudsUniformNames.DETAIL_FREQUENCY, this.detailFrequency);
        effect.setFloat(CloudsUniformNames.COVERAGE, this.coverage);
        effect.setFloat(CloudsUniformNames.SHARPNESS, this.sharpness);
        effect.setColor3(CloudsUniformNames.COLOR, this.color);
        effect.setFloat(CloudsUniformNames.WORLEY_SPEED, this.worleySpeed);
        effect.setFloat(CloudsUniformNames.DETAIL_SPEED, this.detailSpeed);
        effect.setFloat(CloudsUniformNames.SMOOTHNESS, this.smoothness);
        effect.setFloat(CloudsUniformNames.SPECULAR_POWER, this.specularPower);
        effect.setFloat(CloudsUniformNames.TIME, -this.time % ((2 * Math.PI * gcd(this.worleySpeed * 10000, this.detailSpeed * 10000)) / this.worleySpeed));
    }

    public static SetEmptyUniforms(effect: Effect) {
        effect.setFloat(CloudsUniformNames.LAYER_RADIUS, 0);
        effect.setFloat(CloudsUniformNames.FREQUENCY, 0);
        effect.setFloat(CloudsUniformNames.DETAIL_FREQUENCY, 0);
        effect.setFloat(CloudsUniformNames.COVERAGE, 0);
        effect.setFloat(CloudsUniformNames.SHARPNESS, 0);
        effect.setColor3(CloudsUniformNames.COLOR, new Color3(0, 0, 0));
        effect.setFloat(CloudsUniformNames.WORLEY_SPEED, 0);
        effect.setFloat(CloudsUniformNames.DETAIL_SPEED, 0);
        effect.setFloat(CloudsUniformNames.SMOOTHNESS, 0);
        effect.setFloat(CloudsUniformNames.SPECULAR_POWER, 0);
        effect.setFloat(CloudsUniformNames.TIME, 0);
    }

    public setSamplers(effect: Effect, scene: Scene) {
        if(this.lut === null) this.lut = this.createLut(scene);
        if(this.lut.isReady()) {
            effect.setTexture(CloudsSamplerNames.LUT, this.lut);
        } else {
            CloudsUniforms.SetEmptySamplers(effect);
        }
    }

    public static SetEmptySamplers(effect: Effect) {
        effect.setTexture(CloudsSamplerNames.LUT, Assets.EMPTY_TEXTURE);
    }

    /**
     * Returns the LUT for the rings when it is ready
     * You cannot await this function as it would block the main thread and cause a deadlock as the LUT is created on the main thread
     * @param scene
     * @private
     */
    private createLut(scene: Scene): ProceduralTexture {
        if (Effect.ShadersStore[`flatCloudsLUTFragmentShader`] === undefined) {
            Effect.ShadersStore[`flatCloudsLUTFragmentShader`] = flatCloudLUT;
        }

        const lut = new ProceduralTexture("flatCloudLUT", 4096, "flatCloudsLUT", scene, undefined, true, false);
        lut.setFloat("worleyFrequency", this.frequency);
        lut.setFloat("detailFrequency", this.detailFrequency);
        lut.refreshRate = 0;

        return lut;
    }
}
