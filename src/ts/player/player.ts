//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Mission, MissionSerialized } from "../missions/mission";
import { StarSystemCoordinates, UniverseObjectId } from "../utils/coordinates/universeCoordinates";
import { warnIfUndefined } from "../utils/notification";
import { DefaultSerializedSpaceship, SerializedSpaceship, Spaceship } from "../spaceship/spaceship";
import { SpaceDiscoveryData } from "../society/encyclopaediaGalactica";

export type CompletedTutorials = {
    stationLandingCompleted: boolean;
    fuelScoopingCompleted: boolean;
};

export type SerializedPlayer = {
    uuid: string;

    name: string;

    balance: number;

    creationDate: string;

    timePlayedSeconds: number;

    visitedSystemHistory: StarSystemCoordinates[];

    discoveries: {
        local: SpaceDiscoveryData[];
        uploaded: SpaceDiscoveryData[];
    };

    currentItinerary: StarSystemCoordinates[];
    systemBookmarks: StarSystemCoordinates[];

    currentMissions: MissionSerialized[];
    completedMissions: MissionSerialized[];

    spaceShips: SerializedSpaceship[];

    tutorials: CompletedTutorials;
};

export class Player {
    uuid: string;
    name: string;
    balance: number;
    creationDate: Date;
    timePlayedSeconds: number;

    visitedSystemHistory: StarSystemCoordinates[] = [];

    discoveries: {
        local: SpaceDiscoveryData[];
        uploaded: SpaceDiscoveryData[];
    };

    private readonly visitedObjects: Set<string> = new Set();

    currentItinerary: StarSystemCoordinates[];
    systemBookmarks: StarSystemCoordinates[];

    currentMissions: Mission[] = [];
    completedMissions: Mission[] = [];

    serializedSpaceships: SerializedSpaceship[] = [];
    instancedSpaceships: Spaceship[] = [];

    tutorials: CompletedTutorials;

    static DEFAULT_NAME = "Python";
    static DEFAULT_BALANCE = 10_000;

    private constructor(serializedPlayer: SerializedPlayer) {
        this.uuid = warnIfUndefined(serializedPlayer.uuid, crypto.randomUUID(), `[PLAYER_DATA_WARNING] Uuid was undefined. Defaulting to random UUID`);
        this.name = warnIfUndefined(serializedPlayer.name, Player.DEFAULT_NAME, `[PLAYER_DATA_WARNING] Name was undefined. Defaulting to ${Player.DEFAULT_NAME}`);
        this.balance = warnIfUndefined(serializedPlayer.balance, Player.DEFAULT_BALANCE, `[PLAYER_DATA_WARNING] Balance was undefined. Defaulting to ${Player.DEFAULT_BALANCE}`);
        this.creationDate = new Date(
            warnIfUndefined(serializedPlayer.creationDate, new Date().toISOString(), `[PLAYER_DATA_WARNING] Creation date was undefined. Defaulting to current date`)
        );
        this.timePlayedSeconds = warnIfUndefined(serializedPlayer.timePlayedSeconds, 0, `[PLAYER_DATA_WARNING] Time played was undefined. Defaulting to 0`);

        this.visitedSystemHistory = warnIfUndefined(
            serializedPlayer.visitedSystemHistory,
            [],
            `[PLAYER_DATA_WARNING] Visited system history was undefined. Defaulting to empty array`
        );
        this.discoveries = warnIfUndefined(
            serializedPlayer.discoveries,
            { local: [], uploaded: [] },
            `[PLAYER_DATA_WARNING] Visited objects history was undefined. Defaulting to empty arrays`
        );

        this.discoveries.local.forEach((objectId) => {
            this.visitedObjects.add(JSON.stringify(objectId));
        });
        this.discoveries.uploaded.forEach((objectId) => {
            this.visitedObjects.add(JSON.stringify(objectId));
        });

        this.currentItinerary = warnIfUndefined(serializedPlayer.currentItinerary, [], `[PLAYER_DATA_WARNING] Current itinerary was undefined. Defaulting to empty array`);
        this.systemBookmarks = warnIfUndefined(serializedPlayer.systemBookmarks, [], `[PLAYER_DATA_WARNING] System bookmarks were undefined. Defaulting to empty array`);
        this.currentMissions = warnIfUndefined(serializedPlayer.currentMissions, [], `[PLAYER_DATA_WARNING] Current missions were undefined. Defaulting to empty array`).map(
            (mission) => Mission.Deserialize(mission)
        );
        this.completedMissions = warnIfUndefined(serializedPlayer.completedMissions, [], `[PLAYER_DATA_WARNING] Completed missions were undefined. Defaulting to empty array`).map(
            (mission) => Mission.Deserialize(mission)
        );
        this.serializedSpaceships = warnIfUndefined(
            serializedPlayer.spaceShips,
            [DefaultSerializedSpaceship],
            `[PLAYER_DATA_WARNING] Spaceships were undefined. Defaulting to the default spaceship`
        );

        this.tutorials = warnIfUndefined(
            serializedPlayer.tutorials,
            { stationLandingCompleted: false, fuelScoopingCompleted: false },
            `[PLAYER_DATA_WARNING] Tutorials were undefined. Defaulting to no tutorials completed`
        );

        this.tutorials.stationLandingCompleted = warnIfUndefined(
            this.tutorials.stationLandingCompleted,
            false,
            `[PLAYER_DATA_WARNING] Station landing tutorial completed was undefined. Defaulting to false`
        );
        this.tutorials.fuelScoopingCompleted = warnIfUndefined(
            this.tutorials.fuelScoopingCompleted,
            false,
            `[PLAYER_DATA_WARNING] Fuel scooping tutorial completed was undefined. Defaulting to false`
        );
    }

