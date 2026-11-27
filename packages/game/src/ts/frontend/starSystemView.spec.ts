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

import "@babylonjs/core/Culling/ray";
import "@babylonjs/core/Physics/physicsEngineComponent";

import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import { Bone } from "@babylonjs/core/Bones/bone";
import { Skeleton } from "@babylonjs/core/Bones/skeleton";
import { NullEngine, NullEngineOptions } from "@babylonjs/core/Engines/nullEngine";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { InternalTexture, InternalTextureSource } from "@babylonjs/core/Materials/Textures/internalTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsShapeConvexHull } from "@babylonjs/core/Physics/v2/physicsShape";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { Scene } from "@babylonjs/core/scene";
import type { HavokPhysicsWithBindings } from "@babylonjs/havok";
import { ok } from "@cosmos-journeyer/typescript";
import type { BlackHoleModel, StarSystemModel } from "@cosmos-journeyer/universe-model";
import { createInstance } from "i18next";
import { afterEach, beforeAll, describe, expect, it, onTestFinished, vi } from "vitest";

import { EncyclopaediaGalacticaManager } from "@/backend/encyclopaedia/encyclopaediaGalacticaManager";
import type { AtStationCoordinates, RelativeCoordinates } from "@/backend/save/universeCoordinates";
import { SystemEntityBackend } from "@/backend/systemEntity/systemEntityBackend";
import type { SystemContentModel, SystemEntityModel } from "@/backend/systemEntity/systemEntityModel";
import type { StarSystemContentModel } from "@/backend/universe/universeBackend";
import { UniverseBackend } from "@/backend/universe/universeBackend";

import { LoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import type { Materials } from "@/frontend/assets/materials";
import { ModuleAssets } from "@/frontend/assets/moduleAssets";
import type { Objects } from "@/frontend/assets/objects";
import type { HumanoidAnimations, HumanoidInstance } from "@/frontend/assets/objects/humanoids";
import type { RenderingAssets } from "@/frontend/assets/renderingAssets";
import type { Textures } from "@/frontend/assets/textures";
import { createTexturePools } from "@/frontend/assets/textures/texturePools";
import type { ISoundPlayer } from "@/frontend/audio/soundPlayer";
import { SoundPlayerMock } from "@/frontend/audio/soundPlayer";
import type { ITts } from "@/frontend/audio/tts";
import { createHavokForTests } from "@/frontend/helpers/havokTest";
import { Player } from "@/frontend/player/player";
import { Spaceship } from "@/frontend/spaceship/spaceship";
import { makeSystemContentType } from "@/frontend/systemEntity/systemEntity";
import type { SystemContent } from "@/frontend/systemEntity/systemEntity";
import { SystemEntityLoader } from "@/frontend/systemEntity/systemEntityLoader";
import { SystemEntityProcessors } from "@/frontend/systemEntity/systemEntityProcessors";
import type { Target } from "@/frontend/targeting/target";
import type { INotificationManager } from "@/frontend/ui/notificationManager";
import { LandingPadProvider, LandingPadSize } from "@/frontend/universe/orbitalFacility/landingPadProvider";
import type { ILandingPad } from "@/frontend/universe/orbitalFacility/landingPadProvider";
import type { ITerrainSystem } from "@/frontend/universe/planets/telluricPlanet/terrain/system/terrainSystem";
import { makeTaskId } from "@/frontend/universe/planets/telluricPlanet/terrain/system/terrainSystem";
import type { StarSystemController } from "@/frontend/universe/starSystemController";

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
    const thruster = MeshBuilder.CreateBox("mainThruster", { size: 0.2 }, scene);
    thruster.parent = frame;
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
            placeholder: { spawn: () => ok(createTestHumanoid(scene)) },
            astronaut: { spawn: () => ok(createTestHumanoid(scene)) },
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
        pools: createTexturePools(scene),
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
 * @param scene Scene that owns the mesh, skeleton and animations.
 * @returns An astronaut model that can be spawned without loading assets.
 */
function createTestHumanoid(scene: Scene): HumanoidInstance {
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
    return {
        root: transform,
        head: { bone: headBone, attachmentMesh: headAttachment },
        skeleton,
        animations,
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

type TestViewContext = {
    view: StarSystemView;
    scene: Scene;
    engine: NullEngine;
    player: Player;
    universeBackend: UniverseBackend;
    entityLoader: SystemEntityLoader;
    entityProcessors: SystemEntityProcessors;
};

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
    engine.loadingScreen = {
        displayLoadingUI: vi.fn(),
        hideLoadingUI: vi.fn(),
        loadingUIBackgroundColor: "",
        loadingUIText: "",
    };
    const exitPointerLock = Object.getOwnPropertyDescriptor(document, "exitPointerLock");
    Object.defineProperty(document, "exitPointerLock", { configurable: true, value: vi.fn() });
    engine._webGLVersion = 2;

    const caps = engine.getCaps();
    caps.texelFetch = true;
    caps.colorBufferFloat = true;
    caps.blendFloat = true;
    const scene = new Scene(engine);
    onTestFinished(() => {
        scene.dispose();
        engine.dispose();
        if (exitPointerLock === undefined) {
            Reflect.deleteProperty(document, "exitPointerLock");
        } else {
            Object.defineProperty(document, "exitPointerLock", exitPointerLock);
        }
    });
    scene.enablePhysics(Vector3.Zero(), new HavokPlugin(true, havok));
    const physicsEngine = getPhysicsEngineV2(scene);
    const universeBackend = new UniverseBackend(new SystemEntityBackend());
    const player = Player.Default(universeBackend);
    const i18n = createInstance();
    await i18n.init({ lng: "en-US", resources: {} });
    const t = i18n.getFixedT("en-US");
    const soundPlayer: ISoundPlayer = new SoundPlayerMock();
    const tts: ITts = { sayNow: vi.fn(), enqueueSay: vi.fn(), update: vi.fn() };
    const notificationManager: INotificationManager = {
        update: vi.fn(),
        create: vi.fn(),
        setVisible: vi.fn(),
    };
    const terrainSystem = createTestTerrainSystem();
    const assets = createTestAssets(scene);
    const entityLoader = new SystemEntityLoader();
    const entityProcessors = new SystemEntityProcessors();
    const view = new StarSystemView(
        scene,
        player,
        engine,
        physicsEngine,
        new EncyclopaediaGalacticaManager(),
        universeBackend,
        entityLoader,
        entityProcessors,
        soundPlayer,
        tts,
        notificationManager,
        assets,
        new ModuleAssets([]),
        terrainSystem,
        t,
        new LoadingProgressMonitor(),
    );
    return { view, scene, engine, player, universeBackend, entityLoader, entityProcessors };
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

const stationType = makeSystemContentType<SystemContentModel<"test-station">, SystemContent>("test-station");
const stationModel: SystemEntityModel<SystemContentModel<"test-station">> = {
    id: "station",
    name: "Station",
    content: { type: "test-station" },
    placement: { type: "inFrame", parentId: blackHoleModel.id },
};
const stationId = { idInSystem: stationModel.id, systemCoordinates: blackHoleSystemModel.coordinates };

/**
 * @param context View and module registries used to load the station.
 * @returns The station transform owned by the loaded system.
 */
function registerStation(context: TestViewContext): TransformNode {
    const { scene, entityLoader, entityProcessors } = context;
    const transform = new TransformNode("station", scene);
    entityLoader.registerFactory(stationType, () =>
        ok({
            getTransform: () => transform,
            dispose: () => {
                transform.dispose();
            },
        }),
    );
    entityProcessors.spatialGeometry.register(stationType, (entity) => ({
        getTransform: () => entity.content.getTransform(),
        getBoundingRadius: () => 100,
    }));
    entityProcessors.targeting.register(stationType, (entity): Array<Target> => [
        {
            type: "spaceStation",
            getTransform: () => entity.content.getTransform(),
            getBoundingRadius: () => 100,
        },
    ]);
    return transform;
}

/**
 * @param view View whose next system is loaded and initialized.
 * @param content The stellar model and module entities to load.
 * @returns The initialized system.
 */
async function enterSystem(view: StarSystemView, content: StarSystemContentModel): Promise<StarSystemController> {
    const result = await view.loadStarSystem(content);
    if (!result.success) {
        throw result.error;
    }
    view.initStarSystem(0);
    return result.value;
}

const emptySystem: StarSystemContentModel = { system: blackHoleSystemModel, entities: [] };
const stationSystem: StarSystemContentModel = { system: blackHoleSystemModel, entities: [stationModel] };

it("uses the outer accretion disk radius for the black hole lens flare", async () => {
    const { view, engine, player } = await createTestView();
    const accretionDiskRadius = 12_000;
    engine._features.supportCSM = true;
    vi.spyOn(engine, "createDepthStencilTexture").mockImplementation(
        () => new InternalTexture(engine, InternalTextureSource.Depth),
    );
    await view.resetPlayer(player);
    const system = await enterSystem(view, {
        system: { ...blackHoleSystemModel, stellarObjects: [{ ...blackHoleModel, accretionDiskRadius }] },
        entities: [],
    });

    const [blackHole] = system.getStellarObjects();
    const sources = system.stellarLightSystem.getLensFlareSources();
    expect(sources).toHaveLength(1);
    const [source] = sources;
    expect(source?.transform.uniqueId).toBe(blackHole.getTransform().uniqueId);
    expect(source?.boundingRadius).toBe(accretionDiskRadius);
});

describe("player replacement", () => {
    it.each(["success", "failure"] as const)(
        "keeps the current player until loading completes (%s)",
        async (outcome) => {
            const { view, scene, player, universeBackend } = await createTestView();
            await view.resetPlayer(player);
            const currentUuid = player.uuid;
            const oldShip = view.getSpaceshipControls().getSpaceship();
            const nextPlayer = Player.Default(universeBackend);
            const nextSave = [...nextPlayer.serializedSpaceships];

            const deserialize = Spaceship.Deserialize.bind(Spaceship);
            const load = Promise.withResolvers<undefined>();
            vi.spyOn(Spaceship, "Deserialize").mockImplementationOnce(async (...args) => {
                await load.promise;
                return deserialize(...args);
            });

            const reset = view.resetPlayer(nextPlayer);
            expect(player.uuid).toBe(currentUuid);
            expect(player.instancedSpaceships).toEqual([oldShip]);
            expect(view.getSpaceshipControls().getSpaceship()).toBe(oldShip);
            expect(oldShip.getTransform().isDisposed()).toBe(false);

            if (outcome === "success") {
                load.resolve(undefined);
                await reset;

                const newShip = view.getSpaceshipControls().getSpaceship();
                expect(newShip).not.toBe(oldShip);
                expect(player.uuid).toBe(nextPlayer.uuid);
                expect(player.instancedSpaceships).toEqual([newShip]);
                expect(player.serializedSpaceships).toEqual([]);
                expect(oldShip.getTransform().isDisposed()).toBe(true);
                expect(scene.activeCamera).toBe(view.getSpaceshipControls().getActiveCamera());
            } else {
                const error = new Error("Spaceship deserialization failed");
                load.reject(error);
                await expect(reset).rejects.toBe(error);

                expect(player.uuid).toBe(currentUuid);
                expect(player.instancedSpaceships).toEqual([oldShip]);
                expect(view.getSpaceshipControls().getSpaceship()).toBe(oldShip);
                expect(oldShip.getTransform().isDisposed()).toBe(false);
            }

            expect(nextPlayer.serializedSpaceships).toEqual(nextSave);
        },
    );
});

it("releases the old ship's lights on replacement and lights the new ship", async () => {
    const { view, player, universeBackend } = await createTestView();
    await view.resetPlayer(player);
    await enterSystem(view, emptySystem);

    const originalControls = view.getSpaceshipControls();
    originalControls.getTransform().setAbsolutePosition(Vector3.Zero());
    originalControls.syncCameraTransform();
    view.render();

    const originalLights = originalControls.getSpaceship().getLights();
    expect(originalLights.length).toBeGreaterThan(0);
    expect(originalLights.every((light) => light.isEnabled())).toBe(true);
    const wasEnabledAtDisposal = vi.fn<(enabled: boolean) => void>();
    for (const light of originalLights) {
        light.onDisposeObservable.add(() => {
            wasEnabledAtDisposal(light.isEnabled(false));
        });
    }

    await view.resetPlayer(Player.Default(universeBackend));

    expect(wasEnabledAtDisposal.mock.calls).toEqual(originalLights.map(() => [false]));
    const newShipLights = view.getSpaceshipControls().getSpaceship().getLights();
    expect(newShipLights.length).toBeGreaterThan(0);
    expect(newShipLights.every((light) => !light.isEnabled())).toBe(true);
    view.render();
    expect(newShipLights.every((light) => light.isEnabled())).toBe(true);
});

it("lights a station as it moves into range and deactivates it before disposal", async () => {
    const context = await createTestView();
    const { view, scene, player, entityProcessors } = context;
    const station = registerStation(context);
    const light = new PointLight("station light", Vector3.Zero(), scene);
    light.parent = station;
    entityProcessors.lightingRegions.register(stationType, () => ({
        getTransform: () => station,
        getBoundingRadius: () => 100,
        getLights: () => [light],
    }));
    entityProcessors.registerUpdate(stationType, (entity, { observerPosition }) => {
        const transform = entity.content.getTransform();
        transform.setAbsolutePosition(observerPosition);
        transform.computeWorldMatrix(true);
    });

    await view.resetPlayer(player);
    await enterSystem(view, stationSystem);
    const controls = view.getSpaceshipControls();
    controls.getTransform().setAbsolutePosition(Vector3.Zero());
    controls.syncCameraTransform();
    station.position.set(0, 0, 1e6);
    expect(light.isEnabled()).toBe(false);

    view.render();
    expect(light.isEnabled()).toBe(true);

    const wasEnabledAtDisposal = vi.fn(() => light.isEnabled(false));
    station.onDisposeObservable.add(wasEnabledAtDisposal);
    await enterSystem(view, emptySystem);

    expect(station.isDisposed()).toBe(true);
    expect(wasEnabledAtDisposal).toHaveReturnedWith(false);
    view.render();
});

it.each([
    { label: "missing", gravity: null, expectedUp: Vector3.Up() },
    { label: "zero", gravity: Vector3.Zero(), expectedUp: Vector3.Up() },
    { label: "nonzero", gravity: new Vector3(3, -4, 0), expectedUp: new Vector3(-0.6, 0.8, 0) },
])("keeps the character and camera aligned with $label gravity", async ({ gravity, expectedUp }) => {
    const { view, scene, player } = await createTestView();
    await view.resetPlayer(player);
    const system = await enterSystem(view, emptySystem);
    await view.switchToCharacterControls();
    const character = view.getCharacterControls();
    const transform = character.getTransform();
    transform.rotationQuaternion = Quaternion.RotationAxis(Vector3.Up(), 0.7);
    transform.computeWorldMatrix(true);
    const previousForward = transform.forward.clone();
    const previousGravity = gravity?.clone();
    vi.spyOn(system.gravitySystem, "getLastComputedForce").mockReturnValue(gravity);

    view.render();

    expect(Vector3.Distance(transform.up, expectedUp)).toBeLessThan(1e-6);
    const camera = character.getActiveCamera();
    expect(scene.activeCamera).toBe(camera);
    expect(camera.globalPosition.asArray().every(Number.isFinite)).toBe(true);
    expect(gravity).toEqual(previousGravity ?? null);
    if (gravity === null || gravity.lengthSquared() === 0) {
        expect(transform.forward.equalsWithEpsilon(previousForward, 1e-6)).toBe(true);
    }
});

describe("entity save locations", () => {
    it("round-trips relative coordinates around a translated, rotating station", async () => {
        const context = await createTestView({ useHighPrecisionMatrix: true });
        const { view, player } = context;
        const station = registerStation(context);
        await view.resetPlayer(player);
        await enterSystem(view, stationSystem);

        station.position.set(1e9, 2e8, -3e8);
        station.rotationQuaternion = Quaternion.RotationYawPitchRoll(0.8, 0.3, -0.5);
        station.computeWorldMatrix(true);
        const transform = view.getSpaceshipControls().getTransform();
        const position = Vector3.TransformCoordinates(new Vector3(0, 0, 500), station.getWorldMatrix());
        const localRotation = Quaternion.RotationYawPitchRoll(0.4, 0.2, 0.7);
        const rotation = localRotation.multiply(station.absoluteRotationQuaternion);
        transform.setAbsolutePosition(position);
        transform.rotationQuaternion = rotation.clone();
        transform.computeWorldMatrix(true);

        const location = view.getCurrentUniverseCoordinates(transform, null);
        expect(location.universeObjectId).toEqual(stationId);
        expect(location.position.x).toBeCloseTo(0, 3);
        expect(location.position.y).toBeCloseTo(0, 3);
        expect(location.position.z).toBeCloseTo(500, 3);
        const savedRotation = new Quaternion(
            location.rotation.x,
            location.rotation.y,
            location.rotation.z,
            location.rotation.w,
        );
        expect(Math.abs(Quaternion.Dot(savedRotation, localRotation))).toBeCloseTo(1, 6);

        transform.setAbsolutePosition(Vector3.Zero());
        transform.rotationQuaternion = Quaternion.Identity();
        await view.loadLocation(location);

        transform.computeWorldMatrix(true);
        expect(transform.getAbsolutePosition().equalsWithEpsilon(position, 1e-3)).toBe(true);
        expect(Math.abs(Quaternion.Dot(transform.absoluteRotationQuaternion, rotation))).toBeCloseTo(1, 6);
        expect(view.targetingSystem.getTarget()?.getTransform().uniqueId).toBe(station.uniqueId);
    });

    it.each([
        { offset: 0, expectedDistance: 500 },
        { offset: 0.00001, expectedDistance: 110 },
        { offset: 50, expectedDistance: 200 },
    ])("recovers a relative spawn at distance $offset from a station", async ({ offset, expectedDistance }) => {
        const context = await createTestView({ useHighPrecisionMatrix: true });
        const { view, player } = context;
        const station = registerStation(context);
        await view.resetPlayer(player);
        await enterSystem(view, stationSystem);
        station.position.set(1e9, 2e8, -3e8);
        station.rotationQuaternion = Quaternion.RotationYawPitchRoll(0.8, 0.3, -0.5);
        station.computeWorldMatrix(true);

        const location: RelativeCoordinates = {
            type: "relative",
            universeObjectId: stationId,
            position: { x: 0, y: 0, z: offset },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
        };
        await view.loadLocation(location);

        const ship = view.getSpaceshipControls().getTransform();
        const worldOffset = ship.getAbsolutePosition().subtract(station.getAbsolutePosition());
        const direction = offset === 0 ? Vector3.Forward() : station.forward.normalize();
        expect(worldOffset.length()).toBeCloseTo(expectedDistance, 2);
        expect(Vector3.Dot(worldOffset.normalize(), direction)).toBeCloseTo(1, 6);
    });
});

describe("station save loading", () => {
    const missingStationId = { ...stationId, idInSystem: "[[[]->star0]->gasPlanet2]->spaceStation0" };
    const relativeSave: RelativeCoordinates = {
        type: "relative",
        universeObjectId: missingStationId,
        position: { x: 0, y: 0, z: 5 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
    };
    const stationSave: AtStationCoordinates = { type: "atStation", universeObjectId: missingStationId };

    it.each([relativeSave, stationSave])("loads a $type save whose station is missing", async (location) => {
        const { view, player } = await createTestView();
        await view.resetPlayer(player);
        const system = await enterSystem(view, emptySystem);
        const [blackHole] = system.getStellarObjects();
        const starTransform = blackHole.getTransform();
        starTransform.position.set(1000, 2000, 3000);
        starTransform.computeWorldMatrix(true);
        const alert = vi.spyOn(dialogModal, "alertModal").mockResolvedValue(undefined);

        await view.loadLocation(location);

        const playerPosition = view.getSpaceshipControls().getTransform().getAbsolutePosition();
        const distance = Vector3.Distance(playerPosition, starTransform.getAbsolutePosition());
        expect(distance / blackHole.getBoundingRadius()).toBeCloseTo(4, 4);
        expect(alert).toHaveBeenCalledOnce();
    });

    it("restores a landed ship on a reserved pad and keeps the camera with the ship", async () => {
        const context = await createTestView();
        const { view, scene, player, entityProcessors } = context;
        const station = registerStation(context);
        const padTransform = new TransformNode("pad", scene);
        padTransform.parent = station;
        padTransform.position.set(20, 30, 40);
        const pad: ILandingPad = {
            getTransform: () => padTransform,
            getBoundingRadius: () => 10,
            getIdentifier: () => "A",
            getPadSize: () => LandingPadSize.SMALL,
            getPadHeight: () => 1,
        };
        const provider = new LandingPadProvider([pad]);
        entityProcessors.landingPadProviders.register(stationType, () => provider);
        await view.resetPlayer(player);
        await enterSystem(view, stationSystem);
        station.position.set(2000, 3000, 4000);
        station.computeWorldMatrix(true);

        const controls = view.getSpaceshipControls();
        const ship = controls.getSpaceship();
        const landing = vi.fn(() => ({
            station: controls.getLandingFacility()?.id,
            availablePads: provider.getAvailableLandingPads(),
        }));
        ship.onLandingObservable.add(landing);

        await view.loadLocation({ type: "atStation", universeObjectId: stationId });

        expect(landing).toHaveReturnedWith({ station: stationId.idInSystem, availablePads: [] });
        expect(ship.isLandedAtFacility()).toBe(true);
        expect(ship.getTargetLandingPad()).toBe(pad);
        const altitude = (pad.getPadHeight() + ship.boundingExtent.y) / 2;
        const expectedPosition = padTransform.getAbsolutePosition().add(new Vector3(0, altitude, 0));
        expect(Vector3.Distance(ship.getTransform().getAbsolutePosition(), expectedPosition)).toBeLessThan(1e-3);
        expect(provider.getAvailableLandingPads()).toEqual([]);
        const cameraPosition = controls.getActiveCamera().getWorldMatrix().getTranslation();
        expect(Vector3.Distance(cameraPosition, ship.getTransform().getAbsolutePosition())).toBeLessThan(100);

        controls.takeOff();
        expect(provider.getAvailableLandingPads()).toEqual([pad]);
    });
});
