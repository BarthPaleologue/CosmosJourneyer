import { seededSquirrelNoise } from "squirrel-noise";
import { centeredRand, normalRandom, randRangeInt, uniformRandBool } from "extended-random";
import { Settings } from "../../settings";
import { BODY_TYPE, BodyModel, GENERATION_STEPS, PlanemoModel, PlanetPhysicalProperties } from "../common";
import { OrbitalProperties } from "../orbits/orbitalProperties";
import { getOrbitalPeriod, getPeriapsis } from "../orbits/compute";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { clamp } from "../../utils/math";

export class GasPlanetModel implements PlanemoModel {
    readonly bodyType = BODY_TYPE.GAS;
    readonly seed: number;
    readonly rng: (step: number) => number;

    readonly radius: number;

    readonly orbitalProperties: OrbitalProperties;

    readonly physicalProperties: PlanetPhysicalProperties;

    readonly hasRings: boolean;

    readonly nbMoons: number;

    readonly parentBody: BodyModel | null;

    readonly childrenBodies: BodyModel[] = [];

    constructor(seed: number, parentBody?: BodyModel) {
        this.seed = seed;

        this.rng = seededSquirrelNoise(this.seed);

        this.parentBody = parentBody ?? null;

        this.radius = randRangeInt(Settings.EARTH_RADIUS * 4, Settings.EARTH_RADIUS * 20, this.rng, GENERATION_STEPS.RADIUS);

        // TODO: do not hardcode
        let orbitRadius = this.rng(GENERATION_STEPS.ORBIT) * 15e9;

        const orbitalP = clamp(0.7, 3.0, normalRandom(2.0, 0.3, this.rng, GENERATION_STEPS.ORBIT + 80));
        orbitRadius += orbitRadius - getPeriapsis(orbitRadius, orbitalP);

        this.orbitalProperties = {
            radius: orbitRadius,
            p: orbitalP,
            period: getOrbitalPeriod(orbitRadius, this.parentBody),
            normalToPlane: Vector3.Up(),
            isPlaneAlignedWithParent: true
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

    getApparentRadius(): number {
        return this.radius;
    }
}
