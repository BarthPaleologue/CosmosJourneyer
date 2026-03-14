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
import { add, cos, f, hash11, mul, remap, sin, sqrt } from "babylonjs-shading-language";

export type DiskSampleOptions = {
    minRadius: number;
    maxRadius: number;
};

export function sampleDisk(
    id: NodeMaterialConnectionPoint,
    options: DiskSampleOptions,
): { x: NodeMaterialConnectionPoint; y: NodeMaterialConnectionPoint } {
    const radiusHash = hash11(add(id, f(11)));
    const thetaHash = hash11(add(id, f(29)));

    const radius = remap(sqrt(radiusHash), ["number", [0, 1], [options.minRadius, options.maxRadius]]);
    const theta = mul(thetaHash, f(2.0 * Math.PI));

    return {
        x: mul(radius, cos(theta)),
        y: mul(radius, sin(theta)),
    };
}
