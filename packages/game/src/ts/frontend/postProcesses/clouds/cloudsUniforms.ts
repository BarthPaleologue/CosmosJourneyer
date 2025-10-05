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

import { type CloudsModel } from "@/backend/universe/orbitalObjects/cloudsModel";

import { createEmptyTexture } from "@/frontend/assets/procedural/proceduralTexture";

import { type ItemPool } from "@/utils/itemPool";
import { gcd } from "@/utils/math";
import { type DeepReadonly } from "@/utils/types";

import { type CloudsLut } from "./cloudsLut";

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
    TIME: "time",
};

export const CloudsSamplerNames = {
    LUT: "clouds_lut",
};

export class CloudsUniforms {
    readonly model: DeepReadonly<CloudsModel>;

    readonly lut: CloudsLut;

    private elapsedSeconds = 0;

    private readonly fallbackTexture: Texture;

    constructor(model: DeepReadonly<CloudsModel>, cloudsLutPool: ItemPool<CloudsLut>, scene: Scene) {
        this.model = model;

        this.lut = cloudsLutPool.get();
        this.lut.setModel(model);

        this.fallbackTexture = createEmptyTexture(scene);
    }

    public update(deltaSeconds: number) {
        this.elapsedSeconds += deltaSeconds;
    }

    public setUniforms(effect: Effect) {
        effect.setFloat(CloudsUniformNames.LAYER_RADIUS, this.model.layerRadius);
        effect.setFloat(CloudsUniformNames.FREQUENCY, this.model.frequency);
        effect.setFloat(CloudsUniformNames.DETAIL_FREQUENCY, this.model.detailFrequency);
        effect.setFloat(CloudsUniformNames.COVERAGE, this.model.coverage);
        effect.setFloat(CloudsUniformNames.SHARPNESS, this.model.sharpness);
        effect.setColor3(CloudsUniformNames.COLOR, this.model.color);
        effect.setFloat(CloudsUniformNames.WORLEY_SPEED, this.model.worleySpeed);
        effect.setFloat(CloudsUniformNames.DETAIL_SPEED, this.model.detailSpeed);
        effect.setFloat(CloudsUniformNames.SMOOTHNESS, this.model.smoothness);
        effect.setFloat(CloudsUniformNames.SPECULAR_POWER, this.model.specularPower);
        effect.setFloat(
            CloudsUniformNames.TIME,
            -this.elapsedSeconds %
                ((2 * Math.PI * gcd(this.model.worleySpeed * 10000, this.model.detailSpeed * 10000)) /
                    this.model.worleySpeed),
        );
    }

    public setSamplers(effect: Effect) {
        if (this.lut.isReady()) {
            effect.setTexture(CloudsSamplerNames.LUT, this.lut.getTexture());
        } else {
            effect.setTexture(CloudsSamplerNames.LUT, this.fallbackTexture);
        }
    }

    public dispose(cloudsLutPool: ItemPool<CloudsLut>) {
        cloudsLutPool.release(this.lut);
    }
}
