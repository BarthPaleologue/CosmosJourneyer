import { LVector3 } from "../../../utils/algebra";

export type elevationFunction = (coords: LVector3, gradient: LVector3) => number;