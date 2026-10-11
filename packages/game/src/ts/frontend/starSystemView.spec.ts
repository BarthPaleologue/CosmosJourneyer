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
import { NullEngine, NullEngineOptions } from "@babylonjs/core/Engines/nullEngine";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { ok } from "@cosmos-journeyer/typescript";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AtStationCoordinates } from "@/backend/save/universeCoordinates";
import { SystemEntityBackend } from "@/backend/systemEntity/systemEntityBackend";
import { UniverseBackend } from "@/backend/universe/universeBackend";

import { Player } from "@/frontend/player/player";
import { Spaceship } from "@/frontend/spaceship/spaceship";
import type { LandingFacility } from "@/frontend/systemEntity/landingFacility";
import { LandingPadProvider, LandingPadSize } from "@/frontend/universe/orbitalFacility/landingPadProvider";
import type { ILandingPad } from "@/frontend/universe/orbitalFacility/landingPadProvider";
import { StarSystemController } from "@/frontend/universe/starSystemController";

import { StarSystemView } from "./starSystemView";

describe("StarSystemView", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("atomically replaces the player and spaceship controls after instantiation", async () => {
        const universeBackend = new UniverseBackend(new SystemEntityBackend());
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
            targetingSystem: { addContacts: vi.fn() },
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
        const universeBackend = new UniverseBackend(new SystemEntityBackend());
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
            getSystemEntities: () => [oldFacility],
        };
        const newStarSystem = {
            getSystemEntities: () => [newFacility],
            stellarLightSystem: { addShadowCaster: vi.fn(), addShadowCasters: vi.fn() },
        } as unknown as StarSystemController;
        vi.spyOn(StarSystemController, "CreateAsync").mockResolvedValue(ok(newStarSystem));

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
            systemEntityLoader: {},
            systemEntityProcessors: {
                lightingRegions: { dispatch: (entity: object) => entity },
                shadowCasters: { dispatch: () => [] },
            },
            targetingSystem: { reset: vi.fn() },
            terrainSystem: { reset: vi.fn() },
        } as unknown as StarSystemView;

        await StarSystemView.prototype.loadStarSystem.call(context, { system: {}, entities: [] } as never);

        expect(clusteredLightingSystem.unregisterRegion).toHaveBeenCalledWith(oldFacility);
        expect(oldStarSystem.dispose).toHaveBeenCalledOnce();
        expect(clusteredLightingSystem.registerRegion).toHaveBeenCalledWith(newFacility);
        expect(clusteredLightingSystem.unregisterRegion.mock.invocationCallOrder[0]).toBeLessThan(
            oldStarSystem.dispose.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
        );
    });

    it.each([
        { label: "missing", gravity: null, expectedUp: Vector3.Up() },
        { label: "zero", gravity: Vector3.Zero(), expectedUp: Vector3.Up() },
        { label: "nonzero", gravity: new Vector3(3, -4, 0), expectedUp: new Vector3(-0.6, 0.8, 0) },
    ])("updates the character and lighting with $label gravity", ({ gravity, expectedUp }) => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const transform = new TransformNode("character", scene);
        transform.rotationQuaternion = Quaternion.RotationAxis(Vector3.Up(), 0.7);
        transform.computeWorldMatrix(true);
        const previousForward = transform.forward.clone();
        const previousGravity = gravity?.clone();
        const camera = new FreeCamera("character camera", new Vector3(0, 1.5, 0), scene);
        camera.parent = transform;
        const expectedError = new Error("Stop after clustered lighting update");
        const starSystem = {
            gravitySystem: { getLastComputedForce: (): Vector3 | null => gravity },
            update: vi.fn(),
        };
        const clusteredLightingSystem = {
            update: vi.fn((): never => {
                throw expectedError;
            }),
        };
        const activeControls = {
            getActiveCamera: (): object => camera,
            update: vi.fn(() => camera.getViewMatrix(true)),
        };
        const context = {
            _isLoadingSystem: false,
            activeControls,
            characterControls: {
                avatar: {
                    aggregate: { body: {} },
                    getTransform: () => transform,
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

        try {
            expect(() => {
                starSystemViewPrototype.updateBeforeRender.call(context, 1);
            }).toThrow(expectedError);
            transform.computeWorldMatrix(true);

            expect(transform.up.equalsWithEpsilon(expectedUp, 1e-6)).toBe(true);
            expect(Array.from(transform.getWorldMatrix().m).every(Number.isFinite)).toBe(true);
            expect(camera.globalPosition.asArray().every(Number.isFinite)).toBe(true);
            expect(gravity).toEqual(previousGravity ?? null);
            if (gravity === null || gravity.lengthSquared() === 0) {
                expect(transform.forward.equalsWithEpsilon(previousForward, 1e-6)).toBe(true);
            }
            expect(clusteredLightingSystem.update).toHaveBeenCalledWith(camera);
            expect(starSystem.update.mock.invocationCallOrder[0]).toBeLessThan(
                clusteredLightingSystem.update.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
            );
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });
});

describe("entity save locations", () => {
    it("round-trips relative coordinates around a translated, rotating station", async () => {
        const options = new NullEngineOptions();
        options.useHighPrecisionMatrix = true;
        const engine = new NullEngine(options);
        const scene = new Scene(engine);
        const stationTransform = new TransformNode("station", scene);
        stationTransform.position.set(1e9, 2e8, -3e8);
        stationTransform.rotationQuaternion = Quaternion.RotationYawPitchRoll(0.8, 0.3, -0.5);
        stationTransform.computeWorldMatrix(true);
        const object = {
            id: "station",
            name: "Station",
            getTransform: () => stationTransform,
            getBoundingRadius: () => 100,
        };
        const transform = new TransformNode("ship", scene);
        transform.position.copyFrom(
            Vector3.TransformCoordinates(new Vector3(0, 0, 500), stationTransform.getWorldMatrix()),
        );
        transform.rotationQuaternion = Quaternion.RotationYawPitchRoll(0.4, 0.2, 0.7);
        transform.computeWorldMatrix(true);
        const position = transform.getAbsolutePosition().clone();
        const rotation = transform.absoluteRotationQuaternion.clone();
        const starSystem = {
            model: { coordinates: { starSectorX: 0, starSectorY: 0, starSectorZ: 0, localX: 0, localY: 0, localZ: 0 } },
            getNearestSystemObject: () => object,
            getSystemObjectById: (id: string) => (id === object.id ? object : undefined),
        };
        const setTarget = vi.fn();
        const context = {
            getStarSystem: () => starSystem,
            getActiveControls: () => ({ getTransform: () => transform }),
            targetingSystem: { setTarget },
        } as unknown as StarSystemView;
        const prototype = StarSystemView.prototype as unknown as {
            loadRelativeLocation(
                this: StarSystemView,
                location: ReturnType<StarSystemView["getCurrentUniverseCoordinates"]>,
            ): Promise<void>;
        };
        try {
            const location = StarSystemView.prototype.getCurrentUniverseCoordinates.call(context, transform, null);
            expect(location.universeObjectId.idInSystem).toBe("station");
            transform.position.setAll(0);
            transform.rotationQuaternion = Quaternion.Identity();
            await prototype.loadRelativeLocation.call(context, location);
            transform.computeWorldMatrix(true);
            expect(transform.getAbsolutePosition().equalsWithEpsilon(position, 1e-3)).toBe(true);
            expect(Math.abs(Quaternion.Dot(transform.absoluteRotationQuaternion, rotation))).toBeCloseTo(1);
            expect(setTarget).toHaveBeenCalledWith(object);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });
});

describe("station save loading", () => {
    it("reserves the spawned pad and establishes its installation before spawning", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const transform = new TransformNode("station", scene);
        const pad: ILandingPad = {
            getTransform: () => transform,
            getBoundingRadius: () => 10,
            getIdentifier: () => "A",
            getPadSize: () => LandingPadSize.SMALL,
            getPadHeight: () => 1,
        };
        const provider = new LandingPadProvider([pad]);
        const object = { id: "station", name: "Station", getTransform: () => transform, getBoundingRadius: () => 100 };
        const entity = { model: { id: "station", name: "Station" } };
        const setLandingFacility = vi.fn<(facility: LandingFacility | null) => void>();
        const spawnOnPad = vi.fn(() => {
            expect(provider.getAvailableLandingPads()).toHaveLength(0);
            const facility = setLandingFacility.mock.calls[0]?.[0];
            expect(facility?.object.id).toBe("station");
            expect(facility?.pads).toBe(provider);
        });
        const controls = {
            getSpaceship: () => ({ spawnOnPad }),
            setLandingFacility,
            syncCameraTransform: vi.fn(),
        };
        const context = {
            getActiveControls: () => ({ getTransform: () => transform }),
            getSpaceshipControls: () => controls,
            getStarSystem: () => ({ getSystemEntities: () => [entity], getSystemObjectById: () => object }),
            systemEntityProcessors: {
                landingPadProviders: { dispatch: () => provider },
                spatialGeometry: { dispatch: () => object },
            },
        } as unknown as StarSystemView;
        const prototype = StarSystemView.prototype as unknown as {
            loadAtStationLocation(this: StarSystemView, location: AtStationCoordinates): Promise<void>;
        };
        try {
            await prototype.loadAtStationLocation.call(context, {
                type: "atStation",
                universeObjectId: {
                    idInSystem: "station",
                    systemCoordinates: {
                        starSectorX: 0,
                        starSectorY: 0,
                        starSectorZ: 0,
                        localX: 0,
                        localY: 0,
                        localZ: 0,
                    },
                },
            });
            expect(spawnOnPad).toHaveBeenCalledWith(pad);
            expect(controls.syncCameraTransform).toHaveBeenCalledOnce();
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });
});
