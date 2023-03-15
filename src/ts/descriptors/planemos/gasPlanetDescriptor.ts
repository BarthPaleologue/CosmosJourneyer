import { seededSquirrelNoise } from "squirrel-noise";
import { centeredRand, normalRandom, randRangeInt, uniformRandBool } from "extended-random";
import { Settings } from "../../settings";
import { BODY_TYPE, BodyDescriptor, PlanemoDescriptor } from "../common";
import { IOrbitalProperties } from "../../orbits/iOrbitalProperties";
import { getOrbitalPeriod } from "../../orbits/kepler";
import { Quaternion } from "@babylonjs/core/Maths/math.vector";
import { PlanetPhysicalProperties } from "../common";

enum GENERATION_STEPS {
    AXIAL_TILT = 100,
    ORBIT = 200,
    RADIUS = 1000,
    RINGS = 1200,
    NB_MOONS = 10,
    MOONS = 11
}

export class GasPlanetDescriptor implements PlanemoDescriptor {
    readonly bodyType = BODY_TYPE.GAS;
    readonly seed: number;
    readonly rng: (step: number) => number;

    readonly radius: number;

    readonly orbitalProperties: IOrbitalProperties;

    readonly physicalProperties: PlanetPhysicalProperties;

    readonly hasRings: boolean;

    readonly nbMoons: number;

    readonly parentBodies: BodyDescriptor[];

    readonly childrenBodies: BodyDescriptor[] = [];

    constructor(seed: number, parentBodies: BodyDescriptor[]) {
        this.seed = seed;

        this.rng = seededSquirrelNoise(this.seed);

        this.parentBodies = parentBodies;

        this.radius = randRangeInt(Settings.EARTH_RADIUS * 4, Settings.EARTH_RADIUS * 20, this.rng, GENERATION_STEPS.RADIUS);

        // TODO: do not hardcode
        const periapsis = this.rng(GENERATION_STEPS.ORBIT) * 5000000e3;
        const apoapsis = periapsis * (1 + this.rng(GENERATION_STEPS.ORBIT + 10) / 10);

        this.orbitalProperties = {
            periapsis: periapsis,
            apoapsis: apoapsis,
            period: getOrbitalPeriod(periapsis, apoapsis, parentBodies),
            orientationQuaternion: Quaternion.Identity()
        };

        this.physicalProperties = {
            // FIXME: choose physically accurates values
            mass: 10,
            axialTilt: normalRandom(0, 0.4, this.rng, GENERATION_STEPS.AXIAL_TILT),
            rotationPeriod: (24 * 60 * 60) / 10,
            minTemperature: -180,
            maxTemperature: 200,
            pressure: 1
        };

        this.hasRings = uniformRandBool(0.8, this.rng, GENERATION_STEPS.RINGS);

        this.nbMoons = randRangeInt(0, 3, this.rng, GENERATION_STEPS.NB_MOONS);
    }

    getMoonSeed(index: number) {
        if (index > this.nbMoons) throw new Error("Moon out of bound! " + index);
        return centeredRand(this.rng, GENERATION_STEPS.MOONS + index) * Settings.SEED_HALF_RANGE;
    }

    getApparentRadius(): number {
        return this.radius;
    }

    get depth(): number {
        if (this.parentBodies.length === 0) return 0;
        return this.parentBodies[0].depth + 1;
    }
}
