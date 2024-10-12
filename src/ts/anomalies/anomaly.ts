import { AnomalyType } from "./anomalyType";
import { CelestialBody, CelestialBodyModel } from "../architecture/celestialBody";

export interface Anomaly extends CelestialBody {
    readonly anomalyType: AnomalyType;
}

export interface AnomalyModel extends CelestialBodyModel {
    readonly anomalyType: AnomalyType;
}