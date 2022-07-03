import { TelluricPlanet } from "../bodies/planets/telluricPlanet";
import { Direction } from "../utils/direction";
import { Vector3, VertexData } from "@babylonjs/core";
import { PlanetChunk } from "./planetChunk";

export enum TaskType {
    Deletion,
    Build,
    Apply,
    Collision
}

export interface Task {
    type: TaskType;
    isFiner: boolean;
    chunk: PlanetChunk;
}

export interface BuildTask extends Task {
    planet: TelluricPlanet;
    depth: number;
    direction: Direction;
    position: Vector3;
}

export interface ApplyTask extends Task {
    vertexData: VertexData;
    planet: TelluricPlanet;
    callbackTasks: DeleteTask[];
}

export interface DeleteTask extends Task {
    newChunks: PlanetChunk[];
}

export interface ReturnedChunkData {
    p: Float32Array;
    n: Float32Array;
    i: Uint16Array;
    g: Float32Array;
}
