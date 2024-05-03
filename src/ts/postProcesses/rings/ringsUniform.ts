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
import { normalRandom, randRange } from "extended-random";
import { clamp } from "terrain-generation";
import { Scene } from "@babylonjs/core/scene";
import { ProceduralTexture } from "@babylonjs/core/Materials/Textures/Procedurals/proceduralTexture";
import { Effect } from "@babylonjs/core/Materials/effect";
import ringsLUT from "../../../shaders/textures/ringsLUT.glsl";
import { Assets } from "../../assets";

export const RingsUniformNames = {
    RING_START: "rings_start",
    RING_END: "rings_end",
    RING_FREQUENCY: "rings_frequency",
    RING_OPACITY: "rings_opacity",
    RING_COLOR: "rings_color"
};

export const RingsSamplerNames = {
    RING_LUT: "rings_lut"
};

export class RingsUniforms {
    ringStart: number;
    ringEnd: number;
    ringFrequency: number;
    ringOpacity: number;
    ringColor: Color3;

    private ringLut: ProceduralTexture | null = null;
    offset: number;

    constructor(rng: (step: number) => number) {
        this.ringStart = randRange(1.8, 2.2, rng, 1400);
        this.ringEnd = randRange(2.1, 4.0, rng, 1410);
        this.ringFrequency = 30.0;
        this.ringOpacity = clamp(normalRandom(0.7, 0.1, rng, 1420), 0, 1);
        this.ringColor = new Color3(214, 168, 122).scaleInPlace(randRange(1.0, 1.5, rng, 1430) / 255);

        this.offset = randRange(-100, 100, rng, 1440);
    }

    public setUniforms(effect: Effect) {
        effect.setFloat(RingsUniformNames.RING_START, this.ringStart);
        effect.setFloat(RingsUniformNames.RING_END, this.ringEnd);
        effect.setFloat(RingsUniformNames.RING_FREQUENCY, this.ringFrequency);
        effect.setFloat(RingsUniformNames.RING_OPACITY, this.ringOpacity);
        effect.setColor3(RingsUniformNames.RING_COLOR, this.ringColor);
    }

    public static SetEmptyUniforms(effect: Effect) {
        effect.setFloat(RingsUniformNames.RING_START, 0);
        effect.setFloat(RingsUniformNames.RING_END, 0);
        effect.setFloat(RingsUniformNames.RING_FREQUENCY, 0);
        effect.setFloat(RingsUniformNames.RING_OPACITY, 0);
        effect.setColor3(RingsUniformNames.RING_COLOR, new Color3(0, 0, 0));
    }

    public setSamplers(effect: Effect, scene: Scene) {
        if(this.ringLut === null) this.ringLut = this.createLut(scene);
        if(this.ringLut.isReady()) {
            effect.setTexture(RingsSamplerNames.RING_LUT, this.ringLut);
        } else {
            RingsUniforms.SetEmptySamplers(effect);
        }
    }

    public static SetEmptySamplers(effect: Effect) {
        effect.setTexture(RingsSamplerNames.RING_LUT, Assets.EMPTY_TEXTURE);
    }

    /**
     * Returns the LUT for the rings
     * You cannot await this function as it would block the main thread and cause a deadlock as the LUT is created on the main thread
     * @param scene
     * @private
     */
    private createLut(scene: Scene): ProceduralTexture {
        if (Effect.ShadersStore[`ringsLUTFragmentShader`] === undefined) {
            Effect.ShadersStore[`ringsLUTFragmentShader`] = ringsLUT;
        }

        const lut = new ProceduralTexture(
            "ringsLUT",
            {
                width: 4096,
                height: 1
            },
            "ringsLUT",
            scene,
            undefined,
            true,
            false
        );
        lut.setFloat("seed", this.offset);
        lut.setFloat("frequency", this.ringFrequency);
        lut.setFloat("ringStart", this.ringStart);
        lut.setFloat("ringEnd", this.ringEnd);
        lut.refreshRate = 0;

        return lut;
    }
}
