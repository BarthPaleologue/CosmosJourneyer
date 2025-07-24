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

import { Observable } from "@babylonjs/core/Misc/observable";

import { type SpaceDiscoveryData } from "@/backend/encyclopaedia/encyclopaediaGalactica";
import { type CompletedTutorials, type Itinerary, type SerializedPlayer } from "@/backend/player/serializedPlayer";
import { type SerializedComponent } from "@/backend/spaceship/serializedComponents/component";
import {
    getDefaultSerializedSpaceship,
    SerializedSpaceshipSchema,
    type SerializedSpaceship,
} from "@/backend/spaceship/serializedSpaceship";
import { type StarSystemCoordinates } from "@/backend/universe/starSystemCoordinates";
import { type StarSystemDatabase } from "@/backend/universe/starSystemDatabase";
import { type UniverseObjectId } from "@/backend/universe/universeObjectId";

import { Mission } from "@/frontend/missions/mission";
import { type Spaceship } from "@/frontend/spaceship/spaceship";

import { jsonSafeParse } from "@/utils/json";
import { type DeepReadonly } from "@/utils/types";

export class Player {
    uuid: string;
    #name: string;
    #balance: number;
    creationDate: Date;
    timePlayedSeconds: number;

    visitedSystemHistory: Array<DeepReadonly<StarSystemCoordinates>> = [];

    discoveries: {
        local: Array<DeepReadonly<SpaceDiscoveryData>>;
        uploaded: Array<DeepReadonly<SpaceDiscoveryData>>;
    };

    private readonly visitedObjects: Set<string> = new Set();

    currentItinerary: DeepReadonly<Itinerary> | null;
    systemBookmarks: Array<DeepReadonly<StarSystemCoordinates>>;

    currentMissions: Mission[] = [];
    completedMissions: Mission[] = [];

    serializedSpaceships: Array<DeepReadonly<SerializedSpaceship>> = [];
    instancedSpaceships: Spaceship[] = [];

    spareSpaceshipComponents: Set<DeepReadonly<SerializedComponent>>;

    tutorials: CompletedTutorials;

    static DEFAULT_NAME = "Python";
    static DEFAULT_BALANCE = 10_000;

    readonly onNameChangedObservable = new Observable<string>();
    readonly onBalanceChangedObservable = new Observable<number>();

    private constructor(serializedPlayer: DeepReadonly<SerializedPlayer>, starSystemDatabase: StarSystemDatabase) {
        this.uuid = serializedPlayer.uuid;

        this.#name = serializedPlayer.name;
        this.#balance = serializedPlayer.balance;

        this.creationDate = new Date(serializedPlayer.creationDate);

        this.timePlayedSeconds = serializedPlayer.timePlayedSeconds;

        this.visitedSystemHistory = serializedPlayer.visitedSystemHistory.map((coords) => structuredClone(coords));

        this.discoveries = {
            local: serializedPlayer.discoveries.local.map((discovery) => structuredClone(discovery)),
            uploaded: serializedPlayer.discoveries.uploaded.map((discovery) => structuredClone(discovery)),
        };

        this.discoveries.local.forEach((discovery) => {
            this.visitedObjects.add(JSON.stringify(discovery.objectId));
        });
        this.discoveries.uploaded.forEach((discovery) => {
            this.visitedObjects.add(JSON.stringify(discovery.objectId));
        });

        this.currentItinerary = structuredClone(serializedPlayer.currentItinerary);
        this.systemBookmarks = serializedPlayer.systemBookmarks.map((coords) => structuredClone(coords));
        this.currentMissions = serializedPlayer.currentMissions
            .map((mission) => Mission.Deserialize(mission, starSystemDatabase))
            .filter((mission) => mission !== null);
        this.completedMissions = serializedPlayer.completedMissions
            .map((mission) => Mission.Deserialize(mission, starSystemDatabase))
            .filter((mission) => mission !== null);

        this.serializedSpaceships = [...serializedPlayer.spaceShips];

        this.spareSpaceshipComponents = new Set(serializedPlayer.spareSpaceshipComponents);

        this.tutorials = serializedPlayer.tutorials;
    }

    /**
     * Returns true if the player has visited the given object, false otherwise.
     * @param objectId The object to check if the player has visited it.
     * @returns True if the player has visited the object, false otherwise.
     */
    hasVisitedObject(objectId: UniverseObjectId): boolean {
        return this.visitedObjects.has(JSON.stringify(objectId));
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
        this.discoveries.local.push({
            objectId,
            discoveryTimestamp: Date.now(),
            explorerName: this.getName(),
        });

        return true;
    }

