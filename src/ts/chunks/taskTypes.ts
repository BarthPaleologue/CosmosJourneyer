import { Direction } from "../utils/direction";
import { Vector3, VertexData } from "@babylonjs/core";
import { PlanetChunk } from "./planetChunk";
import { TerrainSettings } from "../terrain/terrainSettings";

export enum TaskType {
    Deletion,
    Build,
    Apply,
    Collision
}

export type Task = {
    type: TaskType;
    isFiner: boolean;
    chunk: PlanetChunk;
};

export type BuildTask = Task & {
    planetName: string;
    planetSeed: number;
    planetDiameter: number;
    terrainSettings: TerrainSettings;
    depth: number;
    direction: Direction;
    position: Vector3;
};

export type ApplyTask = Task & {
    vertexData: VertexData;
    callbackTasks: DeleteTask[];
};

export type DeleteTask = Task & {
    newChunks: PlanetChunk[];
};

export type ReturnedChunkData = {
    p: Float32Array;
    n: Float32Array;
    i: Uint16Array;
    g: Float32Array;
};
