import { Vector3 } from "@babylonjs/core/Maths/math";

interface OrbitProps {
    radius: number;
    p: number;
    period: number;
    normalToPlane: Vector3;
    isPlaneAlignedWithParent: boolean;
}

export class OrbitProperties {
    radius: number;

    readonly p: number;

    /**
     * The duration it takes for the body to make one orbit
     */
    period: number;

    /**
     * The orientation of the orbit (inclination + precession)
     */
    normalToPlane: Vector3;

    /**
     * Whether the orbital plane is aligned with the parent body or not (allows to see rings from satellites when false)
     */
    readonly isPlaneAlignedWithParent: boolean;

    constructor({radius, p, period, normalToPlane, isPlaneAlignedWithParent}: OrbitProps) {
        this.radius = radius;
        this.p = p;
        this.period = period;
        this.normalToPlane = normalToPlane;
        this.isPlaneAlignedWithParent = isPlaneAlignedWithParent;
    }
};