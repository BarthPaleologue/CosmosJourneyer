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
import { Scene } from "@babylonjs/core/scene";

import { RingsModel } from "@/backend/universe/orbitalObjects/ringsModel";

import { ItemPool } from "@/utils/itemPool";
import { createEmptyTexture } from "@/utils/proceduralTexture";
import { DeepReadonly } from "@/utils/types";

import { RingsPatternLut } from "./ringsLut";

export const RingsUniformNames = {
    RING_INNER_RADIUS: "rings_inner_radius",
    RING_OUTER_RADIUS: "rings_outer_radius",
    RING_FADE_OUT_DISTANCE: "rings_fade_out_distance",
} as const;

export const RingsSamplerNames = {
    RING_PATTERN_LUT: "rings_pattern_lut",
} as const;

export class RingsUniforms {
    readonly patternLut: RingsPatternLut;

    readonly model: DeepReadonly<RingsModel>;

    private readonly fallbackTexture: Texture;

    private readonly fadeOutDistance: number;

    constructor(
        model: DeepReadonly<RingsModel>,
        fadeOutDistance: number,
        texturePool: ItemPool<RingsPatternLut>,
        scene: Scene,
    ) {
        this.model = model;

        this.fadeOutDistance = fadeOutDistance;

        this.patternLut = texturePool.get();
        this.patternLut.setModel(model);

        this.fallbackTexture = createEmptyTexture(scene);
    }

    public setUniforms(effect: Effect) {
        effect.setFloat(RingsUniformNames.RING_INNER_RADIUS, this.model.innerRadius);
        effect.setFloat(RingsUniformNames.RING_OUTER_RADIUS, this.model.outerRadius);
        effect.setFloat(RingsUniformNames.RING_FADE_OUT_DISTANCE, this.fadeOutDistance);
    }

    public static SetEmptyUniforms(effect: Effect) {
        effect.setFloat(RingsUniformNames.RING_INNER_RADIUS, 0);
        effect.setFloat(RingsUniformNames.RING_OUTER_RADIUS, 0);
        effect.setFloat(RingsUniformNames.RING_FADE_OUT_DISTANCE, 0);
    }

    public setSamplers(effect: Effect) {
        if (this.patternLut.isReady()) {
            effect.setTexture(RingsSamplerNames.RING_PATTERN_LUT, this.patternLut.getTexture());
        } else {
            RingsUniforms.SetEmptySamplers(effect, this.fallbackTexture);
        }
    }

    public static SetEmptySamplers(effect: Effect, fallbackTexture: Texture) {
        effect.setTexture(RingsSamplerNames.RING_PATTERN_LUT, fallbackTexture);
    }

    public dispose(texturePool: ItemPool<RingsPatternLut>) {
        texturePool.release(this.patternLut);
    }
}
