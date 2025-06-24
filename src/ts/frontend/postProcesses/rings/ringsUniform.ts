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

import { type Effect } from "@babylonjs/core/Materials/effect";
import { type Texture } from "@babylonjs/core/Materials/Textures/texture";
import { type Scene } from "@babylonjs/core/scene";

import {
    type ProceduralRingsModel,
    type RingsModel,
    type TexturedRingsModel,
} from "@/backend/universe/orbitalObjects/ringsModel";

import { type Textures } from "@/frontend/assets/textures";

import { type ItemPool } from "@/utils/dataStructures/itemPool";
import { createEmptyTexture } from "@/utils/proceduralTexture";
import { type DeepReadonly } from "@/utils/types";

import { type RingsProceduralPatternLut } from "./ringsProceduralLut";

export const RingsUniformNames = {
    RING_INNER_RADIUS: "rings_inner_radius",
    RING_OUTER_RADIUS: "rings_outer_radius",
    RING_FADE_OUT_DISTANCE: "rings_fade_out_distance",
} as const;

export const RingsSamplerNames = {
    RING_PATTERN_LUT: "rings_pattern_lut",
} as const;

type PatternLut = { type: "procedural"; lut: RingsProceduralPatternLut } | { type: "textured"; texture: Texture };

export class RingsUniforms {
    readonly patternLut: PatternLut;

    readonly model: DeepReadonly<RingsModel>;

    private readonly fallbackTexture: Texture;

    private readonly fadeOutDistance: number;

    private constructor(
        model: DeepReadonly<RingsModel>,
        patternLut: PatternLut,
        fadeOutDistance: number,
        scene: Scene,
    ) {
        this.model = model;

        this.fadeOutDistance = fadeOutDistance;

        this.patternLut = patternLut;

        this.fallbackTexture = createEmptyTexture(scene);
    }

    /**
     * Creates a new `RingsUniforms` instance for procedural ring models.
     *
     * @param model - The procedural ring model to use for generating the uniforms.
     * @param texturePool - A pool of reusable procedural pattern LUTs.
     * @param fadeOutDistance - The distance at which the ring fades out.
     * @param scene - The Babylon.js scene where the ring is rendered.
     * @returns A new `RingsUniforms` instance configured for procedural rings.
     */
    public static NewProcedural(
        model: DeepReadonly<ProceduralRingsModel>,
        texturePool: ItemPool<RingsProceduralPatternLut>,
        fadeOutDistance: number,
        scene: Scene,
    ): RingsUniforms {
        const patternLut = texturePool.get();
        patternLut.setModel(model);

        return new RingsUniforms(model, { type: "procedural", lut: patternLut }, fadeOutDistance, scene);
    }

    public static NewTextured(
        model: DeepReadonly<TexturedRingsModel>,
        textures: Textures,
        fadeOutDistance: number,
        scene: Scene,
    ): RingsUniforms {
        let texture;
        switch (model.textureId) {
            case "saturn":
                texture = textures.rings.saturn;
                break;
            case "uranus":
                texture = textures.rings.uranus;
                break;
        }

        return new RingsUniforms(model, { type: "textured", texture }, fadeOutDistance, scene);
    }

    public static New(model: DeepReadonly<RingsModel>, textures: Textures, fadeOutDistance: number, scene: Scene) {
        switch (model.type) {
            case "procedural":
                return RingsUniforms.NewProcedural(model, textures.pools.ringsPatternLut, fadeOutDistance, scene);
            case "textured":
                return RingsUniforms.NewTextured(model, textures, fadeOutDistance, scene);
        }
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
        if (this.patternLut.type === "procedural" && this.patternLut.lut.isReady()) {
            effect.setTexture(RingsSamplerNames.RING_PATTERN_LUT, this.patternLut.lut.getTexture());
        } else if (this.patternLut.type === "textured") {
            effect.setTexture(RingsSamplerNames.RING_PATTERN_LUT, this.patternLut.texture);
        } else {
            RingsUniforms.SetEmptySamplers(effect, this.fallbackTexture);
        }
    }

    public static SetEmptySamplers(effect: Effect, fallbackTexture: Texture) {
        effect.setTexture(RingsSamplerNames.RING_PATTERN_LUT, fallbackTexture);
    }

    public dispose(texturePool: ItemPool<RingsProceduralPatternLut>) {
        if (this.patternLut.type === "procedural") {
            texturePool.release(this.patternLut.lut);
        }
    }
}
