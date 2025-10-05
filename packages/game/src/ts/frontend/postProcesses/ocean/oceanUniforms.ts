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
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";

import { type WaterTextures } from "@/frontend/assets/textures";

const OceanUniformNames = {
    OCEAN_RADIUS: "ocean_radius",
    OCEAN_SMOOTHNESS: "ocean_smoothness",
    OCEAN_SPECULAR_POWER: "ocean_specularPower",
    OCEAN_ALPHA_MODIFIER: "ocean_alphaModifier",
    OCEAN_DEPTH_MODIFIER: "ocean_depthModifier",
    OCEAN_WAVE_BLENDING_SHARPNESS: "ocean_waveBlendingSharpness",
    PLANET_INVERSE_ROTATION_MATRIX: "planetInverseRotationMatrix",
    TIME: "time",
};

const OceanSamplerNames = {
    NORMAL_MAP_1: "normalMap1",
    NORMAL_MAP_2: "normalMap2",
};

export class OceanUniforms {
    oceanRadius: number;
    smoothness: number;
    specularPower: number;
    depthModifier: number;
    alphaModifier: number;
    waveBlendingSharpness: number;
    time: number;

    constructor(planetRadius: number, oceanLevel: number) {
        this.oceanRadius = planetRadius + oceanLevel;
        this.depthModifier = 0.0015;
        this.alphaModifier = 0.0025;
        this.specularPower = 1.0;
        this.smoothness = 0.8;
        this.waveBlendingSharpness = 0.5;
        this.time = 0;
    }

    getUniformNames(): string[] {
        return Object.values(OceanUniformNames);
    }

    setUniforms(effect: Effect, planetTransform: TransformNode) {
        effect.setFloat(OceanUniformNames.OCEAN_RADIUS, this.oceanRadius);
        effect.setFloat(OceanUniformNames.OCEAN_SMOOTHNESS, this.smoothness);
        effect.setFloat(OceanUniformNames.OCEAN_SPECULAR_POWER, this.specularPower);
        effect.setFloat(OceanUniformNames.OCEAN_ALPHA_MODIFIER, this.alphaModifier);
        effect.setFloat(OceanUniformNames.OCEAN_DEPTH_MODIFIER, this.depthModifier);
        effect.setFloat(OceanUniformNames.OCEAN_WAVE_BLENDING_SHARPNESS, this.waveBlendingSharpness);
        effect.setMatrix(
            OceanUniformNames.PLANET_INVERSE_ROTATION_MATRIX,
            planetTransform.getWorldMatrix().getRotationMatrix().transpose(),
        );
        effect.setFloat(OceanUniformNames.TIME, this.time % 100000); //FIXME: do not hardcode the 100000
    }

    getSamplerNames(): string[] {
        return Object.values(OceanSamplerNames);
    }

    setSamplers(effect: Effect, textures: WaterTextures) {
        effect.setTexture(OceanSamplerNames.NORMAL_MAP_1, textures.normalMap1);
        effect.setTexture(OceanSamplerNames.NORMAL_MAP_2, textures.normalMap2);
    }
}
