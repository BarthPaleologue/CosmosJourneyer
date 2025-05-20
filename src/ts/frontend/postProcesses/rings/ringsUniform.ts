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
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Scene } from "@babylonjs/core/scene";

import { RingsModel } from "@/backend/universe/orbitalObjects/ringsModel";

import { ItemPool } from "@/utils/itemPool";
import { createEmptyTexture } from "@/utils/proceduralTexture";
import { DeepReadonly } from "@/utils/types";

import { RingsLut } from "./ringsLut";

export const RingsUniformNames = {
    RING_INNER_RADIUS: "rings_inner_radius",
    RING_OUTER_RADIUS: "rings_outer_radius",
    RING_FREQUENCY: "rings_frequency",
    RING_OPACITY: "rings_opacity",
    RING_COLOR: "rings_color",
    RING_FADE_OUT_DISTANCE: "rings_fade_out_distance",
};

export const RingsSamplerNames = {
    RING_LUT: "rings_lut",
};

export class RingsUniforms {
    readonly lut: RingsLut;

    readonly model: DeepReadonly<RingsModel>;

    private readonly fallbackTexture: Texture;

    private readonly fadeOutDistance: number;

    constructor(
        model: DeepReadonly<RingsModel>,
        fadeOutDistance: number,
        texturePool: ItemPool<RingsLut>,
        scene: Scene,
    ) {
        this.model = model;

        this.fadeOutDistance = fadeOutDistance;

        this.lut = texturePool.get();
        this.lut.setModel(model);

        this.fallbackTexture = createEmptyTexture(scene);
    }

    public setUniforms(effect: Effect) {
        effect.setFloat(RingsUniformNames.RING_INNER_RADIUS, this.model.innerRadius);
        effect.setFloat(RingsUniformNames.RING_OUTER_RADIUS, this.model.outerRadius);
        effect.setFloat(RingsUniformNames.RING_FREQUENCY, this.model.frequency);
        effect.setFloat(RingsUniformNames.RING_OPACITY, this.model.opacity);
        effect.setColor3(RingsUniformNames.RING_COLOR, this.model.color);
        effect.setFloat(RingsUniformNames.RING_FADE_OUT_DISTANCE, this.fadeOutDistance);
    }

    public static SetEmptyUniforms(effect: Effect) {
        effect.setFloat(RingsUniformNames.RING_INNER_RADIUS, 0);
        effect.setFloat(RingsUniformNames.RING_OUTER_RADIUS, 0);
        effect.setFloat(RingsUniformNames.RING_FREQUENCY, 0);
        effect.setFloat(RingsUniformNames.RING_OPACITY, 0);
        effect.setColor3(RingsUniformNames.RING_COLOR, new Color3(0, 0, 0));
        effect.setFloat(RingsUniformNames.RING_FADE_OUT_DISTANCE, 0);
    }

    public setSamplers(effect: Effect) {
        if (this.lut.isReady()) {
            effect.setTexture(RingsSamplerNames.RING_LUT, this.lut.getTexture());
        } else {
            RingsUniforms.SetEmptySamplers(effect, this.fallbackTexture);
        }
    }

    public static SetEmptySamplers(effect: Effect, fallbackTexture: Texture) {
        effect.setTexture(RingsSamplerNames.RING_LUT, fallbackTexture);
    }

    public dispose(texturePool: ItemPool<RingsLut>) {
        texturePool.release(this.lut);
    }
}
