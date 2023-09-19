import { seededSquirrelNoise } from "squirrel-noise";
import { BodyModel, BODY_TYPE, PlanemoModel, PlanetPhysicalProperties } from "../common";
import { getOrbitalPeriod } from "../orbits/kepler";
import { Quaternion } from "@babylonjs/core/Maths/math.vector";
import { IOrbitalProperties } from "../orbits/iOrbitalProperties";
import { normalRandom, randRange } from "extended-random";

enum GENERATION_STEPS {
    ORBIT = 200,
    AXIAL_TILT = 100,
    POWER = 300
}

export class MandelbulbModel implements PlanemoModel {
    readonly bodyType = BODY_TYPE.FRACTAL;
    readonly seed: number;
    readonly rng: (step: number) => number;

    readonly radius: number;

    readonly orbitalProperties: IOrbitalProperties;

    readonly physicalProperties: PlanetPhysicalProperties;

    readonly parentBodies: BodyModel[] = [];

    readonly childrenBodies: BodyModel[] = [];

    readonly power: number;

    constructor(seed: number, parentBodies: BodyModel[]) {
        this.seed = seed;
        this.rng = seededSquirrelNoise(this.seed);

        this.radius = 1000e3;

        this.parentBodies = parentBodies;

        this.power = randRange(1.0, 18.0, this.rng, GENERATION_STEPS.POWER);

        // TODO: do not hardcode
        const periapsis = this.rng(GENERATION_STEPS.ORBIT) * 15e9;
        const apoapsis = periapsis * (1 + this.rng(GENERATION_STEPS.ORBIT + 10) / 10);

        this.orbitalProperties = {
            periapsis: periapsis,
            apoapsis: apoapsis,
            period: getOrbitalPeriod(periapsis, apoapsis, []),
            orientationQuaternion: Quaternion.Identity(),
            isPlaneAlignedWithParent: true
        };

        this.physicalProperties = {
            mass: 10,
            rotationPeriod: 0,
            axialTilt: normalRandom(0, 0.4, this.rng, GENERATION_STEPS.AXIAL_TILT),
            minTemperature: -180,
            maxTemperature: 100,
            pressure: 0,
        };
    }

    get depth(): number {
        if (this.parentBodies.length === 0) return 0;
        return this.parentBodies[0].depth + 1;
    }

    getApparentRadius(): number {
        return this.radius;
    }

    getMoonSeed(index: number): number {
        return this.rng(index);
    }
}
