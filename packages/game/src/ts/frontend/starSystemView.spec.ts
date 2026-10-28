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

import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getLoneStarSystem } from "@/backend/universe/customSystems/loneStar";
import { UniverseBackend } from "@/backend/universe/universeBackend";

import { Player } from "@/frontend/player/player";
import { Spaceship } from "@/frontend/spaceship/spaceship";

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
            getCameras: () => [],
            getSpaceship: () => oldSpaceship,
            reset: vi.fn(),
            setSpaceship: vi.fn(),
        };
        const context = {
            assets: {},
            characterControls: {},
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
});

describe("character gravity alignment", () => {
    it.each([
        { gravity: null, expectedUp: Vector3.Up() },
        { gravity: Vector3.Zero(), expectedUp: Vector3.Up() },
        { gravity: new Vector3(3, -4, 0), expectedUp: new Vector3(-0.6, 0.8, 0) },
    ])("preserves finite transforms and cached gravity for $gravity", ({ gravity, expectedUp }) => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const transform = new TransformNode("character", scene);
        transform.rotationQuaternion = Quaternion.RotationAxis(Vector3.Up(), 0.7);
        transform.computeWorldMatrix(true);
        const previousRotation = transform.rotationQuaternion.clone();
        const previousGravity = gravity?.clone();
        const camera = new FreeCamera("character camera", new Vector3(0, 1.5, 0), scene);
        camera.parent = transform;
        const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
        const context = {
            _isLoadingSystem: false,
            activeControls: null,
            characterControls: { avatar: { aggregate: { body: {} }, getTransform: () => transform } },
            getStarSystem: () => ({ gravitySystem: { getLastComputedForce: () => gravity } }),
            spaceshipControls: {},
        } as unknown as StarSystemView;
        const prototype = StarSystemView.prototype as unknown as {
            updateBeforeRender(this: StarSystemView, deltaSeconds: number): void;
        };
        try {
            prototype.updateBeforeRender.call(context, 0);
            transform.computeWorldMatrix(true);
            camera.getViewMatrix(true);
            expect(transform.up.equalsWithEpsilon(expectedUp, 1e-6)).toBe(true);
            expect(Array.from(transform.getWorldMatrix().m).every(Number.isFinite)).toBe(true);
            expect(camera.globalPosition.asArray().every(Number.isFinite)).toBe(true);
            expect(gravity).toEqual(previousGravity ?? null);
            if (gravity === null || gravity.lengthSquared() === 0) {
                expect(transform.rotationQuaternion.equals(previousRotation)).toBe(true);
            }
        } finally {
            warning.mockRestore();
            scene.dispose();
            engine.dispose();
        }
    });
});
