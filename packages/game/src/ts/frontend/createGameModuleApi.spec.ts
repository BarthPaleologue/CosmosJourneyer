import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { SystemEntityBackend } from "@/backend/systemEntity/systemEntityBackend";
import type { SystemContentModel } from "@/backend/systemEntity/systemEntityModel";
import { UniverseBackend } from "@/backend/universe/universeBackend";

import type { GameModuleApi } from "@/modules/gameModuleApi";
import { MonolithModule } from "@/modules/monolith";
import { Monolith } from "@/modules/monolith/entity";
import { getVestaModel } from "@/modules/vesta/vesta";

import { ModuleAssetRegistry } from "./assets/moduleAssetRegistry";
import { createGameModuleApi } from "./createGameModuleApi";
import type { ClusteredLightingRegion } from "./helpers/clusteredLightingSystem";
import { makeSystemContentType } from "./systemEntity/systemEntity";
import type { SystemContent, SystemEntity } from "./systemEntity/systemEntity";
import { SystemEntityLoader } from "./systemEntity/systemEntityLoader";
import { SystemEntityProcessors } from "./systemEntity/systemEntityProcessors";
import { getSystemTargets } from "./targeting/createTargets";
import { TargetType } from "./targeting/target";
import type { ILandingPad } from "./universe/orbitalFacility/landingPadProvider";
import { LandingPadProvider, LandingPadSize } from "./universe/orbitalFacility/landingPadProvider";
import { StarSystemController } from "./universe/starSystemController";
import type { SpatialGeometry } from "./universe/systemObject";

const type = makeSystemContentType<SystemContentModel<"capabilities-test">, SystemContent>("capabilities-test");

