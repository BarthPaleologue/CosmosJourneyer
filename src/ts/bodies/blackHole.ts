import { AbstractBody } from "./abstractBody";
import { BodyType } from "./interfaces";
import { BlackHolePostProcesses } from "./postProcessesInterfaces";
import { PhysicalProperties } from "./physicalProperties";
import { BlackHoleDescriptor } from "../descriptors/blackHoleDescriptor";
import { IOrbitalProperties } from "../orbits/iOrbitalProperties";
import { BodyDescriptor } from "../descriptors/interfaces";

export class BlackHole extends AbstractBody {
    readonly bodyType: BodyType = BodyType.BLACK_HOLE;
    readonly orbitalProperties: IOrbitalProperties;
    physicalProperties: PhysicalProperties;
    postProcesses: BlackHolePostProcesses;
    readonly radius: number;

    readonly descriptor: BlackHoleDescriptor;

    constructor(name: string, radius: number, seed: number, parentBodies: AbstractBody[]) {
        super(name, parentBodies);

        this.descriptor = new BlackHoleDescriptor(seed);

        this.radius = this.descriptor.radius;

        this.physicalProperties = {
            mass: 10,
            rotationPeriod: 24 * 60 * 60,
            axialTilt: 0
        };

        this.orbitalProperties = this.descriptor.orbitalProperties;

        this.postProcesses = {
            rings: false,
            overlay: true,
            blackHole: true
        };
    }
}
