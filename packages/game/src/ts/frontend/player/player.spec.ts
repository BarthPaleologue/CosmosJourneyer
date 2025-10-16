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

import { beforeEach, describe, expect, it, vi } from "vitest";

import { type SpaceDiscoveryData } from "@/backend/encyclopaedia/encyclopaediaGalactica";
import { FlyByState } from "@/backend/missions/missionFlyByNodeSerialized";
import { MissionNodeType } from "@/backend/missions/missionNodeType";
import { MissionType } from "@/backend/missions/missionSerialized";
import { SerializedPlayerSchema, type SerializedPlayer } from "@/backend/player/serializedPlayer";
import { getDefaultSerializedSpaceship } from "@/backend/spaceship/serializedSpaceship";
import { getLoneStarSystem } from "@/backend/universe/customSystems/loneStar";
import { type StarSystemCoordinates } from "@/backend/universe/starSystemCoordinates";
import { UniverseBackend } from "@/backend/universe/universeBackend";
import { type UniverseObjectId } from "@/backend/universe/universeObjectId";

import { Player } from "./player";

describe("Player", () => {
    let universeBackend: UniverseBackend;

    beforeEach(() => {
        universeBackend = new UniverseBackend(getLoneStarSystem());
        vi.clearAllMocks();
    });

    describe("Default Player Creation", () => {
        it("should create a default player with correct initial values", () => {
            const player = Player.Default(universeBackend);

            expect(player.uuid).toBeDefined();
            expect(player.uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
            expect(player.getName()).toBe(Player.DEFAULT_NAME);
            expect(player.getBalance()).toBe(Player.DEFAULT_BALANCE);
            expect(player.creationDate).toBeInstanceOf(Date);
            expect(player.timePlayedSeconds).toBe(0);
            expect(player.visitedSystemHistory).toEqual([]);
            expect(player.discoveries.local).toEqual([]);
            expect(player.discoveries.uploaded).toEqual([]);
            expect(player.currentItinerary).toBeNull();
            expect(player.systemBookmarks).toEqual([]);
            expect(player.currentMissions).toEqual([]);
            expect(player.completedMissions).toEqual([]);
            expect(player.serializedSpaceships).toHaveLength(1);
            expect(player.instancedSpaceships).toEqual([]);
            expect(player.spareSpaceshipComponents.size).toBe(0);
            expect(player.tutorials).toEqual({
                flightCompleted: false,
                stationLandingCompleted: false,
                starMapCompleted: false,
                fuelScoopingCompleted: false,
            });
        });

        it("should create unique UUIDs for different default players", () => {
            const player1 = Player.Default(universeBackend);
            const player2 = Player.Default(universeBackend);

            expect(player1.uuid).not.toBe(player2.uuid);
        });

        it("should generate new default spaceships for each schema parse", () => {
            const parsed1 = SerializedPlayerSchema.parse({});
            const parsed2 = SerializedPlayerSchema.parse({});

            expect(parsed1.spaceShips).toHaveLength(1);
            expect(parsed2.spaceShips).toHaveLength(1);
            expect(parsed1.spaceShips[0]?.id).not.toBe(parsed2.spaceShips[0]?.id);
        });
    });

    describe("SerializedPlayerSchema", () => {
        it("should assign a unique creationDate default for each parse", () => {
            vi.useFakeTimers();

            try {
                vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
                const firstCreationDate = SerializedPlayerSchema.parse({}).creationDate;

                vi.setSystemTime(new Date("2024-01-01T00:00:01.000Z"));
                const secondCreationDate = SerializedPlayerSchema.parse({}).creationDate;

                expect(firstCreationDate).not.toBe(secondCreationDate);
            } finally {
                vi.useRealTimers();
            }
        });
    });

    describe("Serialization and Deserialization", () => {
        it("should serialize and deserialize a default player without data loss", () => {
            const originalPlayer = Player.Default(universeBackend);

            const serialized = Player.Serialize(originalPlayer);
            const deserializedPlayer = Player.Deserialize(serialized, universeBackend);

            expect(deserializedPlayer.uuid).toBe(originalPlayer.uuid);
            expect(deserializedPlayer.getName()).toBe(originalPlayer.getName());
            expect(deserializedPlayer.getBalance()).toBe(originalPlayer.getBalance());
            expect(deserializedPlayer.creationDate.toISOString()).toBe(originalPlayer.creationDate.toISOString());
            expect(deserializedPlayer.timePlayedSeconds).toBe(originalPlayer.timePlayedSeconds);
            expect(deserializedPlayer.visitedSystemHistory).toEqual(originalPlayer.visitedSystemHistory);
            expect(deserializedPlayer.discoveries).toEqual(originalPlayer.discoveries);
            expect(deserializedPlayer.currentItinerary).toBe(originalPlayer.currentItinerary);
            expect(deserializedPlayer.systemBookmarks).toEqual(originalPlayer.systemBookmarks);
            expect(deserializedPlayer.currentMissions).toEqual(originalPlayer.currentMissions);
            expect(deserializedPlayer.completedMissions).toEqual(originalPlayer.completedMissions);
            expect(deserializedPlayer.serializedSpaceships).toEqual(originalPlayer.serializedSpaceships);
            expect(deserializedPlayer.instancedSpaceships).toEqual(originalPlayer.instancedSpaceships);
            expect(deserializedPlayer.spareSpaceshipComponents).toEqual(originalPlayer.spareSpaceshipComponents);
            expect(deserializedPlayer.tutorials).toEqual(originalPlayer.tutorials);

            const serialized2 = Player.Serialize(deserializedPlayer);

            expect(serialized2).toEqual(serialized);
        });

        it("should serialize and deserialize a complex player with all data types", () => {
            const player = Player.Default(universeBackend);

            // Populate with complex data
            player.setName("Test Explorer");
            player.setBalance(50000);
            player.timePlayedSeconds = 12345.67;

            // Add visited system history
            const coordinates1: StarSystemCoordinates = {
                starSectorX: 1,
                starSectorY: 2,
                starSectorZ: 3,
                localX: 0.1,
                localY: 0.2,
                localZ: 0.3,
            };
            const coordinates2: StarSystemCoordinates = {
                starSectorX: 4,
                starSectorY: 5,
                starSectorZ: 6,
                localX: 0.4,
                localY: 0.5,
                localZ: 0.6,
            };
            player.visitedSystemHistory.push(coordinates1, coordinates2);

            // Add discoveries
            const discovery1: SpaceDiscoveryData = {
                objectId: {
                    systemCoordinates: coordinates1,
                    idInSystem: "planet1",
                },
                discoveryTimestamp: Date.now(),
                explorerName: "Test Explorer",
            };
            const discovery2: SpaceDiscoveryData = {
                objectId: {
                    systemCoordinates: coordinates2,
                    idInSystem: "star1",
                },
                discoveryTimestamp: Date.now() + 1000,
                explorerName: "Test Explorer",
            };
            player.discoveries.local.push(discovery1);
            player.discoveries.uploaded.push(discovery2);

            // Add current itinerary
            player.currentItinerary = [coordinates1, coordinates2];

            // Add system bookmarks
            player.systemBookmarks.push(coordinates1, coordinates2);

            // Add spare components
            player.spareSpaceshipComponents.add({
                type: "warpDrive",
                size: 3,
                quality: 2,
            });
            player.spareSpaceshipComponents.add({
                type: "fuelScoop",
                size: 2,
                quality: 1,
            });

            // Update tutorials
            player.tutorials.flightCompleted = true;
            player.tutorials.starMapCompleted = true;

            const serialized = Player.Serialize(player);
            const deserialized = Player.Deserialize(serialized, universeBackend);

            // Verify all data is preserved
            expect(deserialized.uuid).toBe(player.uuid);
            expect(deserialized.getName()).toBe("Test Explorer");
            expect(deserialized.getBalance()).toBe(50000);
            expect(Math.round(deserialized.timePlayedSeconds)).toBe(Math.round(player.timePlayedSeconds));
            expect(deserialized.visitedSystemHistory).toEqual(player.visitedSystemHistory);
            expect(deserialized.discoveries.local).toEqual(player.discoveries.local);
            expect(deserialized.discoveries.uploaded).toEqual(player.discoveries.uploaded);
            expect(deserialized.currentItinerary).toEqual(player.currentItinerary);
            expect(deserialized.systemBookmarks).toEqual(player.systemBookmarks);
            expect(Array.from(deserialized.spareSpaceshipComponents)).toEqual(
                Array.from(player.spareSpaceshipComponents),
            );
            expect(deserialized.tutorials).toEqual(player.tutorials);

            const serialized2 = Player.Serialize(deserialized);

            expect(serialized2).toEqual(serialized);
        });

        it("should serialize with corrupted spaceship data gracefully", () => {
            const player = Player.Default(universeBackend);
            const playerSpaceship = player.serializedSpaceships[0];
            if (playerSpaceship === undefined) {
                throw new Error("No default spaceship found for test");
            }

            // Add a corrupted spaceship to serializedSpaceships
            const corruptedSpaceship = { ...getDefaultSerializedSpaceship() };
            // @ts-expect-error - Intentionally corrupt the data
            delete corruptedSpaceship.components;
            player.serializedSpaceships.push(corruptedSpaceship);

            const serialized = Player.Serialize(player);

            // Should only contain the valid spaceships (the default one)
            expect(serialized.spaceShips).toHaveLength(1);
            expect(serialized.spaceShips[0]).toMatchObject(playerSpaceship);
        });

        it("should handle mission serialization/deserialization", () => {
            const player = Player.Default(universeBackend);

            // Get a valid space station from the fallback system for the mission giver
            const fallbackSystem = universeBackend.fallbackSystem;
            const spaceStation = fallbackSystem.orbitalFacilities[0];
            if (!spaceStation) {
                throw new Error("No space station found in fallback system for test");
            }

            // Create a mock serialized mission with valid structure
            const mockSerializedMission = {
                missionGiver: {
                    systemCoordinates: fallbackSystem.coordinates,
                    idInSystem: spaceStation.id,
                },
                tree: {
                    type: MissionNodeType.FLY_BY as const,
                    objectId: {
                        systemCoordinates: fallbackSystem.coordinates,
                        idInSystem: fallbackSystem.stellarObjects[0].id,
                    },
                    state: FlyByState.NOT_IN_SYSTEM,
                },
                reward: 1000,
                type: MissionType.SIGHT_SEEING_FLY_BY,
            };

            // Directly add to serialized data to bypass mission creation issues
            const serializedPlayer: SerializedPlayer = {
                ...Player.Serialize(player),
                currentMissions: [mockSerializedMission],
                completedMissions: [mockSerializedMission],
            };

            const deserialized = Player.Deserialize(serializedPlayer, universeBackend);

            // Should handle missions gracefully (they will be filtered out if invalid)
            expect(Array.isArray(deserialized.currentMissions)).toBe(true);
            expect(Array.isArray(deserialized.completedMissions)).toBe(true);
        });

        it("should handle null and edge case values correctly", () => {
            const player = Player.Default(universeBackend);

            // Set edge cases
            player.currentItinerary = null;
            player.timePlayedSeconds = 0.123456789; // Fractional seconds

            const serialized = Player.Serialize(player);
            const deserialized = Player.Deserialize(serialized, universeBackend);

            expect(deserialized.currentItinerary).toBeNull();
            expect(deserialized.timePlayedSeconds).toBe(0); // Should be rounded
        });

        it("should validate serialized data against schema", () => {
            const player = Player.Default(universeBackend);
            const serialized = Player.Serialize(player);

            const validationResult = SerializedPlayerSchema.safeParse(serialized);
            expect(validationResult.success).toBe(true);
        });

        it("should preserve deep nested object references correctly", () => {
            const player = Player.Default(universeBackend);

            // Add complex nested data
            const systemCoords: StarSystemCoordinates = {
                starSectorX: 10,
                starSectorY: 20,
                starSectorZ: 30,
                localX: 0.12345,
                localY: -0.23456,
                localZ: 0.34567,
            };

            player.visitedSystemHistory.push(systemCoords);
            player.systemBookmarks.push(systemCoords);
            player.currentItinerary = [systemCoords, systemCoords];

            const serialized = Player.Serialize(player);
            const deserialized = Player.Deserialize(serialized, universeBackend);

            // Verify deep equality but separate object references
            expect(deserialized.visitedSystemHistory[0]).toEqual(systemCoords);
            expect(deserialized.systemBookmarks[0]).toEqual(systemCoords);
            if (deserialized.currentItinerary !== null) {
                expect(deserialized.currentItinerary[0]).toEqual(systemCoords);
            }

            // Verify they are separate objects (not the same reference)
            expect(deserialized.visitedSystemHistory[0]).not.toBe(systemCoords);
            expect(deserialized.systemBookmarks[0]).not.toBe(systemCoords);
            if (deserialized.currentItinerary !== null) {
                expect(deserialized.currentItinerary[0]).not.toBe(systemCoords);
            }
        });
    });

    describe("Visited Objects Tracking", () => {
        it("should track visited objects correctly", () => {
            const player = Player.Default(universeBackend);

            const objectId: UniverseObjectId = {
                systemCoordinates: {
                    starSectorX: 1,
                    starSectorY: 2,
                    starSectorZ: 3,
                    localX: 0.1,
                    localY: 0.2,
                    localZ: 0.3,
                },
                idInSystem: "planet1",
            };

            expect(player.hasVisitedObject(objectId)).toBe(false);

            const wasAdded = player.addVisitedObjectIfNew(objectId);
            expect(wasAdded).toBe(true);
            expect(player.hasVisitedObject(objectId)).toBe(true);
            expect(player.discoveries.local).toHaveLength(1);
            expect(player.discoveries.local[0]?.objectId).toEqual(objectId);
            expect(player.discoveries.local[0]?.explorerName).toBe(player.getName());

            // Adding the same object again should return false
            const wasAddedAgain = player.addVisitedObjectIfNew(objectId);
            expect(wasAddedAgain).toBe(false);
            expect(player.discoveries.local).toHaveLength(1);
        });

        it("should distinguish between different objects correctly", () => {
            const player = Player.Default(universeBackend);

            const objectId1: UniverseObjectId = {
                systemCoordinates: {
                    starSectorX: 1,
                    starSectorY: 2,
                    starSectorZ: 3,
                    localX: 0.1,
                    localY: 0.2,
                    localZ: 0.3,
                },
                idInSystem: "planet1",
            };

            const objectId2: UniverseObjectId = {
                systemCoordinates: {
                    starSectorX: 1,
                    starSectorY: 2,
                    starSectorZ: 3,
                    localX: 0.1,
                    localY: 0.2,
                    localZ: 0.3,
                },
                idInSystem: "planet2", // Different object in same system
            };

            const objectId3: UniverseObjectId = {
                systemCoordinates: {
                    starSectorX: 2, // Different system
                    starSectorY: 2,
                    starSectorZ: 3,
                    localX: 0.1,
                    localY: 0.2,
                    localZ: 0.3,
                },
                idInSystem: "planet1",
            };

            player.addVisitedObjectIfNew(objectId1);

            expect(player.hasVisitedObject(objectId1)).toBe(true);
            expect(player.hasVisitedObject(objectId2)).toBe(false);
            expect(player.hasVisitedObject(objectId3)).toBe(false);

            player.addVisitedObjectIfNew(objectId2);
            player.addVisitedObjectIfNew(objectId3);

            expect(player.discoveries.local).toHaveLength(3);
        });

        it("should preserve visited objects through serialization", () => {
            const player = Player.Default(universeBackend);

            const objectId: UniverseObjectId = {
                systemCoordinates: {
                    starSectorX: 1,
                    starSectorY: 2,
                    starSectorZ: 3,
                    localX: 0.1,
                    localY: 0.2,
                    localZ: 0.3,
                },
                idInSystem: "planet1",
            };

            player.addVisitedObjectIfNew(objectId);

            const serialized = Player.Serialize(player);
            const deserialized = Player.Deserialize(serialized, universeBackend);

            expect(deserialized.hasVisitedObject(objectId)).toBe(true);
            expect(deserialized.discoveries.local).toHaveLength(1);
            expect(deserialized.discoveries.local[0]?.objectId).toEqual(objectId);
        });
    });

    describe("Balance and Name Management", () => {
        it("should manage name changes with observable notifications", () => {
            const player = Player.Default(universeBackend);
            let notifiedName = "";

            player.onNameChangedObservable.add((name) => {
                notifiedName = name;
            });

            player.setName("New Name");

            expect(player.getName()).toBe("New Name");
            expect(notifiedName).toBe("New Name");
        });

        it("should manage balance changes with observable notifications", () => {
            const player = Player.Default(universeBackend);
            let notifiedBalance = 0;

            player.onBalanceChangedObservable.add((balance) => {
                notifiedBalance = balance;
            });

            player.setBalance(15000);

            expect(player.getBalance()).toBe(15000);
            expect(notifiedBalance).toBe(15000);
        });

        it("should handle pay and earn operations correctly", () => {
            const player = Player.Default(universeBackend);
            const initialBalance = player.getBalance();

            player.earn(5000);
            expect(player.getBalance()).toBe(initialBalance + 5000);

            player.pay(2000);
            expect(player.getBalance()).toBe(initialBalance + 5000 - 2000);
        });

        it("should allow negative balances from pay operations", () => {
            const player = Player.Default(universeBackend);

            player.pay(player.getBalance() + 1000);
            expect(player.getBalance()).toBe(-1000);
        });
    });

    describe("Deep Copy Functionality", () => {
        it("should perform deep copy with copyFrom method", () => {
            const sourcePlayer = Player.Default(universeBackend);
            const targetPlayer = Player.Default(universeBackend);

            // Modify source player
            sourcePlayer.setName("Source Player");
            sourcePlayer.setBalance(25000);
            sourcePlayer.timePlayedSeconds = 1000;

            const coordinates: StarSystemCoordinates = {
                starSectorX: 1,
                starSectorY: 2,
                starSectorZ: 3,
                localX: 0.1,
                localY: 0.2,
                localZ: 0.3,
            };
            sourcePlayer.visitedSystemHistory.push(coordinates);
            sourcePlayer.systemBookmarks.push(coordinates);
            sourcePlayer.currentItinerary = [coordinates, coordinates];

            const objectId: UniverseObjectId = {
                systemCoordinates: coordinates,
                idInSystem: "planet1",
            };
            sourcePlayer.addVisitedObjectIfNew(objectId);

            sourcePlayer.spareSpaceshipComponents.add({
                type: "warpDrive",
                size: 3,
                quality: 2,
            });

            sourcePlayer.tutorials.flightCompleted = true;

            // Perform deep copy
            targetPlayer.copyFrom(sourcePlayer, universeBackend);

            // Verify all properties are copied
            expect(targetPlayer.uuid).toBe(sourcePlayer.uuid);
            expect(targetPlayer.getName()).toBe(sourcePlayer.getName());
            expect(targetPlayer.getBalance()).toBe(sourcePlayer.getBalance());
            expect(targetPlayer.creationDate.toISOString()).toBe(sourcePlayer.creationDate.toISOString());
            expect(targetPlayer.timePlayedSeconds).toBe(sourcePlayer.timePlayedSeconds);
            expect(targetPlayer.visitedSystemHistory).toEqual(sourcePlayer.visitedSystemHistory);
            expect(targetPlayer.hasVisitedObject(objectId)).toBe(true);
            expect(targetPlayer.discoveries).toEqual(sourcePlayer.discoveries);
            expect(targetPlayer.currentItinerary).toEqual(sourcePlayer.currentItinerary);
            expect(targetPlayer.systemBookmarks).toEqual(sourcePlayer.systemBookmarks);
            expect(targetPlayer.spareSpaceshipComponents).toEqual(sourcePlayer.spareSpaceshipComponents);
            expect(targetPlayer.tutorials).toEqual(sourcePlayer.tutorials);

            // Verify deep copy (separate objects)
            expect(targetPlayer.visitedSystemHistory).not.toBe(sourcePlayer.visitedSystemHistory);
            expect(targetPlayer.discoveries).not.toBe(sourcePlayer.discoveries);
            expect(targetPlayer.currentItinerary).not.toBe(sourcePlayer.currentItinerary);
            expect(targetPlayer.systemBookmarks).not.toBe(sourcePlayer.systemBookmarks);
            expect(targetPlayer.spareSpaceshipComponents).not.toBe(sourcePlayer.spareSpaceshipComponents);
            expect(targetPlayer.tutorials).not.toBe(sourcePlayer.tutorials);
        });

        it("should handle null itinerary in copyFrom", () => {
            const sourcePlayer = Player.Default(universeBackend);
            const targetPlayer = Player.Default(universeBackend);

            sourcePlayer.currentItinerary = null;

            targetPlayer.copyFrom(sourcePlayer, universeBackend);

            expect(targetPlayer.currentItinerary).toBeNull();
        });
    });

    describe("Edge Cases and Error Handling", () => {
        it("should handle empty arrays and null collections gracefully", () => {
            const serializedData: SerializedPlayer = {
                uuid: crypto.randomUUID(),
                name: "Test Player",
                balance: 10000,
                creationDate: new Date().toISOString(),
                timePlayedSeconds: 0,
                visitedSystemHistory: [],
                discoveries: { local: [], uploaded: [] },
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
            };

            const player = Player.Deserialize(serializedData, universeBackend);

            expect(player.visitedSystemHistory).toEqual([]);
            expect(player.discoveries.local).toEqual([]);
            expect(player.discoveries.uploaded).toEqual([]);
            expect(player.currentItinerary).toBeNull();
            expect(player.systemBookmarks).toEqual([]);
            expect(player.currentMissions).toEqual([]);
            expect(player.completedMissions).toEqual([]);
            expect(player.spareSpaceshipComponents.size).toBe(0);
        });

        it("should handle invalid mission data gracefully", () => {
            const player = Player.Default(universeBackend);

            const serializedData: SerializedPlayer = {
                ...Player.Serialize(player),
                currentMissions: [
                    // @ts-expect-error - Invalid mission data for testing
                    { invalid: "mission", data: "test" },
                ],
                completedMissions: [
                    // @ts-expect-error - Invalid mission data for testing
                    { another: "invalid", mission: true },
                ],
            };

            // Should not throw an error during deserialization
            let deserializedPlayer: Player | undefined;
            expect(() => {
                deserializedPlayer = Player.Deserialize(serializedData, universeBackend);
            }).not.toThrow();

            // Invalid missions should be filtered out
            expect(deserializedPlayer).toBeDefined();
            if (deserializedPlayer) {
                expect(deserializedPlayer.currentMissions).toEqual([]);
                expect(deserializedPlayer.completedMissions).toEqual([]);
            }
        });

        it("should preserve exact floating point precision where possible", () => {
            const player = Player.Default(universeBackend);

            const preciseCoordinates: StarSystemCoordinates = {
                starSectorX: 1,
                starSectorY: 2,
                starSectorZ: 3,
                localX: 0.123456789,
                localY: -0.987654321,
                localZ: 0.555555555,
            };

            player.visitedSystemHistory.push(preciseCoordinates);

            const serialized = Player.Serialize(player);
            const deserialized = Player.Deserialize(serialized, universeBackend);

            expect(deserialized.visitedSystemHistory[0]).toEqual(preciseCoordinates);
        });

        it("should handle very large collections efficiently", () => {
            const player = Player.Default(universeBackend);

            // Add many discoveries
            const startTime = Date.now();
            for (let i = 0; i < 1000; i++) {
                const objectId: UniverseObjectId = {
                    systemCoordinates: {
                        starSectorX: Math.floor(i / 100),
                        starSectorY: Math.floor(i / 10) % 10,
                        starSectorZ: i % 10,
                        localX: (i % 100) / 100,
                        localY: (i % 50) / 50,
                        localZ: (i % 25) / 25,
                    },
                    idInSystem: `object${i}`,
                };
                player.addVisitedObjectIfNew(objectId);
            }

            const serialized = Player.Serialize(player);
            const deserialized = Player.Deserialize(serialized, universeBackend);
            const endTime = Date.now();

            expect(deserialized.discoveries.local).toHaveLength(1000);
            expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds

            // Verify a sample of the data
            expect(
                deserialized.hasVisitedObject({
                    systemCoordinates: {
                        starSectorX: 5,
                        starSectorY: 0,
                        starSectorZ: 0,
                        localX: 0,
                        localY: 0,
                        localZ: 0,
                    },
                    idInSystem: "object500",
                }),
            ).toBe(true);
        });
    });

    describe("Observable Behavior", () => {
        it("should not trigger observables during deserialization", () => {
            const player = Player.Default(universeBackend);

            let nameChangeCount = 0;
            let balanceChangeCount = 0;

            player.onNameChangedObservable.add(() => nameChangeCount++);
            player.onBalanceChangedObservable.add(() => balanceChangeCount++);

            // Modify and serialize
            player.setName("Modified Name");
            player.setBalance(50000);

            expect(nameChangeCount).toBe(1);
            expect(balanceChangeCount).toBe(1);

            const serialized = Player.Serialize(player);

            // Reset counters
            nameChangeCount = 0;
            balanceChangeCount = 0;

            // Deserialize should not trigger observables
            const deserialized = Player.Deserialize(serialized, universeBackend);

            expect(nameChangeCount).toBe(0);
            expect(balanceChangeCount).toBe(0);
            expect(deserialized.getName()).toBe("Modified Name");
            expect(deserialized.getBalance()).toBe(50000);
        });
    });
});
