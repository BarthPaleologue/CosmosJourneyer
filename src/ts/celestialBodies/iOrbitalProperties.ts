export interface IOrbitalProperties {
    /**
     * The lowest distance to the barycenter of the orbit
     */
    periapsis: number;

    /**
     * The highest distance to the barycenter of the orbit
     */
    apoapsis: number;

    /**
     * The duration it takes for the body to make one orbit
     */
    period: number;
}
