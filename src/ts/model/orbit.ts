import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";

/**
 *
 * @param settings
 * @param t
 * @returns
 * @see https://medium.com/@barth_29567/crazy-orbits-lets-make-squares-c91a427c6b26
 */
export function getPointOnOrbitLocal(settings: OrbitalProperties, t: number): Vector3 {
    const theta = -(2 * Math.PI * t) / settings.period;
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    const LpFactor = computeLpFactor(theta, settings.p);

    const relativePosition = new Vector3(cosTheta, 0, sinTheta).scaleInPlace(settings.radius * LpFactor);

    // rotate orbital plane
    const rotationAxis = Vector3.Cross(Vector3.Up(), settings.normalToPlane).normalize();
    const angle = Vector3.GetAngleBetweenVectors(Vector3.Up(), settings.normalToPlane, rotationAxis);
    const rotationMatrix = Matrix.RotationAxis(rotationAxis, angle);

    return Vector3.TransformCoordinates(relativePosition, rotationMatrix);
}

/**
 * Returns the point on the orbit of the body at time t. The orbit are circular for the p-norm.
 * @param centerOfMass
 * @param settings
 * @param t
 * @returns
 */
export function getPointOnOrbit(centerOfMass: Vector3, settings: OrbitalProperties, t: number): Vector3 {
    return getPointOnOrbitLocal(settings, t).addInPlace(centerOfMass);
}

export function computeLpFactor(theta: number, p: number) {
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);
    return 1 / (Math.abs(cosTheta) ** p + Math.abs(sinTheta) ** p) ** (1 / p);
}

export function getPeriapsis(radius: number, p: number) {
    return radius * computeLpFactor(Math.PI / 4, p);
}

/**
 *
 * @param periapsis
 * @param apoapsis
 * @param otherBodies
 * @see https://www.wikiwand.com/fr/Lois_de_Kepler#/Troisi%C3%A8me_loi_%E2%80%93_Loi_des_p%C3%A9riodes
 */
export function getOrbitalPeriod(radius: number, parentMass: number) {
    if (parentMass === 0) return 0;
    const a = radius;
    const G = 1e12;
    const M = parentMass;
    return Math.sqrt((4 * Math.PI ** 2 * a ** 3) / (G * M));
}

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
};
