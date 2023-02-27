import { BoundingBox, InstancedMesh, Matrix, Vector3 } from "@babylonjs/core";
import { hashVec3 } from "../utils/hashVec3";
import { seededSquirrelNoise } from "squirrel-noise";
import { centeredRand } from "extended-random";
import { Settings } from "../settings";

export function Vector3ToString(v: Vector3): string {
    return `${v.x},${v.y},${v.z}`;
}

export function StringToVector3(s: string): Vector3 {
    const [x, y, z] = s.split(",").map(Number);
    return new Vector3(x, y, z);
}

export type BuildData = {
    name: string;
    seed: number;
    cellString: string;
    scale: number;
    position: Vector3;
};

export class Cell {
    /**
     * The meshes of the cell
     */
    readonly meshes: InstancedMesh[];

    /**
     * The position of the cell relative to the center of the starmap
     */
    readonly position: Vector3;

    /**
     * The size of all cells
     */
    static readonly SIZE = 1;

    /**
     * The random number generator of the cell
     */
    readonly rng: (step: number) => number;

    constructor(positionInStarMap: Vector3) {
        this.position = positionInStarMap;
        this.meshes = [];
        this.rng = seededSquirrelNoise(hashVec3(positionInStarMap));
    }

    generate(): BuildData[] {
        const cellString = Vector3ToString(this.position);
        const density = 10;
        const nbStars = this.rng(0) * density;
        const data = [];
        for (let i = 0; i < nbStars; i++) {
            data.push({
                name: `starInstance|${this.position.x}|${this.position.y}|${this.position.z}|${i}`,
                seed: centeredRand(this.rng, 1 + i) * Settings.SEED_HALF_RANGE,
                cellString: cellString,
                scale: 0.5 + this.rng(100 * i) / 2,
                position: new Vector3(centeredRand(this.rng, 10 * i + 1) / 2, centeredRand(this.rng, 10 * i + 2) / 2, centeredRand(this.rng, 10 * i + 3) / 2).addInPlace(
                    this.position
                )
            });
        }
        return data;
    }

    /**
     * Returns a string that uniquely identifies this cell (its position relative to the global node)
     * @returns a string that uniquely identifies this cell
     */
    getKey(): string {
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
