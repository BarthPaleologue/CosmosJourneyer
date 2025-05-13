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

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { expect, test } from "vitest";

import { getTransformationQuaternion } from "@/utils/algebra";

test("getTransformationQuaternion", () => {
    const from = new Vector3(0, 1, 0);
    const to = new Vector3(0, 1, 0);

    const quaternion2 = getTransformationQuaternion(from, to);
    expect(quaternion2.x).to.equal(0);
    expect(quaternion2.y).to.equal(0);
    expect(quaternion2.z).to.equal(0);
    expect(quaternion2.w).to.equal(1);
});
