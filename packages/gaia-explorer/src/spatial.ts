import type { StarNature } from "./classification";
import { contains, cubeIndexFor, cubeOrigin } from "./config";
import type { GridConfig } from "./config";
import type { StarRecord } from "./records";
export type CubeId = string;
export type StarOutput = Readonly<{
    name: string;
    relative_position: readonly [number, number, number];
    temperature: number | null;
    nature: StarNature | null;
}>;
export type SpatialCube = Readonly<{
    index: readonly [number, number, number];
    origin: readonly [number, number, number];
    stars: StarOutput[];
}>;
export const clamp = (value: number, lower = 0, upper = 1): number => Math.max(lower, Math.min(upper, value));
export class SpatialBinner {
    readonly #cubes = new Map<CubeId, SpatialCube>();
    private readonly config: GridConfig;
    public constructor(config: GridConfig) {
        this.config = config;
    }
    public get cubes(): ReadonlyMap<CubeId, SpatialCube> {
        return this.#cubes;
    }
    public addStar(star: StarRecord): boolean {
        if (![star.x, star.y, star.z].every((value) => contains(this.config, value))) {
            return false;
        }
        const index = [
            cubeIndexFor(this.config, star.x),
            cubeIndexFor(this.config, star.y),
            cubeIndexFor(this.config, star.z),
        ] as const;
        const id = index.join(":");
        const origin: readonly [number, number, number] = [
            cubeOrigin(this.config, index[0]),
            cubeOrigin(this.config, index[1]),
            cubeOrigin(this.config, index[2]),
        ];
        let cube = this.#cubes.get(id);
        if (cube === undefined) {
            cube = { index, origin, stars: [] };
            this.#cubes.set(id, cube);
        }
        cube.stars.push({
            name: star.name,
            relative_position: [
                clamp((star.x - origin[0]) / this.config.gridSize),
                clamp((star.y - origin[1]) / this.config.gridSize),
                clamp((star.z - origin[2]) / this.config.gridSize),
            ],
            temperature: star.temperature,
            nature: star.nature,
        });
        return true;
    }
}
