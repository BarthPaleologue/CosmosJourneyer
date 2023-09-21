import { Vector3 } from "@babylonjs/core/Maths/math.vector";


export type OrbitalProperties = {
    radius: number;

    p: number;

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
    isPlaneAlignedWithParent: boolean;
}
