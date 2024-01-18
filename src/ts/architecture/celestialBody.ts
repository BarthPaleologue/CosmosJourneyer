import { OrbitalObject, OrbitalObjectModel } from "./orbitalObject";
import { HasPostProcesses } from "./hasPostProcesses";
import { CanHaveRings } from "./canHaveRings";
import { BODY_TYPE } from "../model/common";

export interface CelestialBody extends OrbitalObject, CanHaveRings, HasPostProcesses {
    model: CelestialBodyModel;

    /**
     * Returns the radius of the celestial body
     */
    getRadius(): number;
}

export interface CelestialBodyModel extends OrbitalObjectModel {
    readonly bodyType: BODY_TYPE;
    readonly radius: number;
}