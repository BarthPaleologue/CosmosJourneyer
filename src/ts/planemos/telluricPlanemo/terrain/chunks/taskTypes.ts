import { Direction } from "../../../../utils/direction";
import { PlanetChunk } from "./planetChunk";
import { TerrainSettings } from "../terrainSettings";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";

export enum TaskType {
    Build,
    Apply,
    Collision
}

export type Task = {
    type: TaskType;
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
    instancesMatrixBuffer: Float32Array;
    alignedInstancesMatrixBuffer: Float32Array;
};

export type ReturnedChunkData = {
    positions: Float32Array;
    normals: Float32Array;
    indices: Uint16Array;
    instancesMatrixBuffer: Float32Array;
    alignedInstancesMatrixBuffer: Float32Array;
};
