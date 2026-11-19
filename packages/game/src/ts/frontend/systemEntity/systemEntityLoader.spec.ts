import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
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
import { CustomOrbitalObject } from "@/frontend/universe/customOrbitalObject";
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
                plane: {
                    inclination: 0,
                    longitudeOfAscendingNode: 0,
                },
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

    it("follows the parent's translating and rotating frame while preserving local content transforms", async () => {
        const parentTransform = new TransformNode("parent", scene);
        const parent = new CustomOrbitalObject(parentTransform, {
            type: "custom",
            id: "parent",
            name: "Parent",
            mass: 1,
            orbit: model.placement.orbit,
            spin: model.placement.attitude.spin,
        });
        const transform = new TransformNode("content", scene);
        transform.position.set(1, 2, 3);
        const localRotation = Quaternion.RotationAxis(Vector3.UpReadOnly, 0.3);
        transform.rotationQuaternion = localRotation.clone();
        loader.registerFactory(type, () =>
            ok({
                getTransform: () => transform,
                dispose: () => {
                    transform.dispose();
                },
            }),
        );
        const result = await loader.load([{ ...model, placement: { type: "inFrame", parentId: "parent" } }], {
            ...context,
            orbitalObjects: [parent],
        });
        if (!result.success) {
            throw result.error;
        }
        const entity = result.value[0];
        if (entity === undefined) {
            throw new Error("Expected the loaded entity");
        }
        const placement = entity.placement.getTransform();
        expect(placement).not.toBe(parentTransform);
        expect(placement.parent).toBe(parentTransform);
        expect(transform.parent).toBe(placement);
        expect(transform.rotationQuaternion.asArray()).toEqual(localRotation.asArray());
        expect(Array.from(context.orbitalSimulation.getObjects())).toHaveLength(0);

        parentTransform.position.set(10, 20, 30);
        parentTransform.rotationQuaternion = Quaternion.RotationAxis(Vector3.UpReadOnly, Math.PI / 2);
        parentTransform.computeWorldMatrix(true);
        placement.computeWorldMatrix(true);
        transform.computeWorldMatrix(true);
        const expectedPosition = Vector3.TransformCoordinates(new Vector3(1, 2, 3), parentTransform.getWorldMatrix());
        expect(transform.getAbsolutePosition().equalsWithEpsilon(expectedPosition)).toBe(true);
        const localForward = Vector3.Forward().applyRotationQuaternion(localRotation);
        const expectedForward = Vector3.TransformNormal(localForward, parentTransform.getWorldMatrix());
        expect(transform.getDirection(Vector3.Forward()).equalsWithEpsilon(expectedForward)).toBe(true);

        entity.content.dispose();
        placement.dispose();
        expect(parentTransform.isDisposed()).toBe(false);
    });

    it("rejects a missing frame parent before creating content or placements", async () => {
        const factory = vi.fn<SystemContentFactoryOf<typeof type>>();
        loader.registerFactory(type, factory);
        const result = await loader.load([{ ...model, placement: { type: "inFrame", parentId: "missing" } }], context);
        expect(result.success).toBe(false);
        expect(factory).not.toHaveBeenCalled();
        expect(scene.transformNodes).toHaveLength(0);
        expect(Array.from(context.orbitalSimulation.getObjects())).toHaveLength(0);
    });

    it("preserves input order across placement types", async () => {
        const parent = new CustomOrbitalObject(new TransformNode("parent", scene), {
            type: "custom",
            id: "parent",
            name: "Parent",
            mass: 1,
            orbit: model.placement.orbit,
            spin: model.placement.attitude.spin,
        });
        const models: Array<SystemEntityModel<TestModel>> = [
            { ...model, id: "frame-first", placement: { type: "inFrame", parentId: "parent" } },
            { ...model, id: "orbit" },
            { ...model, id: "frame-last", placement: { type: "inFrame", parentId: "parent" } },
        ];
        loader.registerFactory(type, (entityModel) => {
            const transform = new TransformNode(entityModel.id, scene);
            return ok({
                getTransform: () => transform,
                dispose: () => {
                    transform.dispose();
                },
            });
        });
        const result = await loader.load(models, { ...context, orbitalObjects: [parent] });
        if (!result.success) {
            throw result.error;
        }
        expect(result.value.map((entity) => entity.model.id)).toEqual(models.map((entityModel) => entityModel.id));
        expect(Array.from(context.orbitalSimulation.getObjects()).map((object) => object.id)).toEqual(["orbit"]);
    });

    it("disposes previously created content when a later factory fails", async () => {
        const error = new Error("Second content is unavailable");
        const dispose = vi.fn();
        loader.registerFactory(type, (entityModel) => {
            if (entityModel.id === "second") {
                return err(error);
            }
            const transform = new TransformNode("content", scene);
            dispose.mockImplementation(() => {
                transform.dispose();
            });
            return ok({ getTransform: () => transform, dispose });
        });
        const result = await loader.load([model, { ...model, id: "second" }], context);
        expect(result).toEqual(err(error));
        expect(dispose).toHaveBeenCalledExactlyOnceWith();
        expect(scene.transformNodes).toHaveLength(0);
        expect(Array.from(context.orbitalSimulation.getObjects())).toHaveLength(0);
    });

    it("cleans content without registering orbits when a surface placement fails", async () => {
        const disposals: Array<ReturnType<typeof vi.fn>> = [];
        loader.registerFactory(type, (entityModel) => {
            const transform = new TransformNode(entityModel.id, scene);
            const dispose = vi.fn(() => {
                transform.dispose();
            });
            disposals.push(dispose);
            return ok({ getTransform: () => transform, dispose });
        });
        const result = await loader.load(
            [
                model,
                {
                    ...model,
                    id: "surface",
                    placement: {
                        type: "onSurface",
                        parentId: "missing",
                        position: { latitude: 0, longitude: 0, heightAboveGround: 0 },
                        rotation: { heading: 0, pitch: 0, roll: 0 },
                    },
                },
            ],
            context,
        );
        expect(result.success).toBe(false);
        expect(disposals).toHaveLength(2);
        for (const dispose of disposals) {
            expect(dispose).toHaveBeenCalledExactlyOnceWith();
        }
        expect(scene.transformNodes).toHaveLength(0);
        expect(Array.from(context.orbitalSimulation.getObjects())).toHaveLength(0);
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
