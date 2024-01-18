import { seededSquirrelNoise } from "squirrel-noise";
import { Settings } from "../settings";
import { GENERATION_STEPS } from "../model/common";
import { OrbitProperties } from "../orbit/orbitProperties";
import { getOrbitalPeriod } from "../orbit/orbit";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { OrbitalObjectModel } from "../architecture/orbitalObject";
import { OrbitalObjectPhysicalProperties } from "../architecture/physicalProperties";

export class SpaceStationModel implements OrbitalObjectModel {
    readonly seed: number;
    readonly rng: (step: number) => number;
    readonly orbit: OrbitProperties;
    readonly physicalProperties: OrbitalObjectPhysicalProperties;
    readonly parentBody: OrbitalObjectModel | null;
    readonly childrenBodies: OrbitalObjectModel[] = [];

    constructor(seed: number, parentBody?: OrbitalObjectModel) {
        this.seed = seed;
        this.rng = seededSquirrelNoise(this.seed);

        this.parentBody = parentBody ?? null;
        this.childrenBodies = [];

        //TODO: do not hardcode
        const orbitRadius = 3 * Settings.EARTH_RADIUS;

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
