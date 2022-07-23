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

export type Task = {
    type: TaskType;
    isFiner: boolean;
    chunk: PlanetChunk;
};

export type BuildTask = Task & {
    planet: TelluricPlanet;
    depth: number;
    direction: Direction;
    position: Vector3;
};

export type ApplyTask = Task & {
    vertexData: VertexData;
    planet: TelluricPlanet;
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
