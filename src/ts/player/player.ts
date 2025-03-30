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

import { Mission } from "../missions/mission";
import { StarSystemCoordinates } from "../utils/coordinates/starSystemCoordinates";
import { UniverseObjectId } from "../utils/coordinates/universeObjectId";
import { Spaceship } from "../spaceship/spaceship";
import { getDefaultSerializedSpaceship, SerializedSpaceship } from "../spaceship/serializedSpaceship";
import { SpaceDiscoveryData } from "../society/encyclopaediaGalactica";
import { Observable } from "@babylonjs/core/Misc/observable";
import { CompletedTutorials, SerializedPlayer } from "./serializedPlayer";
import { SerializedComponent } from "../spaceship/serializedComponents/component";

export class Player {
    uuid: string;
    #name: string;
    #balance: number;
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

    spareSpaceshipComponents: Array<SerializedComponent> = [];

    tutorials: CompletedTutorials;

    static DEFAULT_NAME = "Python";
    static DEFAULT_BALANCE = 10_000;

    readonly onNameChangedObservable = new Observable<string>();
    readonly onBalanceChangedObservable = new Observable<number>();

    private constructor(serializedPlayer: SerializedPlayer) {
        this.uuid = serializedPlayer.uuid;

        this.#name = serializedPlayer.name;
        this.#balance = serializedPlayer.balance;

        this.creationDate = new Date(serializedPlayer.creationDate);

        this.timePlayedSeconds = serializedPlayer.timePlayedSeconds;

        this.visitedSystemHistory = structuredClone(serializedPlayer.visitedSystemHistory);

        this.discoveries = structuredClone(serializedPlayer.discoveries);
        this.discoveries.local.forEach((objectId) => {
            this.visitedObjects.add(JSON.stringify(objectId));
        });
        this.discoveries.uploaded.forEach((objectId) => {
            this.visitedObjects.add(JSON.stringify(objectId));
        });

        this.currentItinerary = structuredClone(serializedPlayer.currentItinerary);
        this.systemBookmarks = structuredClone(serializedPlayer.systemBookmarks);
        this.currentMissions = serializedPlayer.currentMissions.map((mission) => Mission.Deserialize(mission));
        this.completedMissions = serializedPlayer.completedMissions.map((mission) => Mission.Deserialize(mission));

        this.serializedSpaceships = structuredClone(serializedPlayer.spaceShips);

        this.tutorials = serializedPlayer.tutorials;
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
        this.discoveries.local.push({
            objectId,
            discoveryTimestamp: Date.now(),
            explorerName: this.getName()
        });

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
            spaceShips: [getDefaultSerializedSpaceship()],
            spareSpaceshipComponents: [],
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
            name: player.getName(),
            balance: player.getBalance(),
            creationDate: player.creationDate.toISOString(),
            timePlayedSeconds: Math.round(player.timePlayedSeconds),
            visitedSystemHistory: player.visitedSystemHistory,
            discoveries: player.discoveries,
            currentItinerary: player.currentItinerary,
            systemBookmarks: player.systemBookmarks,
            currentMissions: player.currentMissions.map((mission) => mission.serialize()),
            completedMissions: player.completedMissions.map((mission) => mission.serialize()),
            spaceShips: player.serializedSpaceships.concat(
                player.instancedSpaceships.map((spaceship) => spaceship.serialize())
            ),
            spareSpaceshipComponents: player.spareSpaceshipComponents,
            tutorials: player.tutorials
        };
    }

    /**
     * Performs a deep copy of the player
     * @param player the player to copy from
     */
    public copyFrom(player: Player) {
        this.uuid = player.uuid;
        this.setName(player.getName());
        this.setBalance(player.getBalance());
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
        this.spareSpaceshipComponents = player.spareSpaceshipComponents.map((sparePart) => structuredClone(sparePart));
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
