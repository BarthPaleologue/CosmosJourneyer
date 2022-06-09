export interface IPhysicalProperties {
    mass: number;
    rotationPeriod: number;
}

export interface IStarPhysicalProperties extends IPhysicalProperties {
    temperature: number;
}

export interface IPlanetPhysicalProperties extends IPhysicalProperties {
    minTemperature: number;
    maxTemperature: number;
    pressure: number;
}

export interface ISolidPhysicalProperties extends IPlanetPhysicalProperties {
    waterAmount: number;
}