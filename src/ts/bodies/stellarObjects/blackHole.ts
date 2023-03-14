import { AbstractBody } from "../abstractBody";
import { BlackHolePostProcesses } from "../postProcessesInterfaces";
import { BlackHoleDescriptor } from "../../descriptors/stellarObjects/blackHoleDescriptor";
import { IOrbitalProperties } from "../../orbits/iOrbitalProperties";
import { Axis } from "@babylonjs/core";

export class BlackHole extends AbstractBody {
    readonly orbitalProperties: IOrbitalProperties;
    readonly postProcesses: BlackHolePostProcesses;

    readonly descriptor: BlackHoleDescriptor;

    constructor(name: string, seed: number, parentBodies: AbstractBody[]) {
        super(name, parentBodies);

        this.descriptor = new BlackHoleDescriptor(seed);

        this.transform.rotate(Axis.X, this.descriptor.physicalProperties.axialTilt);

        this.orbitalProperties = this.descriptor.orbitalProperties;

        this.postProcesses = {
            rings: false,
            overlay: true,
            blackHole: true
        };
    }
}
