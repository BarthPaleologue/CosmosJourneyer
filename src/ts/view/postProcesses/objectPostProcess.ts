import { BaseObject } from "../../model/orbits/iOrbitalObject";
import { UberPostProcess } from "../../controller/uberCore/postProcesses/uberPostProcess";

export interface ObjectPostProcess extends UberPostProcess {
    readonly object: BaseObject;
}
