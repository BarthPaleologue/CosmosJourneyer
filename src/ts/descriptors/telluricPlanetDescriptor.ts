import { seededSquirrelNoise } from "squirrel-noise";
import { normalRandom, randRangeInt, uniformRandBool } from "extended-random";
import { Settings } from "../settings";
import { TelluricBodyDescriptor } from "./interfaces";
import { TerrainSettings } from "../terrain/terrainSettings";
import { clamp } from "terrain-generation";
import { SolidPhysicalProperties } from "../bodies/physicalProperties";

enum GENERATION_STEPS {
    RADIUS = 1000,
    PRESSURE = 1100,
    WATER_AMOUNT = 1200,
    RINGS = 1400,
    TERRAIN = 1500,
    NB_MOONS = 10,
    MOONS = 11,
}

export class TelluricPlanetDescriptor implements TelluricBodyDescriptor {
    readonly seed: number;
    readonly rng: (step: number) => number;

    readonly radius: number;

    readonly physicalProperties: SolidPhysicalProperties;

    readonly terrainSettings: TerrainSettings;

    readonly hasRings: boolean;

    readonly nbMoons: number;

    constructor(seed: number) {
        this.seed = seed;
        this.rng = seededSquirrelNoise(this.seed);

        this.radius = Math.max(0.3, normalRandom(1.0, 0.1, this.rng, GENERATION_STEPS.RADIUS)) * Settings.EARTH_RADIUS;

        this.physicalProperties = {
            mass: 10,
            rotationPeriod: 60 * 60 * 24 / 10,
            minTemperature: randRangeInt(-50, 5, this.rng, 80),
            maxTemperature: randRangeInt(10, 50, this.rng, 81),
            pressure: Math.max(normalRandom(0.9, 0.2, this.rng, GENERATION_STEPS.PRESSURE), 0),
            waterAmount: Math.max(normalRandom(1.0, 0.3, this.rng, GENERATION_STEPS.WATER_AMOUNT), 0),
            oceanLevel: 0
        }

        this.terrainSettings = {
            continents_frequency: this.radius / Settings.EARTH_RADIUS,
            continents_fragmentation: clamp(normalRandom(0.45, 0.03, this.rng, GENERATION_STEPS.TERRAIN), 0, 0.95),

            bumps_frequency: 30 * this.radius / Settings.EARTH_RADIUS,

            max_bump_height: 1.5e3,
            max_mountain_height: 15e3,
            continent_base_height: this.physicalProperties.oceanLevel * 2.5,

            mountains_frequency: 20 * this.radius / Settings.EARTH_RADIUS,
        };

        this.hasRings = uniformRandBool(0.6, this.rng, GENERATION_STEPS.RINGS);

        this.nbMoons = randRangeInt(0, 2, this.rng, GENERATION_STEPS.NB_MOONS);
    }

    getMoonSeed(index: number) {
        if(index > this.nbMoons) throw new Error("Moon out of bound! " + index);
        return this.rng(GENERATION_STEPS.MOONS + index);
    }
}