describe("module entity capabilities", () => {
    let engine: NullEngine;
    let scene: Scene;
    let processors: SystemEntityProcessors;
    let api: GameModuleApi;
    let entity: SystemEntity<typeof type>;
    let ignored: SystemEntity;
    let geometry: SpatialGeometry;
    let disposeContent: Mock<() => void>;
    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        processors = new SystemEntityProcessors();
        api = createGameModuleApi(
            new UniverseBackend(new SystemEntityBackend()),
            new SystemEntityLoader(),
            processors,
            new ModuleAssetRegistry(),
        );
        const model = getVestaModel().systemEntities[0];
        if (model === undefined) {
            throw new Error("Vesta needs an authored entity");
        }
        const transform = new TransformNode("entity", scene);
        transform.position.z = -30;
        disposeContent = vi.fn();
        entity = {
            model: { ...model, content: { type: "capabilities-test" } },
            content: { getTransform: () => transform, dispose: disposeContent },
            placement: { type: "onSurface", getTransform: () => transform },
        };
        ignored = { ...entity, model: { ...model, id: "ignored", content: { type: "no-capabilities" } } };
        geometry = { getTransform: () => transform, getBoundingRadius: () => 10 };
    });
    afterEach(() => {
        processors.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("registers geometry, lighting, landing pads and camera-aware updates for the matching entity type", () => {
        const region: ClusteredLightingRegion = { ...geometry, getLights: () => [] };
        const provider = new LandingPadProvider([]);
        const update = vi.fn();
        api.systemEntities.registerSpatialGeometry(type, () => geometry);
        api.rendering.lighting.systemEntities.registerRegion(type, () => region);
        api.landingPad.systemEntities.register(type, () => provider);
        api.systemEntities.registerUpdate(type, update);
        const context = {
            camera: new FreeCamera("camera", Vector3.Zero(), scene),
            observerPosition: new Vector3(1, 2, 3),
            deltaSeconds: 0.5,
        };

        expect(processors.spatialGeometry.dispatch(entity)).toBe(geometry);
        expect(processors.lightingRegions.dispatch(entity)).toBe(region);
        expect(processors.landingPadProviders.dispatch(entity)).toBe(provider);
        expect(processors.spatialGeometry.dispatch(ignored)).toBeNull();
        expect(processors.lightingRegions.dispatch(ignored)).toBeNull();
        expect(processors.landingPadProviders.dispatch(ignored)).toBeNull();
        processors.updateEntities([entity, ignored], context);
        expect(update).toHaveBeenCalledExactlyOnceWith(entity, context);

        processors.dispose();
        expect(processors.spatialGeometry.dispatch(entity)).toBeNull();
        expect(processors.lightingRegions.dispatch(entity)).toBeNull();
        expect(processors.landingPadProviders.dispatch(entity)).toBeNull();
        processors.updateEntities([entity], context);
        expect(update).toHaveBeenCalledOnce();
        expect(disposeContent).not.toHaveBeenCalled();
    });

    it("uses registered entity geometry for ID lookup and nearest bounding surfaces", () => {
        api.systemEntities.registerSpatialGeometry(type, () => geometry);
        const bodyTransform = new TransformNode("body", scene);
        bodyTransform.position.z = 1000;
        const body = {
            model: { id: "body", name: "Body" },
            getTransform: () => bodyTransform,
            getBoundingRadius: () => 990,
        };
        const controller = {
            getOrbitalObjects: () => [body],
            getSystemObjects: () => StarSystemController.prototype.getSystemObjects.call(controller),
            entityCapabilities: processors,
            systemEntities: [entity, ignored],
        } as unknown as StarSystemController;

        expect(controller.getSystemObjects().map((object) => object.id)).toEqual(["body", entity.model.id]);
        const found = StarSystemController.prototype.getSystemObjectById.call(controller, entity.model.id);
        expect(found?.getTransform()).toBe(geometry.getTransform());
        expect(found?.getBoundingRadius()).toBe(10);
        expect(StarSystemController.prototype.getSystemObjectById.call(controller, "missing")).toBeUndefined();
        expect(StarSystemController.prototype.getNearestSystemObject.call(controller, Vector3.Zero()).id).toBe("body");
        expect(StarSystemController.prototype.getNearestSystemObject.call(controller, new Vector3(0, 0, -30)).id).toBe(
            entity.model.id,
        );
    });

    it("uses the monolith's physical bounds for navigation", () => {
        MonolithModule.setup(api);
        const content = new Monolith(scene);
        const monolith: SystemEntity = {
            ...entity,
            model: { ...entity.model, content: { type: "monolith" } },
            content,
        };
        try {
            const bounds = processors.spatialGeometry.dispatch(monolith);
            expect(bounds?.getTransform()).toBe(content.getTransform());
            const target = processors.targeting.dispatch(monolith)[0];
            expect(target?.getTransform()).toBe(bounds?.getTransform());
            expect(bounds?.getBoundingRadius()).toBeGreaterThan(3);
            expect(bounds?.getBoundingRadius()).toBeLessThan(4);
        } finally {
            content.dispose();
        }
    });
    it("exposes registered pads for facility selection, lookup and targeting alongside legacy facilities", () => {
        const padTransform = new TransformNode("pad", scene);
        const pad: ILandingPad = {
            getTransform: () => padTransform,
            getBoundingRadius: () => 1,
            getIdentifier: () => "A",
            getPadSize: () => LandingPadSize.SMALL,
            getPadHeight: () => 1,
        };
        const provider = new LandingPadProvider([pad]);
        api.systemEntities.registerSpatialGeometry(type, () => geometry);
        api.landingPad.systemEntities.register(type, () => provider);
        const legacyTransform = new TransformNode("legacy", scene);
        legacyTransform.position.z = 1000;
        const legacy = {
            model: { id: "legacy", name: "Legacy" },
            getTransform: () => legacyTransform,
            getBoundingRadius: () => 990,
            getLandingPadProvider: () => new LandingPadProvider([]),
        };
        const controller = {
            getOrbitalFacilities: () => [legacy],
            getOrbitalObjects: () => [],
            getSystemEntities: () => [entity],
            getSystemTargets: () => [],
            getLandableFacilities: () => StarSystemController.prototype.getLandableFacilities.call(controller),
            entityCapabilities: processors,
            systemEntities: [entity, ignored],
        } as unknown as StarSystemController;
        const facilities = controller.getLandableFacilities();
        expect(facilities.map((facility) => facility.id)).toEqual(["legacy", entity.model.id]);
        const facility = facilities.find((candidate) => candidate.id === entity.model.id);
        expect(facility?.getLandingPadProvider()).toBe(provider);
        expect(facility?.getTransform()).toBe(geometry.getTransform());
        expect(
            StarSystemController.prototype.getLandableFacilityById
                .call(controller, entity.model.id)
                ?.getLandingPadProvider(),
        ).toBe(provider);
        expect(StarSystemController.prototype.getLandableFacilityById.call(controller, "missing")).toBeUndefined();
        const targets = getSystemTargets(controller, () => []);
        expect(targets).toHaveLength(1);
        expect(targets[0]?.type).toBe(TargetType.LANDING_PAD);
        expect(targets[0]?.getTransform()).toBe(padTransform);
        const factory = () => targets;
        expect(getSystemTargets(controller, factory)).toHaveLength(1);
    });

    it("requires spatial geometry for a landing provider and handles a system without landable facilities", () => {
        api.landingPad.systemEntities.register(type, () => new LandingPadProvider([]));
        const controller = {
            getOrbitalFacilities: () => [],
            getLandableFacilities: () => StarSystemController.prototype.getLandableFacilities.call(controller),
            entityCapabilities: processors,
            systemEntities: [entity],
        } as unknown as StarSystemController;
        expect(controller.getLandableFacilities()).toEqual([]);
        expect(
            StarSystemController.prototype.getLandableFacilityById.call(controller, entity.model.id),
        ).toBeUndefined();
    });
});
