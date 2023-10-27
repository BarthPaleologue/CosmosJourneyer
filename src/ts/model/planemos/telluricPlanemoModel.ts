import { seededSquirrelNoise } from "squirrel-noise";
import { normalRandom, randRangeInt, uniformRandBool } from "extended-random";
import { Settings } from "../../settings";
import { BODY_TYPE, BodyModel, GENERATION_STEPS, PlanemoModel, SolidPhysicalProperties } from "../common";
import { TerrainSettings } from "../terrain/terrainSettings";
import { clamp } from "terrain-generation";
import { getOrbitalPeriod, getPeriapsis } from "../orbit/orbit";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { OrbitProperties } from "../orbit/orbitProperties";
import { RingsUniforms } from "../ringsUniform";

export class TelluricPlanemoModel implements PlanemoModel {
    readonly bodyType = BODY_TYPE.TELLURIC;
    readonly seed: number;
    readonly rng: (step: number) => number;

    readonly radius: number;

    readonly orbit: OrbitProperties;

    readonly physicalProperties: SolidPhysicalProperties;

    readonly terrainSettings: TerrainSettings;

    ringsUniforms;

    readonly nbMoons: number;

    private isSatelliteOfTelluric = false;
    private isSatelliteOfGas = false;

    readonly parentBody: BodyModel | null;
    readonly childrenBodies: BodyModel[] = [];

    constructor(seed: number, parentBody?: BodyModel) {
        this.seed = seed;
        this.rng = seededSquirrelNoise(this.seed);

        this.parentBody = parentBody ?? null;

        if (this.parentBody?.bodyType === BODY_TYPE.TELLURIC) this.isSatelliteOfTelluric = true;
        if (this.parentBody?.bodyType === BODY_TYPE.GAS) this.isSatelliteOfGas = true;

        if (this.isSatelliteOfTelluric) {
            this.radius = Math.max(0.03, normalRandom(0.06, 0.03, this.rng, GENERATION_STEPS.RADIUS)) * Settings.EARTH_RADIUS;
        } else if (this.isSatelliteOfGas) {
            this.radius = Math.max(0.03, normalRandom(0.25, 0.15, this.rng, GENERATION_STEPS.RADIUS)) * Settings.EARTH_RADIUS;
        } else {
            this.radius = Math.max(0.3, normalRandom(1.0, 0.1, this.rng, GENERATION_STEPS.RADIUS)) * Settings.EARTH_RADIUS;
        }

        const mass = this.isSatelliteOfTelluric ? 1 : 10;

        this.physicalProperties = {
            mass: mass,
            axialTilt: normalRandom(0, 0.2, this.rng, GENERATION_STEPS.AXIAL_TILT),
            rotationPeriod: (60 * 60 * 24) / 10,
            minTemperature: randRangeInt(-50, 5, this.rng, 80),
            maxTemperature: randRangeInt(10, 50, this.rng, 81),
            pressure: Math.max(normalRandom(0.9, 0.2, this.rng, GENERATION_STEPS.PRESSURE), 0),
            waterAmount: Math.max(normalRandom(1.0, 0.3, this.rng, GENERATION_STEPS.WATER_AMOUNT), 0),
            oceanLevel: 0
        };

        const isOrbitalPlaneAlignedWithParent = true; //this.isSatelliteOfGas && uniformRandBool(0.05, this.rng, GENERATION_STEPS.ORBITAL_PLANE_ALIGNEMENT);
        const orbitalPlaneNormal = isOrbitalPlaneAlignedWithParent
            ? Vector3.Up()
            : new Vector3(this.rng(GENERATION_STEPS.ORBIT + 20), this.rng(GENERATION_STEPS.ORBIT + 30), this.rng(GENERATION_STEPS.ORBIT + 40)).normalize().scaleInPlace(0.1);

        // TODO: do not hardcode
        let orbitRadius = this.rng(GENERATION_STEPS.ORBIT) * 15e9;

        const orbitalP = 2; //clamp(normalRandom(2.0, 0.3, this.rng, GENERATION_STEPS.ORBIT + 80), 0.7, 3.0);

        if (this.isSatelliteOfGas || this.isSatelliteOfTelluric) {
            const minRadius = this.parentBody?.radius ?? 0;
            orbitRadius = minRadius * clamp(normalRandom(2.0, 0.3, this.rng, GENERATION_STEPS.ORBIT), 1.2, 3.0);
            orbitRadius += this.radius * clamp(normalRandom(2, 1, this.rng, GENERATION_STEPS.ORBIT), 1, 20);
            orbitRadius += 2.0 * Math.max(0, minRadius - getPeriapsis(orbitRadius, orbitalP));
        }

        this.orbit = {
            radius: orbitRadius,
            p: orbitalP,
            period: getOrbitalPeriod(orbitRadius, this.parentBody?.physicalProperties.mass ?? 0),
            normalToPlane: orbitalPlaneNormal,
            isPlaneAlignedWithParent: isOrbitalPlaneAlignedWithParent
        };

        if (this.isSatelliteOfTelluric) {
            this.physicalProperties.pressure = Math.max(normalRandom(0.01, 0.01, this.rng, GENERATION_STEPS.PRESSURE), 0);
        }
        if (this.radius <= 0.3 * Settings.EARTH_RADIUS) this.physicalProperties.pressure = 0;

        this.physicalProperties.oceanLevel = Settings.OCEAN_DEPTH * this.physicalProperties.waterAmount * this.physicalProperties.pressure;

        this.terrainSettings = {
            continents_frequency: this.radius / Settings.EARTH_RADIUS,
            continents_fragmentation: clamp(normalRandom(0.65, 0.03, this.rng, GENERATION_STEPS.TERRAIN), 0, 0.95),

            bumps_frequency: (30 * this.radius) / Settings.EARTH_RADIUS,

            max_bump_height: 1.5e3,
            max_mountain_height: 10e3,
            continent_base_height: this.physicalProperties.oceanLevel * 1.9,

            mountains_frequency: (6 * (20 * this.radius)) / Settings.EARTH_RADIUS
        };

        if (this.isSatelliteOfTelluric) {
            this.terrainSettings.continents_fragmentation = 0;
            this.terrainSettings.max_mountain_height = 2e3;
        }

        if (uniformRandBool(0.6, this.rng, GENERATION_STEPS.RINGS) && !this.isSatelliteOfTelluric && !this.isSatelliteOfGas) {
            this.ringsUniforms = new RingsUniforms(this.rng);
        } else {
            this.ringsUniforms = null;
        }

        this.nbMoons = randRangeInt(0, 2, this.rng, GENERATION_STEPS.NB_MOONS);
    }

    getApparentRadius(): number {
        return this.radius + this.physicalProperties.oceanLevel;
    }
}
