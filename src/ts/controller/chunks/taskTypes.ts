import { Direction } from "../../utils/direction";
import { PlanetChunk } from "./planetChunk";
import { TerrainSettings } from "../../model/terrain/terrainSettings";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";

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
