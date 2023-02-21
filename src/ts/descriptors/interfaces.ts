import { TerrainSettings } from "../terrain/terrainSettings";
import { PhysicalProperties, PlanetPhysicalProperties, SolidPhysicalProperties } from "../bodies/physicalProperties";
import { IOrbitalProperties } from "../orbits/iOrbitalProperties";
import { BodyType } from "../bodies/interfaces";

export interface BodyDescriptor {
    bodyType: BodyType;
    rng: (step: number) => number;
    seed: number;
    radius: number;

    orbitalProperties: IOrbitalProperties;

    physicalProperties: PhysicalProperties;

    readonly parentBodies: BodyDescriptor[];
    readonly childrenBodies: BodyDescriptor[];

    get depth(): number;
}

//https://en.wiktionary.org/wiki/planemo#English
export interface PlanemoDescriptor extends BodyDescriptor {
    physicalProperties: PlanetPhysicalProperties;

    getApparentRadius(): number;
}

export interface TelluricBodyDescriptor extends PlanemoDescriptor {
    physicalProperties: SolidPhysicalProperties;
    terrainSettings: TerrainSettings;
}
