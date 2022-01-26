export interface PhysicalProperties {
    minTemperature: number;
    maxTemperature: number;
    pressure: number;
}

export abstract class Planet {
    readonly _name: string;
    readonly _radius: number;
    readonly _seed: number[];
    constructor(name: string, radius: number, seed = [0, 0, 0]) {
        this._name = name;
        this._radius = radius;
        this._seed = seed;
    }
}