import { BoundingBox, InstancedMesh, Matrix, Vector3 } from "@babylonjs/core";
import { hashVec3 } from "../utils/hashVec3";
import { seededSquirrelNoise } from "squirrel-noise";
import { centeredRand } from "extended-random";

export function Vector3ToString(v: Vector3): string {
    return `${v.x},${v.y},${v.z}`;
}

export type BuildData = {
    name: string;
    cellString: string;
    scale: number;
    position: Vector3;
}

export class Cell {
    readonly meshes: InstancedMesh[];
    readonly position: Vector3;
    static readonly SIZE = 1;

    constructor(position: Vector3) {
        this.position = position;
        this.meshes = [];
    }

    generate(): BuildData[] {
        const cellString = Vector3ToString(this.position);
        const seed = hashVec3(this.position);
        const rng = seededSquirrelNoise(seed);
        const density = 10;
        const nbStars = rng(0) * density;
        const data = [];
        for (let i = 0; i < nbStars; i++) {
            data.push({
                name: `starInstance|${this.position.x}|${this.position.y}|${this.position.z}|${i}`,
                cellString: cellString,
                scale: 0.5 + rng(100 * i) / 2,
                position: new Vector3(centeredRand(rng, 10 * i + 1) / 2, centeredRand(rng, 10 * i + 2) / 2, centeredRand(rng, 10 * i + 3) / 2).addInPlace(this.position)
            });
        }
        return data;
    }

    uniqueString() {
        return Vector3ToString(this.position);
    }

    static getBoundingBox(position: Vector3, globalNodePosition: Vector3): BoundingBox {
        return new BoundingBox(
            new Vector3(-1, -1, -1).scaleInPlace(Cell.SIZE / 2),
            new Vector3(1, 1, 1).scaleInPlace(Cell.SIZE / 2),
            Matrix.Translation(position.x + globalNodePosition.x, position.y + globalNodePosition.y, position.z + globalNodePosition.z)
        );
    }
}

export function StringToVector3(s: string): Vector3 {
    const [x, y, z] = s.split(",").map(Number);
    return new Vector3(x, y, z);
}