import { IOrbitalProperties } from "../orbits/iOrbitalProperties";
import { STELLAR_TYPE } from "./stellarObjects/common";

export enum BODY_TYPE {
    STAR,
    TELLURIC,
    GAS,
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

export type PlanetPhysicalProperties = PhysicalProperties & {
    minTemperature: number;
    maxTemperature: number;
    pressure: number;
};

export type SolidPhysicalProperties = PlanetPhysicalProperties & {
    waterAmount: number;
    oceanLevel: number;
};

export interface BodyDescriptor {
    bodyType: BODY_TYPE;
    rng: (step: number) => number;
    seed: number;
    radius: number;

    orbitalProperties: IOrbitalProperties;

    physicalProperties: PhysicalProperties;

    readonly parentBodies: BodyDescriptor[];
    readonly childrenBodies: BodyDescriptor[];

    get depth(): number;
}

export interface StellarObjectDescriptor extends BodyDescriptor {
    stellarType: STELLAR_TYPE;
}

//https://en.wiktionary.org/wiki/planemo#English
export interface PlanemoDescriptor extends BodyDescriptor {
    physicalProperties: PlanetPhysicalProperties;

    getApparentRadius(): number;

    getMoonSeed(index: number): number;
}