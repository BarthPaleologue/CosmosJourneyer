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

import { type RingsModel } from "@cosmos-journeyer/universe-model";
import { normalRandom, randRange } from "extended-random";

export function generateSeededRingsModel(celestialBodyRadius: number, rng: (step: number) => number): RingsModel {
    const innerRadius = celestialBodyRadius * randRange(1.8, 2.2, rng, 1400);
    const ringWidth = celestialBodyRadius * Math.max(0.2, normalRandom(1.0, 0.5, rng, 1405));
    const dustBrightness = randRange(0.35, 0.65, rng, 1430);
    const dustWarmth = randRange(0.0, 1.0, rng, 1431);
    const dustRedBias = randRange(-0.03, 0.04, rng, 1432);
    const dustGreenBias = randRange(-0.02, 0.03, rng, 1433);
    const dustBlueBias = randRange(-0.03, 0.02, rng, 1434);

    return {
        innerRadius: innerRadius,
        outerRadius: innerRadius + ringWidth,
        type: "procedural",
        seed: randRange(-1, 1, rng, 1440),
        frequency: 10.0,
        iceAlbedo: { r: 0.93, g: 0.92, b: 0.9 },
        dustAlbedo: {
            r: dustBrightness * (0.86 + 0.1 * dustWarmth + dustRedBias),
            g: dustBrightness * (0.78 + 0.08 * dustWarmth + dustGreenBias),
            b: dustBrightness * (0.68 - 0.08 * dustWarmth + dustBlueBias),
        },
    };
}
