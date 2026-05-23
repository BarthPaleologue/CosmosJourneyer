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

import { getWaterSaturationPressure } from "@cosmos-journeyer/physics";
import { type CloudsModel } from "@cosmos-journeyer/universe-model";

export function generateCloudsModel(
    planetRadius: number,
    cloudLayerHeight: number,
    oceanCoverage: number,
    averageTemperature: number,
    pressure: number,
): CloudsModel {
    const waterSaturationPressure = getWaterSaturationPressure(averageTemperature);
    const calibrationCoefficient = 30;
    const maxCoverage = 0.8;
    const coverage =
        maxCoverage * (1.0 - Math.exp((-calibrationCoefficient * oceanCoverage * waterSaturationPressure) / pressure));

    return {
        layerRadius: planetRadius + cloudLayerHeight,
        smoothness: 0.7,
        specularPower: 2,
        frequency: 4,
        detailFrequency: 12,
        coverage,
        sharpness: 1,
        color: { r: 0.8, g: 0.8, b: 0.8 },
        worleySpeed: 0.0005,
        detailSpeed: 0.003,
    };
}
