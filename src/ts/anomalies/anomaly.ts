import { AnomalyType } from "./anomalyType";
import { CelestialBody } from "../architecture/celestialBody";

export interface Anomaly extends CelestialBody {
    readonly anomalyType: AnomalyType;
}
