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

import { type NodeMaterialConnectionPoint } from "@babylonjs/core/Materials/Node/nodeMaterialBlockConnectionPoint";

import { acos, add, atan2, div, f, merge, split, sub } from "./bsl";

export function unitSphereToUv(positionUnitSphere: NodeMaterialConnectionPoint) {
    const splittedUnitSpherePosition = split(positionUnitSphere);

    const theta = acos(splittedUnitSpherePosition.y);
    const phi = atan2(splittedUnitSpherePosition.z, splittedUnitSpherePosition.x);

    const u = div(add(phi, f(Math.PI)), f(2.0 * Math.PI));
    const v = div(theta, f(Math.PI));

    return merge(sub(f(1.0), u), sub(f(1.0), v), null, null).xyOut;
}
