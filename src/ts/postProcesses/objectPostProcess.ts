import { BaseObject } from "../orbits/iOrbitalObject";
import { UberPostProcess } from "../uberCore/postProcesses/uberPostProcess";

export interface ObjectPostProcess extends UberPostProcess {
    readonly object: BaseObject;
}
