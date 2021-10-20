import { Crater } from "../terrain/crater/crater";
import { TerrainSettings } from "../terrain/terrainSettings";
import { Direction } from "../toolbox/direction";

export interface buildData {
    chunkLength: number;
    subdivisions: number;
    depth: number;
    direction: Direction;
    position: number[];
    craters: Crater[];
    terrainSettings: TerrainSettings;
}