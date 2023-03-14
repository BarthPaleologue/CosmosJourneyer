import { seededSquirrelNoise } from "squirrel-noise";
import { clamp } from "terrain-generation";
import { normalRandom, randRange, uniformRandBool } from "extended-random";
import { Quaternion, Vector3 } from "@babylonjs/core";
import { getRgbFromTemperature } from "../../utils/specrend";
import { Settings } from "../../settings";
import { BodyDescriptor, BODY_TYPE, StellarObjectDescriptor } from "../common";
import { IOrbitalProperties } from "../../orbits/iOrbitalProperties";
import { getOrbitalPeriod } from "../../orbits/kepler";
import { StarPhysicalProperties } from "../common";
import { STELLAR_TYPE } from "./common";

enum GENERATION_STEPS {
    NAME,
    ORBIT = 200,
    TEMPERATURE = 1100,
    RADIUS = 1000,
    RINGS = 1200
}

export class StarDescriptor implements StellarObjectDescriptor {
    readonly bodyType = BODY_TYPE.STAR;
    readonly rng: (step: number) => number;
    readonly seed: number;

    readonly name: string;

    readonly surfaceTemperature: number;
    readonly surfaceColor: Vector3;
    readonly stellarType: STELLAR_TYPE;
    readonly radius: number;

    readonly mass = 1000;
    readonly rotationPeriod = 24 * 60 * 60;

    readonly orbitalProperties: IOrbitalProperties;

    readonly physicalProperties: StarPhysicalProperties;

    static RING_PROPORTION = 0.2;
    readonly hasRings: boolean;

    readonly parentBodies: BodyDescriptor[];

    readonly childrenBodies: BodyDescriptor[] = [];

    constructor(seed: number, parentBodies: BodyDescriptor[]) {
        this.seed = seed;
        this.rng = seededSquirrelNoise(this.seed);

        this.name = "Star";
        this.surfaceTemperature = clamp(normalRandom(5778, 2000, this.rng, GENERATION_STEPS.TEMPERATURE), 3000, 10000);

        this.parentBodies = parentBodies;

        this.physicalProperties = {
            mass: this.mass,
            rotationPeriod: this.rotationPeriod,
            temperature: this.surfaceTemperature,
            axialTilt: 0
        };

        this.surfaceColor = getRgbFromTemperature(this.surfaceTemperature);

        if (this.surfaceTemperature < 3500) this.stellarType = STELLAR_TYPE.M;
        else if (this.surfaceTemperature < 5000) this.stellarType = STELLAR_TYPE.K;
        else if (this.surfaceTemperature < 6000) this.stellarType = STELLAR_TYPE.G;
        else if (this.surfaceTemperature < 7500) this.stellarType = STELLAR_TYPE.F;
        else if (this.surfaceTemperature < 10000) this.stellarType = STELLAR_TYPE.A;
        else if (this.surfaceTemperature < 30000) this.stellarType = STELLAR_TYPE.B;
        else this.stellarType = STELLAR_TYPE.O;

        //TODO: make it dependent on star type
        this.radius = randRange(50, 200, this.rng, GENERATION_STEPS.RADIUS) * Settings.EARTH_RADIUS;

        // TODO: do not hardcode
        const periapsis = this.rng(GENERATION_STEPS.ORBIT) * 5000000e3;
        const apoapsis = periapsis * (1 + this.rng(GENERATION_STEPS.ORBIT + 10) / 10);

        this.orbitalProperties = {
            periapsis: periapsis,
            apoapsis: apoapsis,
            period: getOrbitalPeriod(periapsis, apoapsis, []),
            orientationQuaternion: Quaternion.Identity()
        };

        this.hasRings = uniformRandBool(StarDescriptor.RING_PROPORTION, this.rng, GENERATION_STEPS.RINGS);
    }

    get depth(): number {
        if (this.parentBodies.length === 0) return 0;
        return this.parentBodies[0].depth + 1;
    }
}
