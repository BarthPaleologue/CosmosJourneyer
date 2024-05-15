import { CelestialBody } from "../architecture/celestialBody";
import { AnomalyType } from "./anomalyType";

export interface Anomaly extends CelestialBody {
    readonly anomalyType: AnomalyType;
}