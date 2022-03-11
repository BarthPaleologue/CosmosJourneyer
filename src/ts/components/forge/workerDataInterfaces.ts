import {Direction} from "../toolbox/direction";
import {Crater} from "../terrain/crater/crater";
import {TerrainSettings} from "../terrain/terrainSettings";
import {TaskType} from "./taskInterfaces";

export interface WorkerData {
    taskType: TaskType;
    planetID: string;
    chunkLength: number;
    terrainSettings: TerrainSettings;
    craters: Crater[];
    position: number[];
}

export interface BuildData extends WorkerData {
    subdivisions: number;
    depth: number;
    direction: Direction;
    seed: number[];
}

export interface CollisionData extends WorkerData {

}