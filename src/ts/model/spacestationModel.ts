import { seededSquirrelNoise } from "squirrel-noise";
import { BaseModel, GENERATION_STEPS, PhysicalProperties } from "./common";
import { OrbitalProperties, getOrbitalPeriod } from "./orbit";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export class SpaceStationModel implements BaseModel {
    readonly seed: number;
    readonly rng: (step: number) => number;
    readonly orbit: OrbitalProperties;
    readonly physicalProperties: PhysicalProperties;
    readonly parentBody: BaseModel | null;
    readonly childrenBodies: BaseModel[] = [];

    constructor(seed: number, parentBody?: BaseModel) {
        this.seed = seed;
        this.rng = seededSquirrelNoise(this.seed);

        this.parentBody = parentBody ?? null;
        this.childrenBodies = [];

        //TODO: do not hardcode
        const orbitRadius = 3000e3;

        this.orbit = {
            radius: orbitRadius,
            p: 2,
            period: getOrbitalPeriod(orbitRadius, this.parentBody?.physicalProperties.mass ?? 0),
            normalToPlane: Vector3.Up(),
            isPlaneAlignedWithParent: false
        };

        this.physicalProperties = {
            mass: 1,
            rotationPeriod: 60 * 2,
            axialTilt: 2 * this.rng(GENERATION_STEPS.AXIAL_TILT) * Math.PI
        };
    }
}
