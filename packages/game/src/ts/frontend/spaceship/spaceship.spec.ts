import "@babylonjs/core/Physics/physicsEngineComponent";

import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { NodeMaterial } from "@babylonjs/core/Materials/Node/nodeMaterial";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { PBRMetallicRoughnessMaterial } from "@babylonjs/core/Materials/PBR/pbrMetallicRoughnessMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { Scene } from "@babylonjs/core/scene";
import type { HavokPhysicsWithBindings } from "@babylonjs/havok";
import { meters, metersPerSecond } from "@cosmos-journeyer/physics";
import type { StarModel } from "@cosmos-journeyer/universe-model";
import { beforeAll, describe, expect, it, vi } from "vitest";

import type { SerializedComponent } from "@/backend/spaceship/serializedComponents/component";
import { getDefaultSerializedSpaceship } from "@/backend/spaceship/serializedSpaceship";
import { getSunModel } from "@/backend/universe/customSystems/sol/sun";

import type { Materials } from "@/frontend/assets/materials";
import { CrateMaterial } from "@/frontend/assets/materials/crate";
import { FoilMaterial } from "@/frontend/assets/materials/foil";
import type { Objects } from "@/frontend/assets/objects";
import type { RenderingAssets } from "@/frontend/assets/renderingAssets";
import type { Textures } from "@/frontend/assets/textures";
import { createTexturePools } from "@/frontend/assets/textures/texturePools";
import { SoundPlayerMock } from "@/frontend/audio/soundPlayer";
import { createHavokForTests } from "@/frontend/helpers/havokTest";
import { Star } from "@/frontend/universe/stellarObjects/star/star";
import type { SpaceObject } from "@/frontend/universe/systemObject";
import { TireMaterial } from "@/frontend/vehicle/tireMaterial";

import { getPhysicsEngineV2 } from "@/utils/physicsEngineV2";

import { canEngageWarpDrive } from "./components/warpDriveUtils";
import { Spaceship } from "./spaceship";

/**
 * Builds the texture bundle the spaceship and ringed stars need, leaving the groups they never read unimplemented.
 * @param scene Scene that owns the ring and noise textures and the pooled procedural textures.
 * @returns A fully typed texture bundle with real ring, noise, and LUT-pool entries.
 */
function createTestTextures(scene: Scene): Textures {
    const texture = new Texture(null, scene);
    return {
        get terrains(): Textures["terrains"] {
            throw new Error("Terrain textures are not used by this fixture");
        },
        get water(): Textures["water"] {
            throw new Error("Water textures are not used by this fixture");
        },
        get particles(): Textures["particles"] {
            throw new Error("Particle textures are not used by this fixture");
        },
        get materials(): Textures["materials"] {
            throw new Error("Material textures are not used by this fixture");
        },
        get gasPlanet(): Textures["gasPlanet"] {
            throw new Error("Gas planet textures are not used by this fixture");
        },
        rings: { saturn: texture, uranus: texture },
        get environment(): Textures["environment"] {
            throw new Error("Environment textures are not used by this fixture");
        },
        noises: { seamlessPerlin: texture },
        get ui(): Textures["ui"] {
            throw new Error("UI textures are not used by this fixture");
        },
        get empty(): Textures["empty"] {
            throw new Error("The empty texture is not used by this fixture");
        },
        pools: createTexturePools(scene),
    };
}

/**
 * Builds the rendering assets a spaceship needs, leaving the object groups the ship never reads unimplemented.
 * @param scene Scene that owns the created meshes and materials.
 * @param textures Texture bundle shared with the celestial bodies built in the same scene.
 * @returns A fully typed rendering-assets bundle with a real wanderer prefab.
 */
function createTestAssets(scene: Scene, textures: Textures): RenderingAssets {
    const wanderer = new Mesh("wanderer", scene);
    const frameTemplate = MeshBuilder.CreateBox("frame", {}, scene);
    frameTemplate.parent = wanderer;

    const texture = new Texture(null, scene);
    const shared = new PBRMaterial("sharedMaterial", scene);
    const common = { albedo: texture, normalHeight: texture, ambientOcclusion: texture };
    const materials: Materials = {
        foil: new FoilMaterial({ albedo: texture, normal: texture, roughness: texture }, scene),
        butterfly: shared,
        grass: shared,
        rock: shared,
        crate: new CrateMaterial({ ...common, metallicRoughness: texture }, scene),
        solarPanel: new NodeMaterial("solarPanel", scene),
        tree: new PBRMetallicRoughnessMaterial("tree", scene),
        tank: shared,
        landingPad: shared,
        metalSection: shared,
        tire: new TireMaterial({ ...common, roughness: texture }, scene),
        glass: shared,
    };
    const objects: Objects = {
        wanderer,
        get crate(): Objects["crate"] {
            throw new Error("The crate is not used by this fixture");
        },
        get grassBlades(): Objects["grassBlades"] {
            throw new Error("Grass blades are not used by this fixture");
        },
        get butterfly(): Objects["butterfly"] {
            throw new Error("The butterfly is not used by this fixture");
        },
        get banana(): Objects["banana"] {
            throw new Error("The banana is not used by this fixture");
        },
        get humanoids(): Objects["humanoids"] {
            throw new Error("Humanoids are not used by this fixture");
        },
        get rock(): Objects["rock"] {
            throw new Error("The rock is not used by this fixture");
        },
        get asteroids(): Objects["asteroids"] {
            throw new Error("Asteroids are not used by this fixture");
        },
        get tree(): Objects["tree"] {
            throw new Error("The tree is not used by this fixture");
        },
        get stationEngine(): Objects["stationEngine"] {
            throw new Error("The station engine is not used by this fixture");
        },
    };
    return { materials, textures, objects };
}

