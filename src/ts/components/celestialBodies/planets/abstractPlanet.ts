import {BodyPhysicalProperties, CelestialBody} from "../celestialBody";

export interface PlanetPhysicalProperties extends BodyPhysicalProperties {
    minTemperature: number;
    maxTemperature: number;
    pressure: number;
}

export abstract class AbstractPlanet extends CelestialBody {
    readonly _name: string;
    readonly _radius: number;
    protected _seed: number[];
    protected constructor(name: string, radius: number, seed = [0, 0, 0]) {
        super();
        this._name = name;
        this._radius = radius;
        this._seed = seed;
    }
    public getSeed(): number[] {
        return this._seed;
    }
    public getName(): string {
        return this._name;
    }
    public getRadius(): number {
        return this._radius;
    }
}