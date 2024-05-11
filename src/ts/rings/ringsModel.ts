//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Color3 } from "@babylonjs/core/Maths/math.color";
import { normalRandom, randRange } from "extended-random";
import { clamp } from "terrain-generation";

export class RingsModel {
    ringStart: number;
    ringEnd: number;
    ringFrequency: number;
    ringOpacity: number;
    ringColor: Color3;
    offset: number;

    constructor(rng: (step: number) => number) {
        this.ringStart = randRange(1.8, 2.2, rng, 1400);
        this.ringEnd = randRange(2.1, 4.0, rng, 1410);
        this.ringFrequency = 30.0;
        this.ringOpacity = clamp(normalRandom(0.7, 0.1, rng, 1420), 0, 1);
        this.ringColor = new Color3(214, 168, 122).scaleInPlace(randRange(1.0, 1.5, rng, 1430) / 255);

        this.offset = randRange(-100, 100, rng, 1440);
    }
}
