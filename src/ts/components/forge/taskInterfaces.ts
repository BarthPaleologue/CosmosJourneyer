import {SolidPlanet} from "../celestialBodies/planets/solid/solidPlanet";
import {Direction} from "../toolbox/direction";
import {Mesh, Vector3, VertexData} from "@babylonjs/core";
import {PlanetChunk} from "../celestialBodies/planets/solid/planetChunk";

export enum TaskType {
    Deletion,
    Build,
    Apply,
    Collision
}

export interface Task {
    id: string;
    taskType: TaskType;
    mesh: Mesh;
}

export interface BuildTask extends Task {
    planet: SolidPlanet,
    depth: number,
    direction: Direction,
    position: Vector3;
    chunk: PlanetChunk;
}

export interface ApplyTask extends Task {
    vertexData: VertexData;
    grassData: Float32Array;
    chunk: PlanetChunk;
    planet: SolidPlanet;
    callbackTasks: DeleteTask[];
}

export interface DeleteTask extends Task {

}

export interface ReturnedChunkData {
    p: Float32Array;
    n: Float32Array;
    i: Uint16Array;
    g: Float32Array;
}
