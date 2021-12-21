import { Quaternion } from "./algebra";

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
            return Quaternion.RotationX(Math.PI / 2);
        case Direction.Down:
            return Quaternion.RotationX(-Math.PI / 2);
        case Direction.Forward:
            return Quaternion.Identity();
        case Direction.Backward:
            return Quaternion.RotationY(Math.PI);
        case Direction.Left:
            return Quaternion.RotationY(Math.PI / 2);
        case Direction.Right:
            return Quaternion.RotationY(-Math.PI / 2);
    }
}