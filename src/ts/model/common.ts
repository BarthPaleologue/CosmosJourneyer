import { IOrbitalProperties } from "./orbits/iOrbitalProperties";
import { STELLAR_TYPE } from "./stellarObjects/common";

export enum BODY_TYPE {
    STAR,
    TELLURIC,
    GAS,
    FRACTAL,
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

    orbitalProperties: IOrbitalProperties;
    physicalProperties: PhysicalProperties;

    readonly parentBodies: BaseModel[];
    readonly childrenBodies: BaseModel[];

    get depth(): number;
}

export interface BodyModel extends BaseModel {
    bodyType: BODY_TYPE;
    radius: number;
}

export interface StellarObjectModel extends BodyModel {
    stellarType: STELLAR_TYPE;
}

//https://en.wiktionary.org/wiki/planemo#English
export interface PlanemoModel extends BodyModel {
    physicalProperties: PlanetPhysicalProperties;

    getApparentRadius(): number;

    getMoonSeed(index: number): number;
}
