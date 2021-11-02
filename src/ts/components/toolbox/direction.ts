import { Matrix } from "./algebra";

export enum Direction {
    Up,
    Down,
    Left,
    Right,
    Forward,
    Backward
}

export function getRotationMatrixFromDirection(direction: Direction): Matrix {
    switch (direction) {
        case Direction.Up:
            return Matrix.Rotation3DX(-Math.PI / 2);
        case Direction.Down:
            return Matrix.Rotation3DX(Math.PI / 2);
        case Direction.Forward:
            return Matrix.Identity3D();
        case Direction.Backward:
            return Matrix.Rotation3DY(-Math.PI);
        case Direction.Left:
            return Matrix.Rotation3DY(Math.PI / 2);
        case Direction.Right:
            return Matrix.Rotation3DY(-Math.PI / 2);
    }
}