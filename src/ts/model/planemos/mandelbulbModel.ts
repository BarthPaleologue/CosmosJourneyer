import { seededSquirrelNoise } from "squirrel-noise";
import { BodyModel, BODY_TYPE, PlanemoModel, PlanetPhysicalProperties, GENERATION_STEPS } from "../common";
import { getOrbitalPeriod } from "../orbits/kepler";
import { Quaternion } from "@babylonjs/core/Maths/math.vector";
import { IOrbitalProperties } from "../orbits/iOrbitalProperties";
import { normalRandom, randRange, randRangeInt } from "extended-random";
import { Color3 } from "@babylonjs/core/Maths/math.color";

export class MandelbulbModel implements PlanemoModel {
    readonly bodyType = BODY_TYPE.MANDELBULB;
    readonly seed: number;
    readonly rng: (step: number) => number;

    readonly radius: number;

    readonly orbitalProperties: IOrbitalProperties;

    readonly physicalProperties: PlanetPhysicalProperties;

    readonly parentBodies: BodyModel[] = [];

    readonly childrenBodies: BodyModel[] = [];

    readonly nbMoons: number;

    readonly power: number;
    readonly accentColor: Color3;

    constructor(seed: number, parentBodies: BodyModel[]) {
        this.seed = seed;
        this.rng = seededSquirrelNoise(this.seed);

        this.radius = 1000e3;

        this.parentBodies = parentBodies;

        this.power = randRange(1.0, 18.0, this.rng, GENERATION_STEPS.POWER);
        this.accentColor = new Color3(
            this.rng(GENERATION_STEPS.ACCENNT_COLOR),
            this.rng(GENERATION_STEPS.ACCENNT_COLOR + 10),
            this.rng(GENERATION_STEPS.ACCENNT_COLOR + 20)
        );

        // TODO: do not hardcode
        const periapsis = this.rng(GENERATION_STEPS.ORBIT) * 15e9;
        const apoapsis = periapsis * (1 + this.rng(GENERATION_STEPS.ORBIT + 10) / 10);

        console.log(seed, apoapsis, periapsis);

        this.orbitalProperties = {
            periapsis: periapsis,
            apoapsis: apoapsis,
            period: getOrbitalPeriod(periapsis, apoapsis, parentBodies),
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

        this.nbMoons = this.nbMoons = randRangeInt(0, 2, this.rng, GENERATION_STEPS.NB_MOONS);
    }

    getApparentRadius(): number {
        return this.radius;
    }
}
