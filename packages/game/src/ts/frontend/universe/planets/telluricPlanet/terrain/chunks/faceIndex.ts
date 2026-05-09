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

import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Quaternion } from "@babylonjs/core/Maths/math.vector";

import { assertUnreachable } from "@/utils/types";

export type FaceIndex = 0 | 1 | 2 | 3 | 4 | 5;

export function getQuaternionFromFaceIndex(faceIndex: FaceIndex): Quaternion {
    switch (faceIndex) {
        case 0:
            return Quaternion.RotationAxis(Axis.X, Math.PI / 2);
        case 1:
            return Quaternion.RotationAxis(Axis.X, -Math.PI / 2);
        case 2:
            return Quaternion.RotationAxis(Axis.Y, Math.PI / 2);
        case 3:
            return Quaternion.RotationAxis(Axis.Y, -Math.PI / 2);
        case 4:
            return Quaternion.Identity();
        case 5:
            return Quaternion.RotationAxis(Axis.Y, Math.PI);
        default:
            return assertUnreachable(faceIndex);
    }
}
