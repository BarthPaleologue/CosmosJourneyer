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

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getLoneStarSystem } from "@/backend/universe/customSystems/loneStar";
import { UniverseBackend } from "@/backend/universe/universeBackend";

import { Player } from "@/frontend/gameplay/player/player";
import { Spaceship } from "@/frontend/gameplay/spaceship/spaceship";
import { StarSystemController } from "@/frontend/simulation/starSystemController";

import { StarSystemView } from "./starSystemView";

describe("StarSystemView", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("atomically replaces the player and spaceship controls after instantiation", async () => {
        const universeBackend = new UniverseBackend(getLoneStarSystem());
        const player = Player.Default(universeBackend);
        const nextPlayer = Player.Default(universeBackend);
        const currentPlayerUuid = player.uuid;
        const currentSpaceshipSerialized = player.serializedSpaceships[0];
        const nextSpaceshipSerialized = nextPlayer.serializedSpaceships[0];
        if (currentSpaceshipSerialized === undefined || nextSpaceshipSerialized === undefined) {
            throw new Error("Default player has no spaceship");
        }

        const spaceship = { aggregate: {} } as unknown as Spaceship;
        let resolveDeserialization: ((spaceship: Spaceship) => void) | undefined;
        vi.spyOn(Spaceship, "Deserialize").mockReturnValue(
            new Promise<Spaceship>((resolve) => {
                resolveDeserialization = resolve;
            }),
        );

        const oldSpaceship = { dispose: vi.fn() };
        const spaceshipControls = {
            getCameras: (): never[] => [],
            getSpaceship: (): { dispose: () => void } => oldSpaceship,
            reset: vi.fn(),
            setSpaceship: vi.fn(),
        };
        const clusteredLightingSystem = {
            registerRegion: vi.fn(),
            unregisterRegion: vi.fn(),
        };
        const context = {
            assets: {},
            characterControls: {},
            clusteredLightingSystem,
            defaultControls: { getCameras: () => [] },
            interactionSystem: { register: vi.fn() },
            physicsEngine: {},
            player,
            postProcessManager: { reset: vi.fn() },
            scene: {},
            setActiveControls: vi.fn(),
            soundPlayer: {},
            spaceshipControls,
            targetCursorLayer: { addObjects: vi.fn() },
            universeBackend,
            vehicleControls: { getCameras: () => [] },
        } as unknown as StarSystemView;

        const resetPromise = StarSystemView.prototype.resetPlayer.call(context, nextPlayer);

        expect(player.uuid).toBe(currentPlayerUuid);
        expect(player.serializedSpaceships).toEqual([currentSpaceshipSerialized]);
        expect(spaceshipControls.getSpaceship()).toBe(oldSpaceship);

        resolveDeserialization?.(spaceship);
        await resetPromise;

        expect(player.uuid).toBe(nextPlayer.uuid);
        expect(player.serializedSpaceships).toEqual([]);
        expect(player.instancedSpaceships).toEqual([spaceship]);
        expect(nextPlayer.serializedSpaceships).toEqual([nextSpaceshipSerialized]);
        expect(spaceshipControls.setSpaceship).toHaveBeenCalledWith(spaceship);
        expect(clusteredLightingSystem.unregisterRegion).toHaveBeenCalledWith(oldSpaceship);
        expect(clusteredLightingSystem.registerRegion).toHaveBeenCalledWith(spaceship);
        expect(oldSpaceship.dispose).toHaveBeenCalled();
    });

    it("keeps the current player when the replacement spaceship cannot be instantiated", async () => {
        const universeBackend = new UniverseBackend(getLoneStarSystem());
        const player = Player.Default(universeBackend);
        const nextPlayer = Player.Default(universeBackend);
        const currentSpaceshipSerialized = player.serializedSpaceships[0];
        const nextSpaceshipSerialized = nextPlayer.serializedSpaceships[0];
        if (currentSpaceshipSerialized === undefined || nextSpaceshipSerialized === undefined) {
            throw new Error("Default player has no spaceship");
        }

        let rejectDeserialization: ((reason: Error) => void) | undefined;
        const deserializationPromise = new Promise<Spaceship>((_resolve, reject) => {
            rejectDeserialization = reject;
        });
        vi.spyOn(Spaceship, "Deserialize").mockReturnValue(deserializationPromise);

        const context = {
            assets: {},
            physicsEngine: {},
            player,
            scene: {},
            soundPlayer: {},
            universeBackend,
        } as unknown as StarSystemView;

        const resetPromise = StarSystemView.prototype.resetPlayer.call(context, nextPlayer);

        expect(player.serializedSpaceships).toEqual([currentSpaceshipSerialized]);
        expect(nextPlayer.serializedSpaceships).toEqual([nextSpaceshipSerialized]);

        const expectedError = new Error("Spaceship deserialization failed");
        const rejectionExpectation = expect(resetPromise).rejects.toBe(expectedError);
        rejectDeserialization?.(expectedError);
        await rejectionExpectation;

        expect(player.serializedSpaceships).toEqual([currentSpaceshipSerialized]);
        expect(player.instancedSpaceships).toEqual([]);
        expect(nextPlayer.serializedSpaceships).toEqual([nextSpaceshipSerialized]);
    });

    it("rewires facility lights before disposing the previous star system", async () => {
        const oldFacility = {};
        const newFacility = {};
        const oldStarSystem = {
            dispose: vi.fn(),
            getOrbitalFacilities: (): ReadonlyArray<object> => [oldFacility],
        };
        const newStarSystem = {
            getOrbitalFacilities: () => [newFacility],
            stellarLightSystem: { addShadowCaster: vi.fn() },
        } as unknown as StarSystemController;
        vi.spyOn(StarSystemController, "CreateAsync").mockResolvedValue(newStarSystem);

        const clusteredLightingSystem = {
            registerRegion: vi.fn(),
            unregisterRegion: vi.fn(),
        };
        const context = {
            _isLoadingSystem: false,
            assets: {},
            characterControls: null,
            clusteredLightingSystem,
            loader: {},
            postProcessManager: { reset: vi.fn() },
            progressMonitor: {},
            scene: {},
            spaceStationLayer: { reset: vi.fn() },
            spaceshipControls: null,
            starSystem: oldStarSystem,
            targetCursorLayer: { reset: vi.fn() },
            terrainSystem: { reset: vi.fn() },
        } as unknown as StarSystemView;

        await StarSystemView.prototype.loadStarSystem.call(context, {} as never);

        expect(clusteredLightingSystem.unregisterRegion).toHaveBeenCalledWith(oldFacility);
        expect(oldStarSystem.dispose).toHaveBeenCalledOnce();
        expect(clusteredLightingSystem.registerRegion).toHaveBeenCalledWith(newFacility);
        expect(clusteredLightingSystem.unregisterRegion.mock.invocationCallOrder[0]).toBeLessThan(
            oldStarSystem.dispose.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
        );
    });

    it("updates clustered lighting after star system positions", () => {
        const camera = {};
        const expectedError = new Error("Stop after clustered lighting update");
        const starSystem = {
            gravitySystem: { getLastComputedForce: (): Vector3 => Vector3.Down() },
            update: vi.fn(),
        };
        const clusteredLightingSystem = {
            update: vi.fn((): never => {
                throw expectedError;
            }),
        };
        const activeControls = {
            getActiveCamera: (): object => camera,
            update: vi.fn(),
        };
        const context = {
            _isLoadingSystem: false,
            activeControls,
            characterControls: {
                avatar: {
                    aggregate: { body: {} },
                    getTransform: () => ({ up: Vector3.Up() }),
                },
            },
            clusteredLightingSystem,
            getStarSystem: () => starSystem,
            scene: { activeCamera: camera },
            spaceshipControls: {},
            starSystem,
            terrainSystem: { update: vi.fn() },
        } as unknown as StarSystemView;
        const starSystemViewPrototype = StarSystemView.prototype as unknown as {
            updateBeforeRender(this: StarSystemView, deltaSeconds: number): void;
        };

        expect(() => {
            starSystemViewPrototype.updateBeforeRender.call(context, 1);
        }).toThrow(expectedError);
        expect(clusteredLightingSystem.update).toHaveBeenCalledWith(camera);
        expect(starSystem.update.mock.invocationCallOrder[0]).toBeLessThan(
            clusteredLightingSystem.update.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
        );
    });
});
