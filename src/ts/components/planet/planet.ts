export interface PhysicalProperties {
    minTemperature: number;
    maxTemperature: number;
    pressure: number;
}

export abstract class Planet {
    readonly _name: string;
    readonly _radius: number;
    readonly _physicalProperties: PhysicalProperties;
    constructor(name: string, radius: number, physicalProperties: PhysicalProperties) {
        this._name = name;
        this._radius = radius;
        this._physicalProperties = physicalProperties;
    }
}