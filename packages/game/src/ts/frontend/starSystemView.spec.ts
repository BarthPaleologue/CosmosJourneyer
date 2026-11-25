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

import "@babylonjs/core/Physics/physicsEngineComponent";

import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import { Bone } from "@babylonjs/core/Bones/bone";
import { Skeleton } from "@babylonjs/core/Bones/skeleton";
import type { Camera } from "@babylonjs/core/Cameras/camera";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { NullEngine, NullEngineOptions } from "@babylonjs/core/Engines/nullEngine";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";
import { PhysicsShapeConvexHull } from "@babylonjs/core/Physics/v2/physicsShape";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { Scene } from "@babylonjs/core/scene";
import type { HavokPhysicsWithBindings } from "@babylonjs/havok";
import { err, ok } from "@cosmos-journeyer/typescript";
import type { BlackHoleModel, StarSystemModel } from "@cosmos-journeyer/universe-model";
import { createInstance } from "i18next";
import type { TFunction } from "i18next";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { EncyclopaediaGalacticaManager } from "@/backend/encyclopaedia/encyclopaediaGalacticaManager";
import type { AtStationCoordinates, RelativeCoordinates } from "@/backend/save/universeCoordinates";
import { SystemEntityBackend } from "@/backend/systemEntity/systemEntityBackend";
import type { StarSystemContentModel } from "@/backend/universe/universeBackend";
import { UniverseBackend } from "@/backend/universe/universeBackend";

import { LoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import type { Materials } from "@/frontend/assets/materials";
import { ModuleAssets } from "@/frontend/assets/moduleAssets";
import type { Objects } from "@/frontend/assets/objects";
import type { HumanoidAnimations, HumanoidInstance } from "@/frontend/assets/objects/humanoids";
import type { RenderingAssets } from "@/frontend/assets/renderingAssets";
import type { Textures } from "@/frontend/assets/textures";
import type { ISoundPlayer } from "@/frontend/audio/soundPlayer";
import { SoundPlayerMock } from "@/frontend/audio/soundPlayer";
import type { ITts } from "@/frontend/audio/tts";
import type { Controls } from "@/frontend/controls";
import { CharacterControls } from "@/frontend/controls/characterControls/characterControls";
import { HumanoidAvatar } from "@/frontend/controls/characterControls/humanoidAvatar";
import type { ClusteredLightingRegion } from "@/frontend/helpers/clusteredLightingSystem";
import { createHavokForTests } from "@/frontend/helpers/havokTest";
import { StellarLightSystem } from "@/frontend/helpers/stellarLightSystem";
import { Player } from "@/frontend/player/player";
import { ShipControls } from "@/frontend/spaceship/shipControls";
import { Spaceship } from "@/frontend/spaceship/spaceship";
import type { SystemEntity } from "@/frontend/systemEntity/systemEntity";
import { SystemEntityLoader } from "@/frontend/systemEntity/systemEntityLoader";
import { SystemEntityProcessors } from "@/frontend/systemEntity/systemEntityProcessors";
import type { INotificationManager } from "@/frontend/ui/notificationManager";
import { LandingPadProvider, LandingPadSize } from "@/frontend/universe/orbitalFacility/landingPadProvider";
import type { ILandingPad } from "@/frontend/universe/orbitalFacility/landingPadProvider";
import type { ITerrainSystem } from "@/frontend/universe/planets/telluricPlanet/terrain/system/terrainSystem";
import { makeTaskId } from "@/frontend/universe/planets/telluricPlanet/terrain/system/terrainSystem";
import { StarSystemController } from "@/frontend/universe/starSystemController";
import { StarSystemLoader } from "@/frontend/universe/starSystemLoader";
import type { LandableFacility, SystemObject } from "@/frontend/universe/systemObject";

import { getPhysicsEngineV2 } from "@/utils/physicsEngineV2";

import { StarSystemView } from "./starSystemView";
import * as dialogModal from "./ui/dialogModal";

// Star system loading waits between batches to let the loading screen breathe; skip that in tests.
vi.mock("@/utils/wait", () => ({ wait: async () => {} }));

let havok: HavokPhysicsWithBindings;

beforeAll(async () => {
    havok = await createHavokForTests();
});

afterEach(() => {
    vi.restoreAllMocks();
});

/**
 * Builds a fully typed rendering-assets stand-in backed by real Babylon.js objects.
 * Members that the tests never touch throw when accessed, like in `systemEntityLoader.spec.ts`.
 * @param scene Scene that owns the created meshes and textures.
 * @returns A complete `RenderingAssets` value.
 */
function createTestAssets(scene: Scene): RenderingAssets {
    const wanderer = MeshBuilder.CreateBox("wanderer", { size: 2 }, scene);
    const frame = MeshBuilder.CreateBox("frame", { size: 1 }, scene);
    frame.parent = wanderer;
    const objects: Objects = {
        crate: MeshBuilder.CreateBox("crate", { size: 1 }, scene),
        grassBlades: [
            MeshBuilder.CreateBox("grassBlade0", { size: 1 }, scene),
            MeshBuilder.CreateBox("grassBlade1", { size: 1 }, scene),
        ],
        wanderer,
        butterfly: MeshBuilder.CreateBox("butterfly", { size: 1 }, scene),
        banana: MeshBuilder.CreateBox("banana", { size: 1 }, scene),
        humanoids: {
            placeholder: { spawn: () => err("No humanoid in tests") },
            astronaut: { spawn: () => err("No humanoid in tests") },
        },
        rock: { mesh: MeshBuilder.CreateBox("rock", { size: 1 }, scene), sizeToShape: new Map() },
        asteroids: [],
        tree: MeshBuilder.CreateBox("tree", { size: 1 }, scene),
        stationEngine: {
            mesh: MeshBuilder.CreateBox("stationEngine", { size: 1 }, scene),
            shape: new PhysicsShapeConvexHull(MeshBuilder.CreateBox("stationEngineShape", { size: 1 }, scene), scene),
        },
    };
    const textures: Textures = {
        get terrains(): Textures["terrains"] {
            throw new Error("Terrain textures are not used in tests");
        },
        get water(): Textures["water"] {
            throw new Error("Water textures are not used in tests");
        },
        get particles(): Textures["particles"] {
            throw new Error("Particle textures are not used in tests");
        },
        get materials(): Textures["materials"] {
            throw new Error("Material textures are not used in tests");
        },
        get gasPlanet(): Textures["gasPlanet"] {
            throw new Error("Gas planet textures are not used in tests");
        },
        get rings(): Textures["rings"] {
            throw new Error("Ring textures are not used in tests");
        },
        environment: { milkyWay: new CubeTexture("", scene) },
        noises: { seamlessPerlin: new Texture(null, scene) },
        get ui(): Textures["ui"] {
            throw new Error("UI textures are not used in tests");
        },
        get empty(): Textures["empty"] {
            throw new Error("The empty texture is not used in tests");
        },
        get pools(): Textures["pools"] {
            throw new Error("Texture pools are not used in tests");
        },
    };
    return {
        textures,
        get materials(): Materials {
            throw new Error("Materials are not used in tests");
        },
        objects,
    };
}

/**
 * Creates a fully typed terrain system stand-in whose methods are spies.
 * @returns A complete `ITerrainSystem` implementation.
 */
function createTestTerrainSystem(): ITerrainSystem {
    return {
        requestChunk: vi.fn(),
        getChunkOutput: vi.fn(),
        requestHeights: vi.fn(() => makeTaskId("test")),
        getHeightsOutput: vi.fn(),
        update: vi.fn(),
        reset: vi.fn(),
    };
}

interface TestViewContext {
    view: StarSystemView;
    scene: Scene;
    engine: NullEngine;
    player: Player;
    universeBackend: UniverseBackend;
    assets: RenderingAssets;
    physicsEngine: PhysicsEngineV2;
    soundPlayer: ISoundPlayer;
    tts: ITts;
    notificationManager: INotificationManager;
    terrainSystem: ITerrainSystem;
    t: TFunction;
}

/**
 * Creates a real `StarSystemView` through its real constructor, injecting genuinely typed
 * dependencies (real Babylon.js scene/engine/physics, interface literals for the services).
 * @param options Options forwarded to the null engine.
 * @param options.useHighPrecisionMatrix Whether the null engine should use high precision matrices.
 * @returns The view plus every dependency the tests need to arrange and assert.
 */
async function createTestView(options?: { useHighPrecisionMatrix?: boolean }): Promise<TestViewContext> {
    const engineOptions = new NullEngineOptions();
    engineOptions.useHighPrecisionMatrix = options?.useHighPrecisionMatrix ?? false;
    const engine = new NullEngine(engineOptions);
    engine._webGLVersion = 2;
    const caps = engine.getCaps();
    caps.texelFetch = true;
    caps.colorBufferFloat = true;
    caps.blendFloat = true;
    const scene = new Scene(engine);
    scene.enablePhysics(Vector3.Zero(), new HavokPlugin(true, havok));
    const physicsEngine = getPhysicsEngineV2(scene);
    const universeBackend = new UniverseBackend(new SystemEntityBackend());
    const player = Player.Default(universeBackend);
    const i18n = createInstance();
    await i18n.init({ lng: "en-US", resources: {} });
    const t: TFunction = i18n.getFixedT("en-US");
    const soundPlayer: ISoundPlayer = new SoundPlayerMock();
    const tts: ITts = { sayNow: vi.fn(), enqueueSay: vi.fn(), update: vi.fn() };
    const notificationManager: INotificationManager = {
        update: vi.fn(),
        create: vi.fn(),
        setVisible: vi.fn(),
    };
    const terrainSystem = createTestTerrainSystem();
    const assets = createTestAssets(scene);
    const view = new StarSystemView(
        scene,
        player,
        engine,
        physicsEngine,
        new EncyclopaediaGalacticaManager(),
        universeBackend,
        new SystemEntityLoader(),
        new SystemEntityProcessors(),
        soundPlayer,
        tts,
        notificationManager,
        assets,
        new ModuleAssets([]),
        terrainSystem,
        t,
        new LoadingProgressMonitor(),
    );
    return {
        view,
        scene,
        engine,
        player,
        universeBackend,
        assets,
        physicsEngine,
        soundPlayer,
        tts,
        notificationManager,
        terrainSystem,
        t,
    };
}

const blackHoleModel: BlackHoleModel = {
    type: "blackHole",
    id: "blackHole",
    name: "Black Hole",
    mass: 1e30,
    accretionDiskRadius: 0,
    blackBodyTemperature: 0,
    orbit: {
        parentIds: [],
        semiMajorAxis: 0,
        eccentricity: 0,
        plane: { inclination: 0, longitudeOfAscendingNode: 0 },
        argumentOfPeriapsis: 0,
        initialMeanAnomaly: 0,
        p: 2,
    },
    spin: { siderealPeriod: 0, axialTilt: 0, axisAzimuth: 0, initialRotationAngle: 0 },
};

const blackHoleSystemModel: StarSystemModel = {
    name: "Test system",
    coordinates: { starSectorX: 0, starSectorY: 0, starSectorZ: 0, localX: 0, localY: 0, localZ: 0 },
    stellarObjects: [blackHoleModel],
    planets: [],
    satellites: [],
    anomalies: [],
};

/**
 * Loads a real star system controller for a minimal black hole system.
 * @param scene Scene the star system is loaded into.
 * @param assets Rendering assets used by the loaders.
 * @param options Fixture options.
 * @param options.accretionDiskRadius Outer radius of the disk in meters.
 * @returns The loaded controller.
 */
async function createBlackHoleStarSystem(
    scene: Scene,
    assets: RenderingAssets,
    options?: { accretionDiskRadius: number },
): Promise<StarSystemController> {
    const model: StarSystemModel = {
        ...blackHoleSystemModel,
        stellarObjects: [
            {
                ...blackHoleModel,
                accretionDiskRadius: options?.accretionDiskRadius ?? blackHoleModel.accretionDiskRadius,
            },
        ],
    };
    const result = await StarSystemController.CreateAsync(
        model,
        new StarSystemLoader(),
        [],
        new SystemEntityLoader(),
        createTestTerrainSystem(),
        assets,
        new ModuleAssets([]),
        scene,
        new LoadingProgressMonitor(),
        new SystemEntityProcessors(),
    );
    if (!result.success) {
        throw result.error;
    }
    return result.value;
}

it("registers a black hole's accretion disk with the outer disk radius", async () => {
    const { scene, engine, assets } = await createTestView();
    const register = vi.spyOn(StellarLightSystem.prototype, "registerStellarObject").mockReturnValue(undefined);
    const accretionDiskRadius = 12_000;
    try {
        const starSystem = await createBlackHoleStarSystem(scene, assets, { accretionDiskRadius });
        const [blackHole] = starSystem.getStellarObjects();
        if (blackHole.type !== "blackHole" || blackHole.accretionDisk === null) {
            throw new Error("Expected a black hole with an accretion disk");
        }
        expect(register).toHaveBeenCalledExactlyOnceWith(
            blackHole.getTransform(),
            blackHole.accretionDisk.getEmissiveColor(),
            accretionDiskRadius,
        );
    } finally {
        scene.dispose();
        engine.dispose();
    }
});

/**
 * Deserializes a real spaceship through the real `Spaceship.Deserialize` factory.
 * @param scene Scene the spaceship is created in.
 * @param assets Rendering assets used to build the ship mesh.
 * @param physicsEngine Physics engine used for the ship aggregate.
 * @returns The real spaceship instance.
 */
async function createRealSpaceship(
    scene: Scene,
    assets: RenderingAssets,
    physicsEngine: PhysicsEngineV2,
): Promise<Spaceship> {
    const universeBackend = new UniverseBackend(new SystemEntityBackend());
    const owner = Player.Default(universeBackend);
    const serializedSpaceship = owner.serializedSpaceships[0];
    if (serializedSpaceship === undefined) {
        throw new Error("Default player has no spaceship");
    }
    return Spaceship.Deserialize(
        serializedSpaceship,
        owner.spareSpaceshipComponents,
        scene,
        assets,
        new SoundPlayerMock(),
        physicsEngine,
    );
}

/**
 * Builds a complete `Controls` implementation backed by real scene objects.
 * @param transform Transform driven by the controls.
 * @param camera Active camera of the controls.
 * @returns A fully typed controls object.
 */
function createTestControls(transform: TransformNode, camera: Camera): Controls {
    return {
        getTransform: () => transform,
        getActiveCamera: () => camera,
        getCameras: () => [camera],
        shouldLockPointer: () => false,
        update: vi.fn(() => camera.getViewMatrix(true)),
    };
}

describe("StarSystemView", () => {
    it("atomically replaces the player and spaceship controls after instantiation", async () => {
        const {
            view,
            scene,
            engine,
            player,
            universeBackend,
            assets,
            physicsEngine,
            soundPlayer,
            tts,
            notificationManager,
            t,
        } = await createTestView();
        try {
            const nextPlayer = Player.Default(universeBackend);
            const currentPlayerUuid = player.uuid;
            const currentSpaceshipSerialized = player.serializedSpaceships[0];
            const nextSpaceshipSerialized = nextPlayer.serializedSpaceships[0];
            if (currentSpaceshipSerialized === undefined || nextSpaceshipSerialized === undefined) {
                throw new Error("Default player has no spaceship");
            }

            const oldSpaceship = await createRealSpaceship(scene, assets, physicsEngine);
            const shipControls = new ShipControls(oldSpaceship, scene, soundPlayer, tts, notificationManager, t);
            view["spaceshipControls"] = shipControls;
            const setSpaceshipSpy = vi.spyOn(shipControls, "setSpaceship").mockImplementation(() => {});
            vi.spyOn(shipControls, "reset").mockImplementation(() => {});
            const oldSpaceshipDisposeSpy = vi.spyOn(oldSpaceship, "dispose");
            const unregisterRegionSpy = vi.spyOn(view["clusteredLightingSystem"], "unregisterRegion");
            const registerRegionSpy = vi.spyOn(view["clusteredLightingSystem"], "registerRegion");
            vi.spyOn(view.postProcessManager, "reset").mockImplementation(() => {});
            view["setActiveControls"] = vi.fn(async (): Promise<void> => {});
            vi.spyOn(dialogModal, "alertModal").mockResolvedValue(undefined);
            const originalDeserialize = Spaceship.Deserialize.bind(Spaceship);
            let deserializedSpaceship: Promise<Spaceship> | undefined;
            vi.spyOn(Spaceship, "Deserialize").mockImplementation(async (...args) => {
                const promise = originalDeserialize(...args);
                deserializedSpaceship = promise;
                return await promise;
            });

            const resetPromise = view.resetPlayer(nextPlayer);

            // The replacement only happens once the new spaceship is instantiated.
            expect(player.uuid).toBe(currentPlayerUuid);
            expect(player.serializedSpaceships).toEqual([currentSpaceshipSerialized]);
            expect(shipControls.getSpaceship()).toBe(oldSpaceship);

            if (deserializedSpaceship === undefined) {
                throw new Error("Spaceship.Deserialize was not called");
            }
            const spaceship = await deserializedSpaceship;
            await resetPromise;

            expect(player.uuid).toBe(nextPlayer.uuid);
            expect(player.serializedSpaceships).toEqual([]);
            expect(player.instancedSpaceships).toEqual([spaceship]);
            expect(nextPlayer.serializedSpaceships).toEqual([nextSpaceshipSerialized]);
            expect(setSpaceshipSpy).toHaveBeenCalledWith(spaceship);
            expect(unregisterRegionSpy).toHaveBeenCalledWith(oldSpaceship);
            expect(registerRegionSpy).toHaveBeenCalledWith(spaceship);
            expect(oldSpaceshipDisposeSpy).toHaveBeenCalled();
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });

    it("keeps the current player when the replacement spaceship cannot be instantiated", async () => {
        const { view, scene, engine, player, universeBackend } = await createTestView();
        try {
            const nextPlayer = Player.Default(universeBackend);
            const currentSpaceshipSerialized = player.serializedSpaceships[0];
            const nextSpaceshipSerialized = nextPlayer.serializedSpaceships[0];
            if (currentSpaceshipSerialized === undefined || nextSpaceshipSerialized === undefined) {
                throw new Error("Default player has no spaceship");
            }

            const expectedError = new Error("Spaceship deserialization failed");
            vi.spyOn(Spaceship, "Deserialize").mockImplementation(() => {
                throw expectedError;
            });

            const resetPromise = view.resetPlayer(nextPlayer);
            const rejectionExpectation = expect(resetPromise).rejects.toBe(expectedError);

            expect(player.serializedSpaceships).toEqual([currentSpaceshipSerialized]);
            expect(nextPlayer.serializedSpaceships).toEqual([nextSpaceshipSerialized]);

            await rejectionExpectation;

            expect(player.serializedSpaceships).toEqual([currentSpaceshipSerialized]);
            expect(player.instancedSpaceships).toEqual([]);
            expect(nextPlayer.serializedSpaceships).toEqual([nextSpaceshipSerialized]);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });

    it("removes registered entity regions before disposing the system", async () => {
        const { view, scene, engine, assets } = await createTestView();
        try {
            const starSystem = await createBlackHoleStarSystem(scene, assets);
            view["starSystem"] = starSystem;

            const regionTransform = new TransformNode("node", scene);
            const oldRegion: ClusteredLightingRegion = {
                getTransform: () => regionTransform,
                getBoundingRadius: () => 1,
                getLights: () => [],
            };
            const registeredRegions = view["entityLightingRegions"];
            registeredRegions.add(oldRegion);

            const disposeSpy = vi.spyOn(starSystem, "dispose").mockImplementation(() => {});
            const unregisterRegionSpy = vi.spyOn(view["clusteredLightingSystem"], "unregisterRegion");
            const registerRegionSpy = vi.spyOn(view["clusteredLightingSystem"], "registerRegion");
            vi.spyOn(view.postProcessManager, "reset").mockImplementation(() => {});

            const newEntityTransform = new TransformNode("node", scene);
            const newEntity: SystemEntity = {
                model: {
                    id: "entity",
                    name: "Entity",
                    content: { type: "test-entity" },
                    placement: { type: "inFrame", parentId: blackHoleModel.id },
                },
                content: { getTransform: () => newEntityTransform, dispose: vi.fn() },
                placement: { type: "inFrame", getTransform: () => newEntityTransform },
            };
            vi.spyOn(starSystem, "getSystemEntities").mockReturnValue([newEntity]);

            const newRegion: ClusteredLightingRegion = {
                getTransform: () => newEntityTransform,
                getBoundingRadius: () => 1,
                getLights: () => [],
            };
            const lightingRegionsDispatchSpy = vi
                .spyOn(view["systemEntityProcessors"].lightingRegions, "dispatch")
                .mockImplementation(() => newRegion);

            vi.spyOn(StarSystemController, "CreateAsync").mockResolvedValue(ok(starSystem));

            const contentModel: StarSystemContentModel = { system: blackHoleSystemModel, entities: [] };
            await view.loadStarSystem(contentModel);

            expect(unregisterRegionSpy).toHaveBeenCalledTimes(1);
            expect(unregisterRegionSpy.mock.calls[0]?.[0]).toBe(oldRegion);
            expect(disposeSpy).toHaveBeenCalledOnce();
            expect(lightingRegionsDispatchSpy).toHaveBeenCalledExactlyOnceWith(newEntity);
            expect(registerRegionSpy.mock.calls[0]?.[0]).toBe(newRegion);
            expect(registeredRegions.size).toBe(1);
            expect([...registeredRegions][0]).toBe(newRegion);
            for (const order of unregisterRegionSpy.mock.invocationCallOrder) {
                expect(order).toBeLessThan(disposeSpy.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY);
            }
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });

    it.each([
        { label: "missing", gravity: null, expectedUp: Vector3.Up() },
        { label: "zero", gravity: Vector3.Zero(), expectedUp: Vector3.Up() },
        { label: "nonzero", gravity: new Vector3(3, -4, 0), expectedUp: new Vector3(-0.6, 0.8, 0) },
    ])("updates the character and lighting with $label gravity", async ({ gravity, expectedUp }) => {
        const { view, scene, engine, assets, physicsEngine, soundPlayer, tts, notificationManager, t } =
            await createTestView();
        try {
            const starSystem = await createBlackHoleStarSystem(scene, assets);
            view["starSystem"] = starSystem;

            const transform = MeshBuilder.CreateBox("character", { size: 1 }, scene);
            const skeleton = new Skeleton("characterSkeleton", "characterSkeletonId", scene);
            transform.skeleton = skeleton;
            const headBone = new Bone("head", skeleton);
            const headAttachment = MeshBuilder.CreateBox("headAttachment", { size: 0.1 }, scene);
            const animations: HumanoidAnimations = {
                idle: new AnimationGroup("idle", scene),
                walk: new AnimationGroup("walk", scene),
                walkBackward: new AnimationGroup("walkBackward", scene),
                dance: new AnimationGroup("dance", scene),
                run: new AnimationGroup("run", scene),
                swim: {
                    idle: new AnimationGroup("swimIdle", scene),
                    forward: new AnimationGroup("swimForward", scene),
                },
                jump: new AnimationGroup("jump", scene),
                fall: new AnimationGroup("fall", scene),
                skyDive: new AnimationGroup("skyDive", scene),
                sittingOnGroundIdle: new AnimationGroup("sittingOnGroundIdle", scene),
                sittingOnSeatIdle: new AnimationGroup("sittingOnSeatIdle", scene),
                sittingOnSeatToStandingIdle: new AnimationGroup("sittingOnSeatToStandingIdle", scene),
                standingIdleToSittingOnSeat: new AnimationGroup("standingIdleToSittingOnSeat", scene),
            };
            const humanoidInstance: HumanoidInstance = {
                root: transform,
                head: { bone: headBone, attachmentMesh: headAttachment },
                skeleton,
                animations,
            };
            const avatar = new HumanoidAvatar(humanoidInstance, physicsEngine, scene);
            const characterControls = new CharacterControls(avatar, scene);
            view["characterControls"] = characterControls;

            const spaceship = await createRealSpaceship(scene, assets, physicsEngine);
            view["spaceshipControls"] = new ShipControls(spaceship, scene, soundPlayer, tts, notificationManager, t);

            transform.rotationQuaternion = Quaternion.RotationAxis(Vector3.Up(), 0.7);
            transform.computeWorldMatrix(true);
            const previousForward = transform.forward.clone();
            const previousGravity = gravity?.clone();
            const camera = new FreeCamera("character camera", new Vector3(0, 1.5, 0), scene);
            camera.parent = transform;
            scene.activeCamera = camera;
            const activeControls = createTestControls(transform, camera);
            view["activeControls"] = activeControls;

            vi.spyOn(starSystem.gravitySystem, "getLastComputedForce").mockReturnValue(gravity);
            const starSystemUpdateSpy = vi.spyOn(starSystem, "update").mockImplementation(() => {});
            const expectedError = new Error("Stop after clustered lighting update");
            const lightingUpdateSpy = vi.spyOn(view["clusteredLightingSystem"], "update").mockImplementation(() => {
                throw expectedError;
            });

            expect(() => {
                view["updateBeforeRender"](1);
            }).toThrow(expectedError);
            transform.computeWorldMatrix(true);

            expect(transform.up.equalsWithEpsilon(expectedUp, 1e-6)).toBe(true);
            expect(Array.from(transform.getWorldMatrix().m).every(Number.isFinite)).toBe(true);
            expect(camera.globalPosition.asArray().every(Number.isFinite)).toBe(true);
            expect(gravity).toEqual(previousGravity ?? null);
            if (gravity === null || gravity.lengthSquared() === 0) {
                expect(transform.forward.equalsWithEpsilon(previousForward, 1e-6)).toBe(true);
            }
            expect(lightingUpdateSpy).toHaveBeenCalledWith(camera);
            expect(starSystemUpdateSpy.mock.invocationCallOrder[0]).toBeLessThan(
                lightingUpdateSpy.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
            );
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });
});

describe("entity save locations", () => {
    it("round-trips relative coordinates around a translated, rotating station", async () => {
        const { view, scene, engine, assets } = await createTestView({ useHighPrecisionMatrix: true });
        try {
            const starSystem = await createBlackHoleStarSystem(scene, assets);
            view["starSystem"] = starSystem;
            const stationTransform = new TransformNode("node", scene);
            stationTransform.position.set(1e9, 2e8, -3e8);
            stationTransform.rotationQuaternion = Quaternion.RotationYawPitchRoll(0.8, 0.3, -0.5);
            stationTransform.computeWorldMatrix(true);
            const object: SystemObject = {
                id: "station",
                name: "Station",
                getTransform: () => stationTransform,
                getBoundingRadius: () => 100,
            };
            vi.spyOn(starSystem, "getNearestSystemObject").mockReturnValue(object);
            vi.spyOn(starSystem, "getSystemObjectById").mockImplementation((id: string) =>
                id === object.id ? object : undefined,
            );
            const transform = new TransformNode("node", scene);
            transform.position.copyFrom(
                Vector3.TransformCoordinates(new Vector3(0, 0, 500), stationTransform.getWorldMatrix()),
            );
            transform.rotationQuaternion = Quaternion.RotationYawPitchRoll(0.4, 0.2, 0.7);
            transform.computeWorldMatrix(true);
            const position = transform.getAbsolutePosition().clone();
            const rotation = transform.absoluteRotationQuaternion.clone();
            const camera = new FreeCamera("controls camera", Vector3.Zero(), scene);
            view["activeControls"] = createTestControls(transform, camera);
            const setTargetSpy = vi.spyOn(view.targetingSystem, "setTarget");

            const location = view.getCurrentUniverseCoordinates(transform, null);
            expect(location.universeObjectId.idInSystem).toBe("station");
            transform.position.setAll(0);
            transform.rotationQuaternion = Quaternion.Identity();
            await view["loadRelativeLocation"](location);
            transform.computeWorldMatrix(true);
            expect(transform.getAbsolutePosition().equalsWithEpsilon(position, 1e-3)).toBe(true);
            expect(Math.abs(Quaternion.Dot(transform.absoluteRotationQuaternion, rotation))).toBeCloseTo(1);
            expect(setTargetSpy).toHaveBeenCalledWith(object);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });
    it.each([
        { offset: 0, expectedDistance: 500 },
        { offset: 0.00001, expectedDistance: 110 },
        { offset: 50, expectedDistance: 200 },
    ])(
        "recovers a relative spawn at distance $offset from a translated entity",
        async ({ offset, expectedDistance }) => {
            const { view, scene, engine, assets } = await createTestView({ useHighPrecisionMatrix: true });
            try {
                const starSystem = await createBlackHoleStarSystem(scene, assets);
                view["starSystem"] = starSystem;
                const station = new TransformNode("node", scene);
                station.position.set(1e9, 2e8, -3e8);
                station.rotationQuaternion = Quaternion.RotationYawPitchRoll(0.8, 0.3, -0.5);
                station.computeWorldMatrix(true);
                const playerTransform = new TransformNode("node", scene);
                const object: SystemObject = {
                    id: "station",
                    name: "Station",
                    getTransform: () => station,
                    getBoundingRadius: () => 100,
                };
                vi.spyOn(starSystem, "getSystemObjectById").mockReturnValue(object);
                const camera = new FreeCamera("controls camera", Vector3.Zero(), scene);
                view["activeControls"] = createTestControls(playerTransform, camera);
                vi.spyOn(view.targetingSystem, "setTarget");

                const location: RelativeCoordinates = {
                    type: "relative",
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
                    position: { x: 0, y: 0, z: offset },
                    rotation: { x: 0, y: 0, z: 0, w: 1 },
                };
                await view["loadRelativeLocation"](location);
                const worldOffset = playerTransform.getAbsolutePosition().subtract(station.getAbsolutePosition());
                expect(worldOffset.length()).toBeCloseTo(expectedDistance, 2);
                if (offset > 0) {
                    const direction = Vector3.TransformNormal(
                        new Vector3(0, 0, 1),
                        station.getWorldMatrix(),
                    ).normalize();
                    expect(Vector3.Dot(worldOffset.normalize(), direction)).toBeCloseTo(1);
                }
            } finally {
                scene.dispose();
                engine.dispose();
            }
        },
    );
});

describe("station save loading", () => {
    it.each(["relative", "atStation"] as const)(
        "loads a %s save whose old procedural station is missing",
        async (type) => {
            const { view, scene, engine, assets } = await createTestView();
            try {
                const starSystem = await createBlackHoleStarSystem(scene, assets);
                view["starSystem"] = starSystem;
                const stellarObjects = starSystem.getStellarObjects();
                const blackHole = stellarObjects[0];
                vi.spyOn(blackHole, "getBoundingRadius").mockReturnValue(100);
                const starTransform = blackHole.getTransform();
                starTransform.position.set(1000, 2000, 3000);
                starTransform.computeWorldMatrix(true);
                const playerTransform = new TransformNode("node", scene);
                const camera = new FreeCamera("controls camera", Vector3.Zero(), scene);
                view["activeControls"] = createTestControls(playerTransform, camera);
                vi.spyOn(starSystem, "getLandableFacilityById").mockReturnValue(undefined);
                vi.spyOn(starSystem, "getSystemObjectById").mockReturnValue(undefined);
                const alert = vi.spyOn(dialogModal, "alertModal").mockResolvedValue(undefined);
                const universeObjectId = {
                    systemCoordinates: {
                        starSectorX: 0,
                        starSectorY: 0,
                        starSectorZ: 0,
                        localX: 0,
                        localY: 0,
                        localZ: 0,
                    },
                    idInSystem: "[[[]->star0]->gasPlanet2]->spaceStation0",
                };
                if (type === "relative") {
                    const location: RelativeCoordinates = {
                        type,
                        universeObjectId,
                        position: { x: 0, y: 0, z: 5 },
                        rotation: { x: 0, y: 0, z: 0, w: 1 },
                    };
                    await view["loadRelativeLocation"](location);
                } else {
                    const location: AtStationCoordinates = { type, universeObjectId };
                    await view["loadAtStationLocation"](location);
                }
                playerTransform.computeWorldMatrix(true);
                expect(
                    Vector3.Distance(playerTransform.getAbsolutePosition(), starTransform.getAbsolutePosition()),
                ).toBeCloseTo(400, 2);
                expect(alert).toHaveBeenCalledOnce();
            } finally {
                scene.dispose();
                engine.dispose();
            }
        },
    );

    it("reserves the spawned pad and establishes its installation before spawning", async () => {
        const { view, scene, engine, assets, physicsEngine, soundPlayer, tts, notificationManager, t } =
            await createTestView();
        try {
            const starSystem = await createBlackHoleStarSystem(scene, assets);
            view["starSystem"] = starSystem;
            const transform = new TransformNode("node", scene);
            const pad: ILandingPad = {
                getTransform: () => transform,
                getBoundingRadius: () => 10,
                getIdentifier: () => "A",
                getPadSize: () => LandingPadSize.SMALL,
                getPadHeight: () => 1,
            };
            const provider = new LandingPadProvider([pad]);
            const station: LandableFacility = {
                id: "station",
                name: "Station",
                getTransform: () => transform,
                getBoundingRadius: () => 100,
                getLandingPadProvider: () => provider,
            };
            vi.spyOn(starSystem, "getLandableFacilityById").mockImplementation((id: string) =>
                id === station.id ? station : undefined,
            );
            const spaceship = await createRealSpaceship(scene, assets, physicsEngine);
            const shipControls = new ShipControls(spaceship, scene, soundPlayer, tts, notificationManager, t);
            view["spaceshipControls"] = shipControls;
            const spawnOnPadSpy = vi.spyOn(shipControls, "spawnOnPad").mockImplementation(() => {
                expect(provider.getAvailableLandingPads()).toHaveLength(0);
            });
            const syncCameraTransformSpy = vi.spyOn(shipControls, "syncCameraTransform").mockImplementation(() => {});
            const camera = new FreeCamera("controls camera", Vector3.Zero(), scene);
            view["activeControls"] = createTestControls(transform, camera);

            const location: AtStationCoordinates = {
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
            };
            await view["loadAtStationLocation"](location);
            expect(spawnOnPadSpy).toHaveBeenCalledExactlyOnceWith(station, pad);
            expect(syncCameraTransformSpy).toHaveBeenCalledOnce();
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });
});
