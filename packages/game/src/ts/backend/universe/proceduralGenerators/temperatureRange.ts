//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import { lerp } from "@/frontend/helpers/animations/interpolations";

import { EarthSeaLevelPressure } from "@/utils/physics/constants";

export function getTemperatureRange(
    effectiveTemperature: number,
    greenHouseOffset: number,
    atmospherePressure: number,
) {
    const heatRedistribution = atmospherePressure / (2 * EarthSeaLevelPressure);
    const meanSurfaceTemperature = effectiveTemperature + greenHouseOffset;

    const latitudinalSpan = lerp(60.0, 15.0, heatRedistribution);
    const poleTemperatureOffset = -0.65 * latitudinalSpan;
    const poleTemperature = meanSurfaceTemperature + poleTemperatureOffset;
    const equatorTemperatureOffset = 0.35 * latitudinalSpan;
    const equatorTemperature = meanSurfaceTemperature + equatorTemperatureOffset;

    return {
        min: poleTemperature,
        max: equatorTemperature,
    };
}
