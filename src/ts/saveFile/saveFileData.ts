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
};
