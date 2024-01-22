/**
 * Data structure for the save file to allow restoring current star system and position.
 */
export type SaveFileData = {
    /**
     * The version of CosmosJourneyer that created this save file.
     */
    version: string;

    /**
     * The seed of the current star system.
     */
    starSystem: {
        starSectorX: number;
        starSectorY: number;
        starSectorZ: number;
        starSectorIndex: number;
    };

    /**
     * The index of the nearest orbital object.
     */
    nearestOrbitalObjectIndex: number;

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
 * Checks if a string is a valid save file json data.
 * @param jsonString The string to check.
 */
export function isJsonStringValidSaveFileData(jsonString: string): boolean {
    try {
        const data = JSON.parse(jsonString);
        if (typeof data !== "object") return false;

        if (typeof data.version !== "string") return false;

        if (typeof data.starSystem !== "object") return false;
        if (typeof data.starSystem.starSectorX !== "number") return false;
        if (typeof data.starSystem.starSectorY !== "number") return false;
        if (typeof data.starSystem.starSectorZ !== "number") return false;
        if (typeof data.starSystem.starSectorIndex !== "number") return false;

        if (typeof data.nearestOrbitalObjectIndex !== "number") return false;

        if (typeof data.positionX !== "number") return false;
        if (typeof data.positionY !== "number") return false;
        if (typeof data.positionZ !== "number") return false;

        if (typeof data.rotationQuaternionX !== "number") return false;
        if (typeof data.rotationQuaternionY !== "number") return false;
        if (typeof data.rotationQuaternionZ !== "number") return false;

        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Parses a string into a SaveFileData object. Throws an error if the string is not a valid save file data.
 * @param jsonString The string to parse.
 * @throws Error if the string is not a valid save file data.
 */
export function parseSaveFileData(jsonString: string): SaveFileData {
    if (!isJsonStringValidSaveFileData(jsonString)) throw new Error("Invalid save file data");

    const data = JSON.parse(jsonString);

    return {
        version: data.version,
        starSystem: {
            starSectorX: data.starSystem.starSectorX,
            starSectorY: data.starSystem.starSectorY,
            starSectorZ: data.starSystem.starSectorZ,
            starSectorIndex: data.starSystem.starSectorIndex
        },
        nearestOrbitalObjectIndex: data.nearestOrbitalObjectIndex,
        positionX: data.positionX,
        positionY: data.positionY,
        positionZ: data.positionZ,
        rotationQuaternionX: data.rotationQuaternionX,
        rotationQuaternionY: data.rotationQuaternionY,
        rotationQuaternionZ: data.rotationQuaternionZ,
        rotationQuaternionW: data.rotationQuaternionW
    };
}
