import { TerrainSettings } from "../terrain/terrainSettings";
import { SolidPhysicalProperties } from "../bodies/physicalProperties";

export interface BodyDescriptor {
    rng: (step: number) => number;
    seed: number
    radius: number;
}

export interface TelluricBodyDescriptor extends BodyDescriptor {
    physicalProperties: SolidPhysicalProperties;
    terrainSettings: TerrainSettings;
}