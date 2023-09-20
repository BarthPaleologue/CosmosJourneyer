import { seededSquirrelNoise } from "squirrel-noise";
import { BodyModel, BODY_TYPE, StellarObjectModel, BlackHolePhysicalProperties, GENERATION_STEPS } from "../common";
import { getOrbitalPeriod } from "../orbits/kepler";
import { Quaternion } from "@babylonjs/core/Maths/math.vector";
import { IOrbitalProperties } from "../orbits/iOrbitalProperties";
import { normalRandom } from "extended-random";
import { STELLAR_TYPE } from "./common";

export class BlackHoleModel implements StellarObjectModel {
    readonly bodyType = BODY_TYPE.BLACK_HOLE;
    readonly seed: number;
    readonly rng: (step: number) => number;

    readonly radius: number;

    readonly stellarType = STELLAR_TYPE.BLACK_HOLE;

    readonly orbitalProperties: IOrbitalProperties;

    readonly physicalProperties: BlackHolePhysicalProperties;

    readonly parentBodies: BodyModel[] = [];

    readonly childrenBodies: BodyModel[] = [];

    constructor(seed: number) {
        this.seed = seed;
        this.rng = seededSquirrelNoise(this.seed);

        this.radius = 1000e3;

        // TODO: do not hardcode
        const periapsis = 0;
        const apoapsis = 0;

        this.orbitalProperties = {
            periapsis: periapsis,
            apoapsis: apoapsis,
            period: getOrbitalPeriod(periapsis, apoapsis, []),
            orientationQuaternion: Quaternion.Identity(),
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
