import { Vector3, Quaternion } from "@babylonjs/core";

export enum CelestialBodyType {
    STAR,
    SOLID,
    GAZ
}

export interface BodyPhysicalProperties {

}

export abstract class CelestialBody {
    protected abstract bodyType: CelestialBodyType;
    protected constructor() {
        //TODO: réunir les attributs fondamentaux de tous les celestialBodies
    }
    public abstract getName(): string;
    public abstract setAbsolutePosition(newPosition: Vector3): void;
    public abstract getAbsolutePosition(): Vector3;
    public abstract getRotationQuaternion(): Quaternion;
    public getBodyType(): CelestialBodyType {
        return this.bodyType;
    }
    public abstract getRadius(): number;
    public abstract update(observerPosition: Vector3, observerDirection: Vector3, lightPosition: Vector3): void;
}