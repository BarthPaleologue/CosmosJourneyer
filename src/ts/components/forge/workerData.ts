import {Direction} from "../toolbox/direction";
import {Crater} from "../terrain/crater/crater";
import {TerrainSettings} from "../terrain/terrainSettings";

export interface buildData {
    taskType: string;
    planetID: string;
    chunkLength: number;
    subdivisions: number;
    depth: number;
    direction: Direction;
    position: number[];
    craters: Crater[];
    terrainSettings: TerrainSettings;
    seed: number[];
}

export interface CollisionData {
    taskType: string;
    planetID: string;
    chunkLength: number;
    position: number[];
    craters: Crater[];
    terrainSettings: TerrainSettings;
}