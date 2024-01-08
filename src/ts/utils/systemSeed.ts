import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { seededSquirrelNoise } from "squirrel-noise";
import { hashVec3 } from "./hashVec3";
import { centeredRand } from "extended-random";
import { Settings } from "../settings";

export class SystemSeed {
    readonly starMapCellPosition: Vector3;
    readonly index: number;

    readonly hash: number;

    constructor(starMapCellPosition: Vector3, index: number) {
        this.starMapCellPosition = starMapCellPosition;
        this.index = index;

        if(!Number.isSafeInteger(this.starMapCellPosition.x)) throw new Error("x position of cell in starmap is not a safe integer");
        if(!Number.isSafeInteger(this.starMapCellPosition.y)) throw new Error("y position of cell in starmap is not a safe integer");
        if(!Number.isSafeInteger(this.starMapCellPosition.z)) throw new Error("z position of cell in starmap is not a safe integer");

        const cellRNG = seededSquirrelNoise(hashVec3(starMapCellPosition));
        this.hash = centeredRand(cellRNG, 1 + index) * Settings.SEED_HALF_RANGE;
    }

    toString(): string {
        return `${this.starMapCellPosition.x},${this.starMapCellPosition.y},${this.starMapCellPosition.z},${this.index}`;
    }
}