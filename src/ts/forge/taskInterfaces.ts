import {SolidPlanet} from "../celestialBodies/planets/solidPlanet";
import {Direction} from "../utils/direction";
import {Mesh, Vector3, VertexData} from "@babylonjs/core";
import {PlanetChunk} from "./planetChunk";

export enum TaskType {
    Deletion,
    Build,
    Apply,
    Collision
}

export interface Task {
    taskType: TaskType;
    isFiner: boolean
    chunk: PlanetChunk;
}

export interface BuildTask extends Task {
    planet: SolidPlanet,
    depth: number,
    direction: Direction,
    position: Vector3;
}

export interface ApplyTask extends Task {
    vertexData: VertexData;
    grassData: Float32Array;
    planet: SolidPlanet;
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
