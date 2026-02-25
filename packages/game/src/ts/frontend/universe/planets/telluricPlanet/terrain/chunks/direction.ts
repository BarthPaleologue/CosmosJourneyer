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

export type Direction = "up" | "down" | "left" | "right" | "forward" | "backward";

export function getQuaternionFromDirection(direction: Direction): Quaternion {
    switch (direction) {
        case "up":
            return Quaternion.RotationAxis(Axis.X, Math.PI / 2);
        case "down":
            return Quaternion.RotationAxis(Axis.X, -Math.PI / 2);
        case "forward":
            return Quaternion.Identity();
        case "backward":
            return Quaternion.RotationAxis(Axis.Y, Math.PI);
        case "left":
            return Quaternion.RotationAxis(Axis.Y, Math.PI / 2);
        case "right":
            return Quaternion.RotationAxis(Axis.Y, -Math.PI / 2);
        default:
            return assertUnreachable(direction);
    }
}

export function getFaceIndexFromDirection(direction: Direction): number {
    switch (direction) {
        case "up":
            return 0;
        case "down":
            return 1;
        case "left":
            return 2;
        case "right":
            return 3;
        case "forward":
            return 4;
        case "backward":
            return 5;
        default:
            return assertUnreachable(direction);
    }
}
