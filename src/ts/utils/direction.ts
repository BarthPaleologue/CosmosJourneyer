import {Axis, Quaternion} from "@babylonjs/core";

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