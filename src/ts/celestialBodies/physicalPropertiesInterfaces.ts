import { Vector3 } from "@babylonjs/core";

export interface BodyPhysicalProperties {
    mass: number;
    rotationPeriod: number;
    rotationAxis: Vector3;
}

export interface StarPhysicalProperties extends BodyPhysicalProperties {
    temperature: number;
}

export interface PlanetPhysicalProperties extends BodyPhysicalProperties {
    minTemperature: number;
    maxTemperature: number;
    pressure: number;
}

export interface SolidPhysicalProperties extends PlanetPhysicalProperties {
    waterAmount: number;
}
