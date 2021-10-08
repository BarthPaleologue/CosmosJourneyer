import { Matrix3 } from "./algebra";

export enum Direction {
    Up,
    Down,
    Left,
    Right,
    Forward,
    Backward
}

export function getRotationMatrixFromDirection(direction: Direction): Matrix3 {
    switch (direction) {
        case Direction.Up:
            return Matrix3.RotationX(-Math.PI / 2);
        case Direction.Down:
            return Matrix3.RotationX(Math.PI / 2);
        case Direction.Forward:
            return Matrix3.Identity();
        case Direction.Backward:
            return Matrix3.RotationY(-Math.PI);
        case Direction.Left:
            return Matrix3.RotationY(Math.PI / 2);
        case Direction.Right:
            return Matrix3.RotationY(-Math.PI / 2);
    }
}