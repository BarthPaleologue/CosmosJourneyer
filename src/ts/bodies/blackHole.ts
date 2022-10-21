import { AbstractBody } from "./abstractBody";
import { StarSystem } from "./starSystem";
import { BodyType } from "./interfaces";
import { BlackHolePostProcesses } from "./postProcessesInterfaces";
import { IOrbitalBody } from "../orbits/iOrbitalBody";
import { PhysicalProperties } from "./physicalProperties";
import { BlackHolePostProcess } from "../postProcesses/planetPostProcesses/blackHolePostProcess";
import { OverlayPostProcess } from "../postProcesses/overlayPostProcess";

export class BlackHole extends AbstractBody {
    readonly bodyType: BodyType = BodyType.BLACK_HOLE;
    physicalProperties: PhysicalProperties;
    postProcesses: BlackHolePostProcesses;
    readonly radius: number;

    constructor(name: string, radius: number, starSystem: StarSystem, seed: number, parentBodies: IOrbitalBody[]) {
        super(name, starSystem, seed, parentBodies);
        starSystem.addStar(this);

        this.radius = radius;
        this.physicalProperties = {
            mass: 10,
            rotationPeriod: 24 * 60 * 60
        };
        this.postProcesses = {
            rings: null,
            overlay: new OverlayPostProcess("BH", this, starSystem.scene),
            blackHole: new BlackHolePostProcess("BH", this, starSystem.scene)
        };
    }
}
