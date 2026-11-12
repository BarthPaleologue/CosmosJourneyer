import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Quaternion } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { err, ok } from "@cosmos-journeyer/typescript";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
    InOrbitPlacementModel,
    SystemContentModel,
    SystemEntityModel,
} from "@/backend/systemEntity/systemEntityModel";

import { ModuleAssets } from "@/frontend/assets/moduleAssets";
import type { RenderingAssets } from "@/frontend/assets/renderingAssets";
import { KeplerianOrbitalSimulation } from "@/frontend/universe/keplerianOrbitalSimulation";
import { makeTaskId } from "@/frontend/universe/planets/telluricPlanet/terrain/system/terrainSystem";

import { makeSystemContentType } from "./systemEntity";
import type { SystemContent, SystemContentFactoryOf } from "./systemEntity";
import { SystemEntityLoader } from "./systemEntityLoader";
import type { SystemEntityLoadContext } from "./systemEntityLoader";

type TestModel = SystemContentModel<"factory-test">;
const type = makeSystemContentType<TestModel, SystemContent>("factory-test");

describe("system entity content factories", () => {
    let engine: NullEngine;
    let scene: Scene;
    let loader: SystemEntityLoader;
    let context: SystemEntityLoadContext;
    const model: SystemEntityModel<TestModel, InOrbitPlacementModel> = {
        id: "entity-id",
        name: "Entity name",
        content: { type: "factory-test" },
        placement: {
            type: "inOrbit",
            mass: 1,
            orbit: {
                parentIds: [],
                semiMajorAxis: 0,
                eccentricity: 0,
                inclination: 0,
                longitudeOfAscendingNode: 0,
                argumentOfPeriapsis: 0,
                initialMeanAnomaly: 0,
                p: 2,
            },
            attitude: {
                spin: { axialTilt: 0, axisAzimuth: 0, siderealPeriod: 0, initialRotationAngle: 0 },
                localFrameOrientation: { yaw: 0.2, pitch: 0.3, roll: 0.4 },
            },
        },
    };
    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        loader = new SystemEntityLoader();
        const assets: RenderingAssets = {
            get materials(): RenderingAssets["materials"] {
                throw new Error("This factory does not use materials");
            },
            get textures(): RenderingAssets["textures"] {
                throw new Error("This factory does not use textures");
            },
            get objects(): RenderingAssets["objects"] {
                throw new Error("This factory does not use objects");
            },
        };
        context = {
            scene,
            assets,
            moduleAssets: new ModuleAssets([]),
            orbitalObjects: [],
            orbitalSimulation: new KeplerianOrbitalSimulation([]),
            terrainSystem: {
                requestChunk: vi.fn(),
                getChunkOutput: vi.fn(),
                requestHeights: vi.fn(() => makeTaskId("unused")),
                getHeightsOutput: vi.fn(),
                update: vi.fn(),
                reset: vi.fn(),
            },
        };
    });
    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("passes the complete model and shared resources before attaching content to its orbital placement", async () => {
        const transform = new TransformNode("content", scene);
        const content: SystemContent = {
            getTransform: () => transform,
            dispose: () => {
                transform.dispose();
            },
        };
        const factory = vi.fn<SystemContentFactoryOf<typeof type>>(() => ok(content));
        loader.registerFactory(type, factory);

        const result = await loader.load([model], context);

        expect(factory).toHaveBeenCalledExactlyOnceWith(model, context);
        expect(factory.mock.calls[0]?.[0]).toBe(model);
        expect(factory.mock.calls[0]?.[1].moduleAssets).toBe(context.moduleAssets);
        if (!result.success) {
            throw result.error;
        }
        expect(result.value).toHaveLength(1);
        const entity = result.value[0];
        if (entity === undefined) {
            throw new Error("Expected the loaded entity");
        }
        expect(entity.model).toBe(model);
        expect(entity.content).toBe(content);
        expect(transform.parent).toBe(entity.placement.getTransform());
        expect(transform.rotationQuaternion?.asArray()).toEqual(
            Quaternion.RotationYawPitchRoll(0.2, 0.3, 0.4).asArray(),
        );
        expect(context.orbitalSimulation.getObjects()).toContain(entity.placement);
    });

    it("propagates factory failures before creating orbital placements", async () => {
        const error = new Error("Content is unavailable");
        loader.registerFactory(type, () => err(error));
        const result = await loader.load([model], context);
        expect(result).toEqual(err(error));
        expect(context.orbitalSimulation.getObjects()).toHaveLength(0);
        expect(scene.transformNodes).toHaveLength(0);
    });
});
