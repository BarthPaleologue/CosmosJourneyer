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

export const enum Direction {
    UP,
    DOWN,
    LEFT,
    RIGHT,
    FORWARD,
    BACKWARD,
}

export function getQuaternionFromDirection(direction: Direction): Quaternion {
    switch (direction) {
        case Direction.UP:
            return Quaternion.RotationAxis(Axis.X, Math.PI / 2);
        case Direction.DOWN:
            return Quaternion.RotationAxis(Axis.X, -Math.PI / 2);
        case Direction.FORWARD:
            return Quaternion.Identity();
        case Direction.BACKWARD:
            return Quaternion.RotationAxis(Axis.Y, Math.PI);
        case Direction.LEFT:
            return Quaternion.RotationAxis(Axis.Y, Math.PI / 2);
        case Direction.RIGHT:
            return Quaternion.RotationAxis(Axis.Y, -Math.PI / 2);
    }
}
