import { seededSquirrelNoise } from "squirrel-noise";
import { BodyModel, BODY_TYPE, PlanemoModel, PlanetPhysicalProperties, GENERATION_STEPS } from "../common";
import { getOrbitalPeriod, getPeriapsis, OrbitalProperties } from "../orbit";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { normalRandom, randRange, randRangeInt } from "extended-random";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { clamp } from "../../utils/math";

export class MandelbulbModel implements PlanemoModel {
    readonly bodyType = BODY_TYPE.MANDELBULB;
    readonly seed: number;
    readonly rng: (step: number) => number;

    readonly radius: number;

    readonly orbit: OrbitalProperties;

    readonly physicalProperties: PlanetPhysicalProperties;

    readonly parentBody: BodyModel | null;

    readonly childrenBodies: BodyModel[] = [];

    readonly nbMoons: number;

    readonly power: number;
    readonly accentColor: Color3;

    constructor(seed: number, parentBody?: BodyModel) {
        this.seed = seed;
        this.rng = seededSquirrelNoise(this.seed);

        this.radius = 1000e3;

        this.parentBody = parentBody ?? null;

        this.power = randRange(1.5, 6.0, this.rng, GENERATION_STEPS.POWER);
        this.accentColor = new Color3(this.rng(GENERATION_STEPS.ACCENNT_COLOR), this.rng(GENERATION_STEPS.ACCENNT_COLOR + 10), this.rng(GENERATION_STEPS.ACCENNT_COLOR + 20));

        // TODO: do not hardcode
        let orbitRadius = this.rng(GENERATION_STEPS.ORBIT) * 15e9;

        const orbitalP = clamp(0.5, 3.0, normalRandom(1.0, 0.3, this.rng, GENERATION_STEPS.ORBIT + 80));
        orbitRadius += orbitRadius - getPeriapsis(orbitRadius, orbitalP);

        this.orbit = {
            radius: orbitRadius,
            p: orbitalP,
            period: getOrbitalPeriod(orbitRadius, this.parentBody?.physicalProperties.mass ?? 0),
            normalToPlane: Vector3.Up(),
            isPlaneAlignedWithParent: true
        };

        this.physicalProperties = {
            mass: 10,
            rotationPeriod: 0,
            axialTilt: normalRandom(0, 0.4, this.rng, GENERATION_STEPS.AXIAL_TILT),
            minTemperature: -180,
            maxTemperature: 100,
            pressure: 0
        };

        this.nbMoons = randRangeInt(0, 2, this.rng, GENERATION_STEPS.NB_MOONS);
    }

    getApparentRadius(): number {
        return this.radius;
    }
}
