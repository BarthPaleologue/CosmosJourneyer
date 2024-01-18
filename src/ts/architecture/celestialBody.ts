import { OrbitalObject } from "./orbitalObject";
import { HasPostProcesses } from "./hasPostProcesses";
import { CanHaveRings } from "./canHaveRings";

export interface CelestialBody extends OrbitalObject, CanHaveRings, HasPostProcesses {
    /**
     * Returns the radius of the celestial body
     */
    getRadius(): number;
}
