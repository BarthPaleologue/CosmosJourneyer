import {Quaternion, Vector3} from "@babylonjs/core";
import {CollisionData} from "../forge/workerDataInterfaces";

export enum CelestialBodyType {
    STAR,
    SOLID,
    GAZ
}

/**
 * Describes objects that have a position in space and a rotation quaternion
 */
export interface Transformable {
    /**
     * Sets the new position relative to the origin of the universe
     * @param newPosition The new relative position to the origin of the universe to set
     */
    setAbsolutePosition(newPosition: Vector3): void;

    /**
     * Returns the position of the object relative to the origin of the universe
     */
    getAbsolutePosition(): Vector3;

    /**
     * Returns the quaternion describing the rotation of the object
     */
    getRotationQuaternion(): Quaternion;

    /**
     * Returns the position of the origin relative to the celestial body, with negation of its rotation (useful to retrieve a sample point on a sphere)
     */
    getOriginBodySpaceSamplePosition(): Vector3;
}

export interface Seedable {

}

/**
 * Describes object that can be collided with
 */
export interface RigidBody {
    generateCollisionTask(relativePosition: Vector3): CollisionData;
}

export interface BodyPhysicalProperties {

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
