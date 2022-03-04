import { LVector3 } from "../../toolbox/algebra";

export type elevationFunction = (coords: LVector3, gradient: LVector3) => number;