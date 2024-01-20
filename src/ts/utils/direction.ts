//  This file is part of CosmosJourneyer
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

import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Quaternion } from "@babylonjs/core/Maths/math.vector";

export enum Direction {
    Up,
    Down,
    Left,
    Right,
    Forward,
    Backward
}

export function getQuaternionFromDirection(direction: Direction): Quaternion {
    switch (direction) {
        case Direction.Up:
            return Quaternion.RotationAxis(Axis.X, Math.PI / 2);
        case Direction.Down:
            return Quaternion.RotationAxis(Axis.X, -Math.PI / 2);
        case Direction.Forward:
            return Quaternion.Identity();
        case Direction.Backward:
            return Quaternion.RotationAxis(Axis.Y, Math.PI);
        case Direction.Left:
            return Quaternion.RotationAxis(Axis.Y, Math.PI / 2);
        case Direction.Right:
            return Quaternion.RotationAxis(Axis.Y, -Math.PI / 2);
    }
}
