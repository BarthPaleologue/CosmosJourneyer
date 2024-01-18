import { seededSquirrelNoise } from "squirrel-noise";
import { getOrbitalPeriod } from "../../orbit/orbit";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { normalRandom } from "extended-random";
import { OrbitProperties } from "../../orbit/orbitProperties";
import { STELLAR_TYPE } from "../common";
import { BODY_TYPE, GENERATION_STEPS } from "../../model/common";
import { StellarObjectModel } from "../../architecture/stellarObject";
import { BlackHolePhysicalProperties } from "../../architecture/physicalProperties";
import { CelestialBodyModel } from "../../architecture/celestialBody";

export class BlackHoleModel implements StellarObjectModel {
    readonly bodyType = BODY_TYPE.BLACK_HOLE;
    readonly seed: number;
    readonly rng: (step: number) => number;

    readonly radius: number;

    readonly stellarType = STELLAR_TYPE.BLACK_HOLE;

    readonly orbit: OrbitProperties;

    readonly physicalProperties: BlackHolePhysicalProperties;

    readonly parentBody: CelestialBodyModel | null;

    readonly childrenBodies: CelestialBodyModel[] = [];

    constructor(seed: number, parentBody?: CelestialBodyModel) {
        this.seed = seed;
        this.rng = seededSquirrelNoise(this.seed);

        this.radius = 1000e3;

        this.parentBody = parentBody ?? null;

        // TODO: do not hardcode
        const orbitRadius = this.parentBody === null ? 0 : 2 * (this.parentBody.radius + this.radius);

        this.orbit = {
            radius: orbitRadius,
            p: 2,
            period: getOrbitalPeriod(orbitRadius, this.parentBody?.physicalProperties.mass ?? 0),
            normalToPlane: Vector3.Up(),
            isPlaneAlignedWithParent: true
        };

        this.physicalProperties = {
            mass: 10,
            rotationPeriod: 24 * 60 * 60,
            axialTilt: normalRandom(0, 0.4, this.rng, GENERATION_STEPS.AXIAL_TILT),
            accretionDiskRadius: 8000e3
        };
    }
}
