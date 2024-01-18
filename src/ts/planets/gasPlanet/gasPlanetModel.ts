import { seededSquirrelNoise } from "squirrel-noise";
import { normalRandom, randRangeInt, uniformRandBool } from "extended-random";
import { Settings } from "../../settings";
import { BODY_TYPE, GENERATION_STEPS } from "../../model/common";
import { RingsUniforms } from "../../postProcesses/rings/ringsUniform";
import { Quaternion } from "@babylonjs/core/Maths/math";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { OrbitProperties } from "../../orbit/orbitProperties";
import { clamp } from "../../utils/math";
import { getOrbitalPeriod, getPeriapsis } from "../../orbit/orbit";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PlanetModel } from "../../architecture/planet";
import { PlanetPhysicalProperties } from "../../architecture/physicalProperties";
import { CelestialBodyModel } from "../../architecture/celestialBody";

export class GasPlanetModel implements PlanetModel {
    readonly bodyType = BODY_TYPE.GAS_PLANET;
    readonly seed: number;
    readonly rng: (step: number) => number;

    readonly radius: number;

    readonly orbit: OrbitProperties;

    readonly physicalProperties: PlanetPhysicalProperties;

    readonly ringsUniforms;

    readonly nbMoons: number;

    readonly parentBody: CelestialBodyModel | null;

    readonly childrenBodies: CelestialBodyModel[] = [];

    constructor(seed: number, parentBody?: CelestialBodyModel) {
        this.seed = seed;

        this.rng = seededSquirrelNoise(this.seed);

        this.parentBody = parentBody ?? null;

        this.radius = randRangeInt(Settings.EARTH_RADIUS * 4, Settings.EARTH_RADIUS * 20, this.rng, GENERATION_STEPS.RADIUS);

        // TODO: do not hardcode
        let orbitRadius = this.rng(GENERATION_STEPS.ORBIT) * 15e9;

        const orbitalP = clamp(0.7, 3.0, normalRandom(2.0, 0.3, this.rng, GENERATION_STEPS.ORBIT + 80));
        orbitRadius += orbitRadius - getPeriapsis(orbitRadius, orbitalP);
        if (parentBody) orbitRadius += parentBody.radius * 1.5;

        const orbitalPlaneNormal = Vector3.Up().applyRotationQuaternionInPlace(Quaternion.RotationAxis(Axis.X, (this.rng(GENERATION_STEPS.ORBIT + 20) - 0.5) * 0.2));

        this.orbit = {
            radius: orbitRadius,
            p: 2, //orbitalP,
            period: getOrbitalPeriod(orbitRadius, this.parentBody?.physicalProperties.mass ?? 0),
            normalToPlane: orbitalPlaneNormal,
            isPlaneAlignedWithParent: true
        };

        this.physicalProperties = {
            // FIXME: choose physically accurate values
            mass: 10,
            axialTilt: normalRandom(0, 0.4, this.rng, GENERATION_STEPS.AXIAL_TILT),
            rotationPeriod: (24 * 60 * 60) / 10,
            minTemperature: -180,
            maxTemperature: 200,
            pressure: 1
        };

        if (uniformRandBool(0.8, this.rng, GENERATION_STEPS.RINGS)) {
            this.ringsUniforms = new RingsUniforms(this.rng);
        } else {
            this.ringsUniforms = null;
        }

        this.nbMoons = randRangeInt(0, 3, this.rng, GENERATION_STEPS.NB_MOONS);
    }

    getApparentRadius(): number {
        return this.radius;
    }
}
