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
    public abstract setAbsolutePosition(newPosition: BABYLON.Vector3): void;
    public abstract getAbsolutePosition(): BABYLON.Vector3;
    public abstract getRotationQuaternion(): BABYLON.Quaternion;
    public getBodyType(): CelestialBodyType {
        return this.bodyType;
    }
    public abstract getRadius(): number;
    public abstract update(observerPosition: BABYLON.Vector3, observerDirection: BABYLON.Vector3, lightPosition: BABYLON.Vector3): void;
}