import { STELLAR_TYPE } from "../stellarObjects/common";
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
    TELLURIC_PLANET,
    GAS_PLANET,
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

export type TelluricPlanetPhysicalProperties = PlanetPhysicalProperties & {
    waterAmount: number;
    oceanLevel: number;
};

export interface OrbitalObjectModel {
    rng: (step: number) => number;
    seed: number;

    orbit: OrbitProperties;
    physicalProperties: PhysicalProperties;

    readonly parentBody: OrbitalObjectModel | null;
    readonly childrenBodies: OrbitalObjectModel[];
}

export interface HasBaseModel {
    model: OrbitalObjectModel;
}

export interface CelestialBodyModel extends OrbitalObjectModel {
    readonly bodyType: BODY_TYPE;
    readonly radius: number;
}

export interface StellarObjectModel extends CelestialBodyModel {
    stellarType: STELLAR_TYPE;
}

export interface PlanetModel extends CelestialBodyModel {
    physicalProperties: PlanetPhysicalProperties;

    nbMoons: number;

    getApparentRadius(): number;
}

export interface HasBodyModel extends HasBaseModel {
    model: CelestialBodyModel;
}

export interface HasPlanetModel extends HasBodyModel {
    model: PlanetModel;
}

export function depth(model: OrbitalObjectModel): number {
    if (model.parentBody === null) return 0;
    return depth(model.parentBody) + 1;
}
