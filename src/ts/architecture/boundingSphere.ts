/**
 * Describes all object that have a physical extent: they can be enclosed in a sphere of a certain radius
 */
export interface BoundingSphere {
    /**
     * Returns the radius describing the max extent of the object from its center
     */
    getBoundingRadius(): number;
}
