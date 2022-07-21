export type PhysicalProperties = {
    mass: number;
    rotationPeriod: number;
}

export type StarPhysicalProperties = PhysicalProperties & {
    temperature: number;
}

export type PlanetPhysicalProperties = PhysicalProperties & {
    minTemperature: number;
    maxTemperature: number;
    pressure: number;
}

export type SolidPhysicalProperties = PlanetPhysicalProperties & {
    waterAmount: number;
}
