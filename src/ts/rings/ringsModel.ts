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
import { normalRandom, randRange } from "extended-random";
import { clamp } from "../utils/math";

export type RingsModel = {
    ringStart: number;
    ringEnd: number;
    ringFrequency: number;
    ringOpacity: number;
    ringColor: Color3;
    seed: number;
};

export function newSeededRingsModel(rng: (step: number) => number): RingsModel {
    return {
        ringStart: randRange(1.8, 2.2, rng, 1400),
        ringEnd: randRange(2.1, 4.0, rng, 1410),
        ringFrequency: 30.0,
        ringOpacity: clamp(normalRandom(0.7, 0.1, rng, 1420), 0, 1),
        ringColor: new Color3(255, 225, 171).scaleInPlace(randRange(0.7, 1.2, rng, 1430) / 255),

        seed: randRange(-1, 1, rng, 1440)
    };
}
