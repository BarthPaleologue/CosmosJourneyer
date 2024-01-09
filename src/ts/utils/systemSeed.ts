import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { seededSquirrelNoise } from "squirrel-noise";
import { hashVec3 } from "./hashVec3";
import { centeredRand } from "extended-random";
import { Settings } from "../settings";

export class SystemSeed {
    readonly starSectorCoordinates: Vector3;
    readonly index: number;

    readonly hash: number;

    constructor(starSectorCoordinates: Vector3, index: number) {
        this.starSectorCoordinates = starSectorCoordinates;
        this.index = index;

        if (!Number.isSafeInteger(this.starSectorCoordinates.x)) throw new Error("x coordinate of star sector is not a safe integer");
        if (!Number.isSafeInteger(this.starSectorCoordinates.y)) throw new Error("y coordinate of star sector is not a safe integer");
        if (!Number.isSafeInteger(this.starSectorCoordinates.z)) throw new Error("z coordinate of star sector is not a safe integer");

        const cellRNG = seededSquirrelNoise(hashVec3(starSectorCoordinates));
        this.hash = centeredRand(cellRNG, 1 + index) * Settings.SEED_HALF_RANGE;
    }

    toString(): string {
        return `${this.starSectorCoordinates.x},${this.starSectorCoordinates.y},${this.starSectorCoordinates.z},${this.index}`;
    }
}
