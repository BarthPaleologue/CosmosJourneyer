import { AbstractBody } from "./abstractBody";
import { BodyType } from "./interfaces";
import { BlackHolePostProcesses } from "./postProcessesInterfaces";
import { IOrbitalBody } from "../orbits/iOrbitalBody";
import { PhysicalProperties } from "./physicalProperties";

export class BlackHole extends AbstractBody {
    readonly bodyType: BodyType = BodyType.BLACK_HOLE;
    physicalProperties: PhysicalProperties;
    postProcesses: BlackHolePostProcesses;
    readonly radius: number;

    constructor(name: string, radius: number, seed: number, parentBodies: IOrbitalBody[]) {
        super(name, seed, parentBodies);

        this.radius = radius;
        this.physicalProperties = {
            mass: 10,
            rotationPeriod: 24 * 60 * 60
        };
        this.postProcesses = {
            rings: false,
            overlay: true,
            blackHole: true
        };
    }
}
