export interface PhysicalProperties {
    minTemperature: number;
    maxTemperature: number;
    pressure: number;
}

export abstract class Planet {
    readonly _name: string;
    readonly _radius: number;
    constructor(name: string, radius: number) {
        this._name = name;
        this._radius = radius;
    }
}