    public static Default(starSystemDatabase: StarSystemDatabase): Player {
        return new Player(
            {
                uuid: crypto.randomUUID(),
                name: Player.DEFAULT_NAME,
                balance: Player.DEFAULT_BALANCE,
                creationDate: new Date().toISOString(),
                timePlayedSeconds: 0,
                visitedSystemHistory: [],
                discoveries: { uploaded: [], local: [] },
                currentItinerary: null,
                systemBookmarks: [],
                currentMissions: [],
                completedMissions: [],
                spaceShips: [getDefaultSerializedSpaceship()],
                spareSpaceshipComponents: [],
                tutorials: {
                    flightCompleted: false,
                    stationLandingCompleted: false,
                    starMapCompleted: false,
                    fuelScoopingCompleted: false,
                },
            },
            starSystemDatabase,
        );
    }

    public static Deserialize(
        serializedPlayer: DeepReadonly<SerializedPlayer>,
        starSystemDatabase: StarSystemDatabase,
    ): Player {
        return new Player(serializedPlayer, starSystemDatabase);
    }

    public static Serialize(player: Player): SerializedPlayer {
        const mutableSerializedSpaceships = player.serializedSpaceships
            .map((spaceship) => jsonSafeParse(JSON.stringify(spaceship)))
            .map((spaceship) => SerializedSpaceshipSchema.safeParse(spaceship).data)
            .filter((spaceship) => spaceship !== undefined);

        return {
            uuid: player.uuid,
            name: player.getName(),
            balance: player.getBalance(),
            creationDate: player.creationDate.toISOString(),
            timePlayedSeconds: Math.round(player.timePlayedSeconds),
            visitedSystemHistory: player.visitedSystemHistory.map((coords) => structuredClone(coords)),
            discoveries: {
                local: player.discoveries.local.map((discovery) => structuredClone(discovery)),
                uploaded: player.discoveries.uploaded.map((discovery) => structuredClone(discovery)),
            },
            currentItinerary: player.currentItinerary !== null ? [...player.currentItinerary] : null,
            systemBookmarks: player.systemBookmarks.map((coords) => structuredClone(coords)),
            currentMissions: player.currentMissions.map((mission) => mission.serialize()),
            completedMissions: player.completedMissions.map((mission) => mission.serialize()),
            spaceShips: mutableSerializedSpaceships.concat(
                player.instancedSpaceships.map((spaceship) => spaceship.serialize()),
            ),
            spareSpaceshipComponents: Array.from(player.spareSpaceshipComponents),
            tutorials: player.tutorials,
        };
    }

    /**
     * Performs a deep copy of the player
     * @param player the player to copy from
     */
    public copyFrom(player: Player, starSystemDatabase: StarSystemDatabase) {
        this.uuid = player.uuid;
        this.setName(player.getName());
        this.setBalance(player.getBalance());
        this.creationDate = new Date(player.creationDate);
        this.timePlayedSeconds = player.timePlayedSeconds;
        this.visitedSystemHistory = player.visitedSystemHistory.map((system) => structuredClone(system));

        this.discoveries = {
            local: player.discoveries.local.map((objectId) => structuredClone(objectId)),
            uploaded: player.discoveries.uploaded.map((objectId) => structuredClone(objectId)),
        };
        this.visitedObjects.clear();
        player.visitedObjects.forEach((objectId) => {
            this.visitedObjects.add(objectId);
        });

        this.currentItinerary = player.currentItinerary !== null ? [...player.currentItinerary] : null;
        this.systemBookmarks = player.systemBookmarks.map((system) => structuredClone(system));
        this.currentMissions = player.currentMissions
            .map((mission) => Mission.Deserialize(mission.serialize(), starSystemDatabase))
            .filter((mission) => mission !== null);
        this.completedMissions = player.completedMissions
            .map((mission) => Mission.Deserialize(mission.serialize(), starSystemDatabase))
            .filter((mission) => mission !== null);
        this.serializedSpaceships = player.serializedSpaceships.map((spaceship) => structuredClone(spaceship));
        this.instancedSpaceships = [...player.instancedSpaceships];
        this.spareSpaceshipComponents = structuredClone(player.spareSpaceshipComponents);
        this.tutorials = structuredClone(player.tutorials);
    }

    public setName(name: string) {
        this.#name = name;
        this.onNameChangedObservable.notifyObservers(name);
    }

    public getName(): string {
        return this.#name;
    }

    public setBalance(balance: number) {
        this.#balance = balance;
        this.onBalanceChangedObservable.notifyObservers(balance);
    }

    public getBalance(): number {
        return this.#balance;
    }

    public pay(amount: number): void {
        this.setBalance(this.getBalance() - amount);
    }

    public earn(amount: number): void {
        this.setBalance(this.getBalance() + amount);
    }
}
