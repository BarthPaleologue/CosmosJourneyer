import { seededSquirrelNoise } from "squirrel-noise";
import { BodyDescriptor, BODY_TYPE, StellarObjectDescriptor, BlackHolePhysicalProperties } from "../common";
import { getOrbitalPeriod } from "../../orbits/kepler";
import { Quaternion } from "@babylonjs/core/Maths/math.vector";
import { IOrbitalProperties } from "../../orbits/iOrbitalProperties";
import { normalRandom } from "extended-random";
import { STELLAR_TYPE } from "./common";

enum GENERATION_STEPS {
    AXIAL_TILT = 100
}

export class BlackHoleDescriptor implements StellarObjectDescriptor {
    readonly bodyType = BODY_TYPE.BLACK_HOLE;
    readonly seed: number;
    readonly rng: (step: number) => number;

    readonly radius: number;

    readonly stellarType = STELLAR_TYPE.BLACK_HOLE;

    readonly orbitalProperties: IOrbitalProperties;

    readonly physicalProperties: BlackHolePhysicalProperties;

    readonly parentBodies: BodyDescriptor[] = [];

    readonly childrenBodies: BodyDescriptor[] = [];

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

    get depth(): number {
        if (this.parentBodies.length === 0) return 0;
        return this.parentBodies[0].depth + 1;
    }
}
