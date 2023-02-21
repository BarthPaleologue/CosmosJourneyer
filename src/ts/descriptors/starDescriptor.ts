import { seededSquirrelNoise } from "squirrel-noise";
import { clamp } from "terrain-generation";
import { normalRandom, randRange, uniformRandBool } from "extended-random";
import { Quaternion, Vector3 } from "@babylonjs/core";
import { getRgbFromTemperature } from "../utils/specrend";
import { Settings } from "../settings";
import { BodyDescriptor } from "./interfaces";
import { IOrbitalProperties } from "../orbits/iOrbitalProperties";
import { getOrbitalPeriod } from "../orbits/kepler";
import { StarPhysicalProperties } from "../bodies/physicalProperties";
import { BodyType } from "../bodies/interfaces";

enum GENERATION_STEPS {
    NAME,
    ORBIT = 200,
    TEMPERATURE = 1100,
    RADIUS = 1000,
    RINGS = 1200
}

export enum STAR_TYPE {
    O,
    B,
    A,
    F,
    G,
    K,
    M
}

export class StarDescriptor implements BodyDescriptor {
    readonly bodyType = BodyType.STAR;
    readonly rng: (step: number) => number;
    readonly seed: number;

    readonly name: string;

    readonly surfaceTemperature: number;
    readonly surfaceColor: Vector3;
    private readonly type: STAR_TYPE;
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
        console.assert(-1 <= seed && seed <= 1, "seed must be in [-1, 1]");

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

        if (this.surfaceTemperature < 3500) this.type = STAR_TYPE.M;
        else if (this.surfaceTemperature < 5000) this.type = STAR_TYPE.K;
        else if (this.surfaceTemperature < 6000) this.type = STAR_TYPE.G;
        else if (this.surfaceTemperature < 7500) this.type = STAR_TYPE.F;
        else if (this.surfaceTemperature < 10000) this.type = STAR_TYPE.A;
        else if (this.surfaceTemperature < 30000) this.type = STAR_TYPE.B;
        else this.type = STAR_TYPE.O;

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

    getStellarType(): string {
        switch (this.type) {
            case STAR_TYPE.O:
                return "O";
            case STAR_TYPE.B:
                return "B";
            case STAR_TYPE.A:
                return "A";
            case STAR_TYPE.F:
                return "F";
            case STAR_TYPE.G:
                return "G";
            case STAR_TYPE.K:
                return "K";
            case STAR_TYPE.M:
                return "M";
        }
    }
}
