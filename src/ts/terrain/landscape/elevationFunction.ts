import { LVector3 } from "../../utils/algebra";

export type simpleElevationFunction = (coords: LVector3, seed: number, gradient: LVector3) => number;

export type advancedElevationFunction = (coords: LVector3, seed: number, localGradient: LVector3, totalGradient: LVector3, totalElevation: number, octaveIndex: number) => number;