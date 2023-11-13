import { STELLAR_TYPE } from "../stellarObjects/common";
import { RingsUniforms } from "../postProcesses/rings/ringsUniform";
import { OrbitProperties } from "../orbit/orbitProperties";

export enum GENERATION_STEPS {
    AXIAL_TILT = 100,
    ORBIT = 200,
    ORBITAL_PERIOD = 500,
    RADIUS = 1000,
    ORBITAL_PLANE_ALIGNEMENT = 1600,

    RINGS = 1200,

    NB_MOONS = 10,
    MOONS = 11,

    POWER = 300,
    ACCENNT_COLOR = 400,

    TEMPERATURE = 1100,

    PRESSURE = 1100,
    WATER_AMOUNT = 1200,
    TERRAIN = 1500
}

export enum BODY_TYPE {
    STAR,
    TELLURIC,
    GAS,
    MANDELBULB,
    BLACK_HOLE
}

export type PhysicalProperties = {
    mass: number;
    rotationPeriod: number;
    axialTilt: number;
};

export type StarPhysicalProperties = PhysicalProperties & {
    temperature: number;
};

export type BlackHolePhysicalProperties = PhysicalProperties & {
    accretionDiskRadius: number;
};

export type PlanetPhysicalProperties = PhysicalProperties & {
    minTemperature: number;
    maxTemperature: number;
    pressure: number;
};

export type SolidPhysicalProperties = PlanetPhysicalProperties & {
    waterAmount: number;
    oceanLevel: number;
};

export interface BaseModel {
    rng: (step: number) => number;
    seed: number;

    orbit: OrbitProperties;
    physicalProperties: PhysicalProperties;

    readonly parentBody: BaseModel | null;
    readonly childrenBodies: BaseModel[];
}

export interface BodyModel extends BaseModel {
    readonly bodyType: BODY_TYPE;
    readonly radius: number;

    readonly ringsUniforms: RingsUniforms | null;
}

export interface StellarObjectModel extends BodyModel {
    stellarType: STELLAR_TYPE;
}

//https://en.wiktionary.org/wiki/planemo#English
export interface PlanemoModel extends BodyModel {
    physicalProperties: PlanetPhysicalProperties;

    nbMoons: number;

    getApparentRadius(): number;
}

export function depth(model: BaseModel): number {
    if (model.parentBody === null) return 0;
    return depth(model.parentBody) + 1;
}
