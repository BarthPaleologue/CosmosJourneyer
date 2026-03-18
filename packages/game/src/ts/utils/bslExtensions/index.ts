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

import type { NodeMaterialConnectionPoint } from "@babylonjs/core/Materials/Node/nodeMaterialBlockConnectionPoint";
import { add, mul, type TargetOptions } from "babylonjs-shading-language";

export { sampleDisk, type DiskSampleOptions } from "./random";

type ConnectionPointList = readonly [
    NodeMaterialConnectionPoint,
    NodeMaterialConnectionPoint,
    ...NodeMaterialConnectionPoint[],
];

export function addN(inputs: ConnectionPointList, options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    let result = add(inputs[0], inputs[1], options);

    for (let i = 2; i < inputs.length; i++) {
        const input = inputs[i];
        if (input === undefined) {
            console.warn("addN: input", i, "is undefined, skipping");
            continue;
        }
        result = add(result, input, options);
    }

    return result;
}

export function mulN(inputs: ConnectionPointList, options?: Partial<TargetOptions>): NodeMaterialConnectionPoint {
    let result = mul(inputs[0], inputs[1], options);

    for (let i = 2; i < inputs.length; i++) {
        const input = inputs[i];
        if (input === undefined) {
            console.warn("mulN: input", i, "is undefined, skipping");
            continue;
        }
        result = mul(result, input, options);
    }

    return result;
}
