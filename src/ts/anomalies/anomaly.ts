import { CelestialBodyModel } from "../architecture/celestialBody";
import { OrbitalObjectType } from "../architecture/orbitalObject";

export interface AnomalyModel extends CelestialBodyModel {
    readonly type:
        | OrbitalObjectType.MANDELBULB
        | OrbitalObjectType.JULIA_SET
        | OrbitalObjectType.MANDELBOX
        | OrbitalObjectType.SIERPINSKI_PYRAMID;
}
