import { SystemSeedSerialized } from "../utils/systemSeed";

export const enum SystemObjectType {
    STELLAR_OBJECT,
    PLANETARY_MASS_OBJECT,
    ANOMALY,
    SPACE_STATION
}

/**
 * Data structure that can identify any object within a star system.
 */
export type SystemObjectId = {
    /**
     * The type of the object.
     */
    objectType: SystemObjectType;

    /**
     * The index of the object inside the array containing all objects of the given type within the star system.
     */
    index: number;
};

/**
 * Data structure that can identify any object within the universe.
 */
export type UniverseObjectId = SystemObjectId & {
    /**
     * The seed of the star system.
     */
    starSystem: SystemSeedSerialized;
};

export type UniverseCoordinates = {
    /**
     * The coordinates of the body in the universe.
     */
    universeObjectId: UniverseObjectId;

    /**
     * The x coordinate of the player's position in the nearest orbital object's frame of reference.
     */
    positionX: number;

    /**
     * The y coordinate of the player's position in the nearest orbital object's frame of reference.
     */
    positionY: number;

    /**
     * The z coordinate of the player's position in the nearest orbital object's frame of reference.
     */
    positionZ: number;

    /**
     * The x component of the player's rotation quaternion in the nearest orbital object's frame of reference.
     */
    rotationQuaternionX: number;

    /**
     * The y component of the player's rotation quaternion in the nearest orbital object's frame of reference.
     */
    rotationQuaternionY: number;

    /**
     * The z component of the player's rotation quaternion in the nearest orbital object's frame of reference.
     */
    rotationQuaternionZ: number;

    /**
     * The w component of the player's rotation quaternion in the nearest orbital object's frame of reference.
     */
    rotationQuaternionW: number;
};