import { seededSquirrelNoise } from "squirrel-noise";
import { BaseDescriptor, PhysicalProperties } from "./common";
import { IOrbitalProperties } from "../orbits/iOrbitalProperties";
import { getOrbitalPeriod } from "../orbits/kepler";
import { Quaternion } from "@babylonjs/core/Maths/math.vector";

enum GENERATION_STEPS {
    AXIAL_TILT = 100,
    ORBIT = 200,
    RADIUS = 1000
}

export class SpaceStationDescriptor implements BaseDescriptor {
    readonly seed: number;
    readonly rng: (step: number) => number;
    readonly orbitalProperties: IOrbitalProperties;
    readonly physicalProperties: PhysicalProperties;
    readonly parentBodies: BaseDescriptor[] = [];
    readonly childrenBodies: BaseDescriptor[] = [];

    constructor(seed: number, parentBodies: BaseDescriptor[]) {
        this.seed = seed;
        this.rng = seededSquirrelNoise(this.seed);

        this.parentBodies = parentBodies;
        this.childrenBodies = [];

        //TODO: do not hardcode
        const periapsis = 3000e3;
        const apoapsis = 3000e3;

        this.orbitalProperties = {
            periapsis: periapsis,
            apoapsis: apoapsis,
            period: getOrbitalPeriod(periapsis, apoapsis, this.parentBodies),
            orientationQuaternion: Quaternion.Identity(),
            isPlaneAlignedWithParent: false
        };

        this.physicalProperties = {
            mass: 1,
            rotationPeriod: 60 * 2,
            axialTilt: 2 * this.rng(GENERATION_STEPS.AXIAL_TILT) * Math.PI
        };
    }

    get depth(): number {
        if (this.parentBodies.length === 0) return 0;
        return this.parentBodies[0].depth + 1;
    }
}
