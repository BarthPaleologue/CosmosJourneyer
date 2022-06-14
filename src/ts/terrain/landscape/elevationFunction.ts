import { LVector3 } from "../../utils/algebra";

export type elevationFunction = (coords: LVector3, seed: number, gradient: LVector3) => number;
