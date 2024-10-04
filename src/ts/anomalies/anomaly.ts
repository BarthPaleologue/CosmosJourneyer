import { AnomalyType } from "./anomalyType";
import { OrbitalObject } from "../architecture/orbitalObject";

export interface Anomaly extends OrbitalObject {
    readonly anomalyType: AnomalyType;
}