/**
 * Creates a real spaceship in a physics-enabled scene.
 * @param scene Scene that owns the ship and its physics aggregate.
 * @returns The new spaceship together with the physics engine backing its aggregate.
 */
async function createTestSpaceship(scene: Scene): Promise<Spaceship> {
    scene.enablePhysics(Vector3.Zero(), new HavokPlugin(true, havok));
    return await Spaceship.New(
        getDefaultSerializedSpaceship(),
        new Set<SerializedComponent>(),
        scene,
        createTestAssets(scene, createTestTextures(scene)),
        new SoundPlayerMock(),
        getPhysicsEngineV2(scene),
    );
}

/**
 * Builds a ringed star whose asteroid field reports the fixture's ring volume.
 * @param scene Scene that owns the star.
 * @param textures Texture bundle shared with the spaceship assets.
 * @param radius Bounding radius of the star in meters.
 * @returns A real star with a real asteroid field whose ring volume is pinned to the fixture geometry.
 */
function createRingedStar(scene: Scene, textures: Textures, radius: number): Star {
    const model: StarModel = {
        ...getSunModel(),
        radius: meters(radius),
        rings: { type: "textured", textureId: "saturn", innerRadius: meters(200), outerRadius: meters(300) },
    };
    const star = new Star(model, textures, scene);
    const asteroidField = star.asteroidField;
    if (asteroidField === null) {
        throw new Error("Expected the ringed star to have an asteroid field");
    }
    vi.spyOn(asteroidField, "getRingVolume").mockReturnValue({
        center: Vector3.Zero(),
        normal: Vector3.Up(),
        innerRadius: meters(200),
        outerRadius: meters(300),
        halfThickness: meters(10),
    });
    return star;
}

let havok: HavokPhysicsWithBindings;

describe("spaceship warp clearance with entity geometry and celestial rings", () => {
    beforeAll(async () => {
        havok = await createHavokForTests();
    });

    it.each([
        { height: 0, speed: 0, entityDistance: 50, allowed: false },
        { height: 30, speed: 200, entityDistance: 50, allowed: false },
        { height: 30, speed: 0, entityDistance: 50, allowed: true },
        { height: 30, speed: 0, entityDistance: 0, allowed: false },
    ])(
        "at height $height, speed $speed and entity distance $entityDistance allows warp=$allowed",
        async ({ height, speed, entityDistance, allowed }) => {
            const engine = new NullEngine();
            const scene = new Scene(engine);
            const ship = await createTestSpaceship(scene);
            const shipTransform = ship.getTransform();
            shipTransform.position.set(250, height, 0);
            shipTransform.rotationQuaternion = Quaternion.RotationAxis(Vector3.Right(), Math.PI / 2);
            shipTransform.computeWorldMatrix(true);
            const entity = new TransformNode("entity", scene);
            entity.position.copyFrom(shipTransform.position).x -= entityDistance;
            const nearestObject: SpaceObject = {
                kind: "systemObject",
                object: {
                    id: "entity",
                    name: "Entity",
                    getTransform: () => entity,
                    getBoundingRadius: () => meters(10),
                },
            };
            const textures = createTestTextures(scene);
            const ringedStar = createRingedStar(scene, textures, 100);
            vi.spyOn(ship.getAltimeter(), "getAltitude").mockReturnValue(null);
            ship.setNearestObject(nearestObject);
            ship.setNearestCelestialBody(ringedStar);
            try {
                expect(
                    canEngageWarpDrive(
                        shipTransform,
                        ship.getAltimeter().getAltitude(),
                        metersPerSecond(speed),
                        nearestObject,
                    ),
                ).toBe(entityDistance > 0);
                expect(ship.canEngageWarpDrive(metersPerSecond(speed))).toBe(allowed);
            } finally {
                scene.dispose();
                engine.dispose();
            }
        },
    );
    it.each([
        { altitude: 1000, planetDistance: 7_200_000, allowed: true },
        { altitude: 20, planetDistance: 7_200_000, allowed: false },
        { altitude: 1000, planetDistance: 6_100_000, allowed: false },
    ])(
        "with station altitude $altitude and planet distance $planetDistance allows warp=$allowed",
        async ({ altitude, planetDistance, allowed }) => {
            const engine = new NullEngine();
            const scene = new Scene(engine);
            const ship = await createTestSpaceship(scene);
            const shipTransform = ship.getTransform();
            shipTransform.position.z = planetDistance;
            shipTransform.computeWorldMatrix(true);
            const station = new TransformNode("station", scene);
            station.position.z = planetDistance - 2000;
            const nearestObject: SpaceObject = {
                kind: "systemObject",
                object: {
                    id: "station",
                    name: "Station",
                    getTransform: () => station,
                    getBoundingRadius: () => meters(1000),
                },
            };
            const textures = createTestTextures(scene);
            const planet = new Star({ ...getSunModel(), radius: meters(6_000_000), rings: null }, textures, scene);
            vi.spyOn(ship.getAltimeter(), "getAltitude").mockReturnValue(meters(altitude));
            ship.setNearestObject(nearestObject);
            ship.setNearestCelestialBody(planet);
            try {
                expect(ship.canEngageWarpDrive(metersPerSecond(0))).toBe(allowed);
            } finally {
                scene.dispose();
                engine.dispose();
            }
        },
    );
});
