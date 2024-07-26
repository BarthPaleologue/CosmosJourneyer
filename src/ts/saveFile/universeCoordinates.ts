import { SystemSeedSerialized } from "../utils/systemSeed";

export type UniverseObjectIdentifier = {
    /**
     * The seed of the star system.
     */
    starSystem: SystemSeedSerialized;

    /**
     * The index of the orbital object.
     */
    orbitalObjectIndex: number;
};

export type UniverseCoordinates = UniverseObjectIdentifier & {
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

/**
 * Checks if a string is a valid universe coordinates json data.
 * @param jsonString The string to check.
 */
export function isJsonStringValidUniverseCoordinates(jsonString: string): boolean {
    try {
        const data = JSON.parse(jsonString);
        if (typeof data !== "object") return false;

        if (typeof data.starSystem !== "object") return false;
        if (typeof data.starSystem.starSectorX !== "number") return false;
        if (typeof data.starSystem.starSectorY !== "number") return false;
        if (typeof data.starSystem.starSectorZ !== "number") return false;
        if (typeof data.starSystem.index !== "number") return false;

        if (typeof data.orbitalObjectIndex !== "number") return false;

        if (typeof data.positionX !== "number") return false;
        if (typeof data.positionY !== "number") return false;
        if (typeof data.positionZ !== "number") return false;

        if (typeof data.rotationQuaternionX !== "number") return false;
        if (typeof data.rotationQuaternionY !== "number") return false;
        if (typeof data.rotationQuaternionZ !== "number") return false;
        if (typeof data.rotationQuaternionW !== "number") return false;

        return true;
    } catch (e) {
        return false;
    }
}
