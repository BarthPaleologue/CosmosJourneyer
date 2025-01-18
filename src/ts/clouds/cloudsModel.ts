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
import { Settings } from "../settings";

export type CloudsModel = {
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
};

export function newCloudsModel(
    planetRadius: number,
    cloudLayerHeight: number,
    waterAmount: number,
    pressure: number
): CloudsModel {
    return {
        layerRadius: planetRadius + cloudLayerHeight,
        smoothness: 0.7,
        specularPower: 2,
        frequency: 4,
        detailFrequency: 12,
        coverage: 0.75 * Math.exp((-waterAmount * pressure) / Settings.EARTH_SEA_LEVEL_PRESSURE),
        sharpness: 2.5,
        color: new Color3(0.8, 0.8, 0.8),
        worleySpeed: 0.0005,
        detailSpeed: 0.003
    };
}
