import { hashVec3 } from "../utils/hashVec3";
import { seededSquirrelNoise } from "squirrel-noise";
import { centeredRand } from "extended-random";
import { UniverseDensity } from "../settings";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { BoundingBox } from "@babylonjs/core/Culling/boundingBox";
import { SystemSeed } from "../utils/systemSeed";

export function Vector3ToString(v: Vector3): string {
    return `${v.x},${v.y},${v.z}`;
}

export function StringToVector3(s: string): Vector3 {
    const [x, y, z] = s.split(",").map(Number);
    return new Vector3(x, y, z);
}

export type BuildData = {
    name: string;
    seed: SystemSeed;
    sectorString: string;
    scale: number;
    position: Vector3;
};

export class StarSector {
    /**
     * The star instances of the sector
     */
    readonly starInstances: InstancedMesh[] = [];

    readonly blackHoleInstances: InstancedMesh[] = [];

    /**
     * The position of the sector relative to the center of the starmap
     */
    readonly position: Vector3;

    /**
     * The size of all sectors
     */
    static readonly SIZE = 1;

    readonly density;

    readonly nbStars: number;

    /**
     * The random number generator of the sector
     */
    readonly rng: (step: number) => number;

    constructor(positionInStarMap: Vector3) {
        this.position = positionInStarMap;
        this.rng = seededSquirrelNoise(hashVec3(positionInStarMap));

        this.density = UniverseDensity(positionInStarMap.x, positionInStarMap.y, positionInStarMap.z);

        this.nbStars = 40 * this.density * this.rng(0);
    }

    generate(): BuildData[] {
        const sectorString = this.getKey();
        const data: BuildData[] = [];
        for (let i = 0; i < this.nbStars; i++) {
            const systemSeed = new SystemSeed(this.position, i);
            data.push({
                name: `starInstance|${this.position.x}|${this.position.y}|${this.position.z}|${i}`,
                seed: systemSeed,
                sectorString: sectorString,
                scale: 0.5 + this.rng(100 * i) / 2,
                position: new Vector3(centeredRand(this.rng, 10 * i + 1) / 2, centeredRand(this.rng, 10 * i + 2) / 2, centeredRand(this.rng, 10 * i + 3) / 2).addInPlace(
                    this.position
                )
            });
        }
        return data;
    }

    /**
     * Returns a string that uniquely identifies this sector (its position relative to the global node)
     * @returns a string that uniquely identifies this sector
     */
    getKey(): string {
        return Vector3ToString(this.position);
    }

    static getBoundingBox(position: Vector3, globalNodePosition: Vector3): BoundingBox {
        return new BoundingBox(
            new Vector3(-1, -1, -1).scaleInPlace(StarSector.SIZE / 2),
            new Vector3(1, 1, 1).scaleInPlace(StarSector.SIZE / 2),
            Matrix.Translation(position.x + globalNodePosition.x, position.y + globalNodePosition.y, position.z + globalNodePosition.z)
        );
    }
}
