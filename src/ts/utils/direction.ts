import {LQuaternion} from "./algebra";

import {Quaternion} from "@babylonjs/core";

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
            return LQuaternion.RotationX(Math.PI / 2);
        case Direction.Down:
            return LQuaternion.RotationX(-Math.PI / 2);
        case Direction.Forward:
            return LQuaternion.Identity();
        case Direction.Backward:
            return LQuaternion.RotationY(Math.PI);
        case Direction.Left:
            return LQuaternion.RotationY(Math.PI / 2);
        case Direction.Right:
            return LQuaternion.RotationY(-Math.PI / 2);
    }
}