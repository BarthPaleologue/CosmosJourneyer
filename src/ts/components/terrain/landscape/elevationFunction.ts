import { Vector3 } from "../../toolbox/algebra";

export type elevationFunction = (coords: Vector3, gradient: Vector3) => number;