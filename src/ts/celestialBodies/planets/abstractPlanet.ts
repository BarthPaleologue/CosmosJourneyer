import {CelestialBody} from "../celestialBody";
import {PlanetPhysicalProperties, Seedable} from "../interfaces";

export abstract class AbstractPlanet extends CelestialBody implements Seedable {
    readonly _radius: number;
    protected _seed: number[];
    abstract override physicalProperties: PlanetPhysicalProperties;
    protected constructor(name: string, radius: number, seed = [0, 0, 0]) {
        super(name);
        this._radius = radius;
        this._seed = seed;
    }

    /**
     * Returns the seed of the planet
     */
    public getSeed(): number[] {
        return this._seed;
    }

    public override getRadius(): number {
        return this._radius;
    }
}