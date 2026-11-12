import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import type { UniverseObjectId } from "@cosmos-journeyer/universe-model";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getSunModel } from "@/backend/universe/customSystems/sol/sun";

import type { SystemEntity } from "@/frontend/systemEntity/systemEntity";
import type { OrbitalObject } from "@/frontend/universe/architecture/orbitalObject";

import { getVestaModel } from "@/modules/vesta/vesta";

import { getMissionKnownTargets } from "./createTargets";
import { TargetType } from "./target";
import type { Target } from "./target";

describe("mission guidance targets", () => {
    let engine: NullEngine;
    let scene: Scene;
    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });
    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    /** @returns Current-system models and target factories for mission guidance. */
    function createFixture() {
        const { starSystem, systemEntities } = getVestaModel();
        const model = systemEntities[0];
        if (model === undefined) {
            throw new Error("Vesta needs a system entity");
        }
        const transform = new TransformNode("entity", scene);
        const entity: SystemEntity = {
            model,
            content: { getTransform: () => transform, dispose: () => {} },
            placement: { type: "onSurface", getTransform: () => transform },
        };
        const targets: Array<Target> = [
            {
                type: TargetType.CUSTOM,
                properName: model.name,
                getTransform: () => transform,
                getBoundingRadius: () => 1,
            },
            {
                type: TargetType.LANDING_PAD,
                padIdentifier: "A",
                getTransform: () => transform,
                getBoundingRadius: () => 1,
            },
        ];
        const factory = vi.fn(() => targets);
        const system = {
            model: starSystem,
            getOrbitalObjectById: vi.fn<() => OrbitalObject | undefined>(() => undefined),
            getSystemEntities: () => [entity],
        };
        const id: UniverseObjectId = { systemCoordinates: { ...starSystem.coordinates }, idInSystem: model.id };
        return { system, entity, factory, targets, id, transform };
    }

    it("resolves an entity ID through its module factory and keeps all of its targets", () => {
        const { system, entity, factory, targets, id } = createFixture();
        expect(getMissionKnownTargets([{ getGuidanceTargetObjectIds: () => [id] }], system, factory)).toEqual(targets);
        expect(factory).toHaveBeenCalledExactlyOnceWith(entity);
    });

    it("ignores targets in another system and missing IDs", () => {
        const { system, factory, id } = createFixture();
        const elsewhere = { ...id, systemCoordinates: { ...id.systemCoordinates, starSectorX: 100 } };
        const missing = { ...id, idInSystem: "missing" };
        expect(
            getMissionKnownTargets([{ getGuidanceTargetObjectIds: () => [elsewhere, missing] }], system, factory),
        ).toEqual([]);
        expect(factory).not.toHaveBeenCalled();
    });

    it("keeps orbital object targets ahead of entities with the same local ID", () => {
        const { system, factory, id, transform } = createFixture();
        const model = getSunModel();
        system.getOrbitalObjectById.mockReturnValue({
            type: model.type,
            model,
            getTransform: () => transform,
            getBoundingRadius: () => model.radius,
        } as unknown as OrbitalObject);
        const targets = getMissionKnownTargets([{ getGuidanceTargetObjectIds: () => [id] }], system, factory);
        expect(targets).toHaveLength(1);
        expect(targets[0]).toMatchObject({ type: TargetType.STAR, properName: model.name });
        expect(targets[0]?.getTransform()).toBe(transform);
        expect(factory).not.toHaveBeenCalled();
    });

    it("omits entities without registered targets and empty mission lists", () => {
        const { system, factory, id } = createFixture();
        factory.mockReturnValue([]);
        expect(getMissionKnownTargets([{ getGuidanceTargetObjectIds: () => [id] }], system, factory)).toEqual([]);
        factory.mockClear();
        expect(getMissionKnownTargets([], system, factory)).toEqual([]);
        expect(factory).not.toHaveBeenCalled();
    });
});