    /**
     * Returns true if the player has visited the given object, false otherwise.
     * @param objectId The object to check if the player has visited it.
     * @returns True if the player has visited the object, false otherwise.
     */
    hasVisitedObject(objectId: UniverseObjectId): boolean {
        return this.visitedObjects.has(JSON.stringify(objectId)) ?? false;
    }

    /**
     * Adds the given object to the list of visited objects if it is not already in the list.
     * @param objectId The object to add to the list of visited objects.
     * @returns True if the object was added, false if it was already in the list.
     */
    addVisitedObjectIfNew(objectId: UniverseObjectId) {
        if (this.hasVisitedObject(objectId)) {
            return false;
        }
        this.visitedObjects.add(JSON.stringify(objectId));
        this.discoveries.local.push({ objectId, discoveryTimestamp: Date.now(), explorerName: this.name });

        return true;
    }

    public static Default(): Player {
        return new Player({
            uuid: crypto.randomUUID(),
            name: Player.DEFAULT_NAME,
            balance: Player.DEFAULT_BALANCE,
            creationDate: new Date().toISOString(),
            timePlayedSeconds: 0,
            visitedSystemHistory: [],
            discoveries: { uploaded: [], local: [] },
            currentItinerary: [],
            systemBookmarks: [],
            currentMissions: [],
            completedMissions: [],
            spaceShips: [DefaultSerializedSpaceship],
            tutorials: {
                stationLandingCompleted: false,
                fuelScoopingCompleted: false
            }
        });
    }

    public static Deserialize(serializedPlayer: SerializedPlayer): Player {
        return new Player(serializedPlayer);
    }

    public static Serialize(player: Player): SerializedPlayer {
        return {
            uuid: player.uuid,
            name: player.name,
            balance: player.balance,
            creationDate: player.creationDate.toISOString(),
            timePlayedSeconds: Math.round(player.timePlayedSeconds),
            visitedSystemHistory: player.visitedSystemHistory,
            discoveries: player.discoveries,
            currentItinerary: player.currentItinerary,
            systemBookmarks: player.systemBookmarks,
            currentMissions: player.currentMissions.map((mission) => mission.serialize()),
            completedMissions: player.completedMissions.map((mission) => mission.serialize()),
            spaceShips: player.serializedSpaceships.concat(player.instancedSpaceships.map((spaceship) => spaceship.serialize())),
            tutorials: player.tutorials
        };
    }

    /**
     * Performs a deep copy of the player
     * @param player the player to copy from
     */
    public copyFrom(player: Player) {
        this.uuid = player.uuid;
        this.name = player.name;
        this.balance = player.balance;
        this.creationDate = new Date(player.creationDate);
        this.timePlayedSeconds = player.timePlayedSeconds;
        this.visitedSystemHistory = player.visitedSystemHistory.map((system) => structuredClone(system));

        this.discoveries = {
            local: player.discoveries.local.map((objectId) => structuredClone(objectId)),
            uploaded: player.discoveries.uploaded.map((objectId) => structuredClone(objectId))
        };
        this.visitedObjects.clear();
        player.visitedObjects.forEach((objectId) => {
            this.visitedObjects.add(objectId);
        });

        this.currentItinerary = player.currentItinerary.map((system) => structuredClone(system));
        this.systemBookmarks = player.systemBookmarks.map((system) => structuredClone(system));
        this.currentMissions = player.currentMissions.map((mission) => Mission.Deserialize(mission.serialize()));
        this.completedMissions = player.completedMissions.map((mission) => Mission.Deserialize(mission.serialize()));
        this.serializedSpaceships = player.serializedSpaceships.map((spaceship) => structuredClone(spaceship));
        this.instancedSpaceships = [...player.instancedSpaceships];
        this.tutorials = structuredClone(player.tutorials);
    }
}
