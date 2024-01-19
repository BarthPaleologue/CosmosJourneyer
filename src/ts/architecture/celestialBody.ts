import { OrbitalObject, OrbitalObjectModel } from "./orbitalObject";
import { HasPostProcesses } from "./hasPostProcesses";
import { CanHaveRings } from "./canHaveRings";
import { BODY_TYPE } from "../model/common";

/**
 * Describes all celestial bodies (a combination of OrbitalObject, CanHaveRings and HasPostProcesses)
 */
export interface CelestialBody extends OrbitalObject, CanHaveRings, HasPostProcesses {
    /**
     * The underlying model describing the data of the celestial body
     */
    readonly model: CelestialBodyModel;

    /**
     * Returns the radius of the celestial body
     */
    getRadius(): number;
}

/**
 * Describes the model of a celestial body
 */
export interface CelestialBodyModel extends OrbitalObjectModel {
    /**
     * The type of the celestial body
     */
    readonly bodyType: BODY_TYPE;

    /**
     * The radius of the celestial body
     */
    readonly radius: number;
}
