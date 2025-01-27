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

import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Scene } from "@babylonjs/core/scene";
import { Effect } from "@babylonjs/core/Materials/effect";
import { RingsModel } from "./ringsModel";
import { Textures } from "../assets/textures";
import { RingsLut } from "./ringsLut";
import { LutPoolManager } from "../assets/lutPoolManager";

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
    private readonly lut: RingsLut;
    private lutReady = false;

    readonly model: RingsModel;

    constructor(model: RingsModel, scene: Scene) {
        this.model = model;

        this.lut = LutPoolManager.GetRingsLut(scene);
        this.lut.setModel(model);
    }

    public setUniforms(effect: Effect) {
        effect.setFloat(RingsUniformNames.RING_START, this.model.ringStart);
        effect.setFloat(RingsUniformNames.RING_END, this.model.ringEnd);
        effect.setFloat(RingsUniformNames.RING_FREQUENCY, this.model.ringFrequency);
        effect.setFloat(RingsUniformNames.RING_OPACITY, this.model.ringOpacity);
        effect.setColor3(RingsUniformNames.RING_COLOR, this.model.ringColor);
    }

    public static SetEmptyUniforms(effect: Effect) {
        effect.setFloat(RingsUniformNames.RING_START, 0);
        effect.setFloat(RingsUniformNames.RING_END, 0);
        effect.setFloat(RingsUniformNames.RING_FREQUENCY, 0);
        effect.setFloat(RingsUniformNames.RING_OPACITY, 0);
        effect.setColor3(RingsUniformNames.RING_COLOR, new Color3(0, 0, 0));
    }

    public setSamplers(effect: Effect) {
        if (this.lut.isReady()) {
            effect.setTexture(RingsSamplerNames.RING_LUT, this.lut.getTexture());
        } else {
            RingsUniforms.SetEmptySamplers(effect);
        }
    }

    public static SetEmptySamplers(effect: Effect) {
        effect.setTexture(RingsSamplerNames.RING_LUT, Textures.EMPTY_TEXTURE);
    }

    public dispose() {
        LutPoolManager.ReturnRingsLut(this.lut);
    }
}
