import { Direction } from "../utils/direction";
import { TerrainSettings } from "../terrain/terrainSettings";
import { TaskType } from "./taskTypes";

export type WorkerData = {
    taskType: TaskType;
    planetName: string;
    planetDiameter: number;
    terrainSettings: TerrainSettings;
    position: number[];
    seed: number;
};

export type TransferBuildData = WorkerData & {
    nbVerticesPerSide: number;
    depth: number;
    direction: Direction;
};

export type TransferCollisionData = WorkerData;
