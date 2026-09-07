import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { TargetType } from "./target";
import type { Target } from "./target";
import { TargetAcquisition } from "./targetContact";
import { TargetingSystem } from "./targetingSystem";

describe("TargetingSystem", () => {
    let engine: NullEngine;
    let scene: Scene;
    let system: TargetingSystem;
    const ray = { origin: Vector3.Zero(), direction: Vector3.Forward() };

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        system = new TargetingSystem();
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    function createTarget(x: number, z: number): Target {
        const transform = new TransformNode("target", scene);
        transform.position.set(x, 0, z);
        return { type: TargetType.CUSTOM, getTransform: () => transform, getBoundingRadius: (): number => 1 };
    }

    it("registers one canonical target per transform", () => {
        const target = createTarget(0, 10);
        system.addContacts(
            [target, { ...target }].map((object) => ({ target: object, acquisition: TargetAcquisition.KNOWN })),
        );
        expect([...system.getTargets()]).toEqual([target]);
        system.setTarget({ ...target });
        expect(system.getTarget()).toBe(target);
    });

    it("toggles selection and supports forced selection and deselection", () => {
        const target = createTarget(0, 10);
        system.addContacts([target].map((object) => ({ target: object, acquisition: TargetAcquisition.KNOWN })));
        system.setTarget(target);
        expect(system.getTarget()).toBe(target);
        system.setTarget(target);
        expect(system.getTarget()).toBeNull();
        system.setTarget(target, true);
        system.setTarget(target, true);
        expect(system.getTarget()).toBe(target);
        system.setTarget(target, false);
        expect(system.getTarget()).toBeNull();
        system.setTarget(target);
        system.setTarget(null);
        expect(system.getTarget()).toBeNull();
    });

    it("does not select or make unregistered targets known targets", () => {
        const target = createTarget(0, 10);
        system.setTarget(target, true);
        system.setKnownTargets([target]);
        expect(system.getTarget()).toBeNull();
        expect(system.isKnown(target)).toBe(false);
    });

    it("replaces known overrides using canonical targets", () => {
        const first = createTarget(0, 10);
        const second = createTarget(1, 10);
        system.addContacts(
            [first, second].map((object) => ({ target: object, acquisition: TargetAcquisition.SENSOR })),
        );
        system.setKnownTargets([{ ...first }]);
        expect(system.isKnown(first)).toBe(true);
        system.setKnownTargets([second]);
        expect(system.isKnown(first)).toBe(false);
        expect(system.isKnown(second)).toBe(true);
    });

    it("removes selection, known overrides when their transform is removed", () => {
        const target = createTarget(0, 10);
        system.addContacts([target].map((object) => ({ target: object, acquisition: TargetAcquisition.KNOWN })));
        system.setTarget(target);
        system.setKnownTargets([target]);
        system.update(ray.origin);
        system.removeTarget({ getTransform: () => target.getTransform() });
        expect([...system.getTargets()]).toEqual([]);
        expect(system.getTarget()).toBeNull();
        expect(system.isKnown(target)).toBe(false);
        system.removeTarget(target);
        expect([...system.getTargets()]).toEqual([]);
    });

    it("clears all state on reset, including known overrides when a target is registered again", () => {
        const target = createTarget(0, 10);
        system.addContacts([target].map((object) => ({ target: object, acquisition: TargetAcquisition.SENSOR })));
        system.setTarget(target);
        system.setKnownTargets([target]);
        system.update(ray.origin);
        system.reset();
        expect([...system.getTargets()]).toEqual([]);
        expect(system.getTarget()).toBeNull();
        system.addContacts([target].map((object) => ({ target: object, acquisition: TargetAcquisition.SENSOR })));
        expect(system.isKnown(target)).toBe(false);
    });

    it("notifies once per batch with only newly registered canonical targets", () => {
        const first = createTarget(0, 10);
        const second = createTarget(1, 10);
        const batches: Array<Iterable<Target>> = [];
        system.onTargetsAddedObservable.add((targets) => {
            batches.push(targets);
            expect([...system.getTargets()]).toEqual([first, second]);
        });
        system.addContacts(
            [first, { ...first }, second].map((object) => ({ target: object, acquisition: TargetAcquisition.KNOWN })),
        );
        system.addContacts([first].map((object) => ({ target: object, acquisition: TargetAcquisition.KNOWN })));
        system.addContacts([].map((object) => ({ target: object, acquisition: TargetAcquisition.KNOWN })));
        expect(batches.map((batch) => [...batch])).toEqual([[first, second]]);
    });

    it("notifies removal after clearing selection, known overrides", () => {
        const target = createTarget(0, 10);
        system.addContacts([target].map((object) => ({ target: object, acquisition: TargetAcquisition.KNOWN })));
        system.setTarget(target);
        system.setKnownTargets([target]);
        system.update(ray.origin);
        const batches: Array<Iterable<Target>> = [];
        system.onTargetsRemovedObservable.add((targets) => {
            batches.push(targets);
            expect([...system.getTargets()]).toEqual([]);
            expect(system.getTarget()).toBeNull();
            expect(system.isKnown(target)).toBe(false);
        });
        system.removeTarget({ ...target });
        system.removeTarget(target);
        expect(batches.map((batch) => [...batch])).toEqual([[target]]);
    });

    it("notifies all reset removals as one stable batch", () => {
        const first = createTarget(0, 10);
        const second = createTarget(1, 10);
        system.addContacts([first, second].map((object) => ({ target: object, acquisition: TargetAcquisition.KNOWN })));
        system.setTarget(first);
        system.setKnownTargets([first]);
        system.update(ray.origin);
        const batches: Array<Iterable<Target>> = [];
        system.onTargetsRemovedObservable.add((targets) => {
            batches.push(targets);
            expect([...system.getTargets()]).toEqual([]);
            expect(system.getTarget()).toBeNull();
            expect(system.isKnown(first)).toBe(false);
        });
        system.reset();
        system.reset();
        system.addContacts([first].map((object) => ({ target: object, acquisition: TargetAcquisition.KNOWN })));
        expect(batches.map((batch) => [...batch])).toEqual([[first, second]]);
    });
    it("uses the radius-derived inclusive sensor boundary", () => {
        const pad = {
            ...createTarget(0, 201),
            padIdentifier: "1",
            type: TargetType.LANDING_PAD,
            getBoundingRadius: (): number => 2,
        };
        const facility = { ...createTarget(1, 1000), type: TargetType.SPACE_STATION };
        system.addContacts([
            { target: pad, acquisition: TargetAcquisition.SENSOR },
            { target: facility, acquisition: TargetAcquisition.KNOWN },
        ]);
        system.update(ray.origin);
        expect(system.isAvailable(pad)).toBe(false);
        pad.getTransform().position.z = 200;
        system.update(ray.origin);
        expect(system.isAvailable(pad)).toBe(true);
        system.setTarget(pad);
        pad.getTransform().position.z = 10000;
        system.update(ray.origin);
        expect(system.isAvailable({ ...pad })).toBe(true);
        system.setTarget(null);
        expect(system.isAvailable(pad)).toBe(false);
    });

    it("temporarily promotes canonical sensor contacts without registration churn", () => {
        const target = createTarget(0, 10000);
        const contact = { target, acquisition: TargetAcquisition.SENSOR };
        system.addContacts([contact]);
        let additions = 0;
        system.onTargetsAddedObservable.add(() => {
            additions++;
        });
        system.setKnownTargets([{ ...target, getBoundingRadius: (): number => 10000 }]);
        expect(system.getContact({ ...target })).toBe(contact);
        expect(system.isKnown({ ...target })).toBe(true);
        expect(system.isAvailable(target)).toBe(true);
        expect([...system.getTargets()]).toEqual([target]);
        expect(additions).toBe(0);
        system.setKnownTargets([]);
        expect(system.isAvailable(target)).toBe(false);
        system.setKnownTargets([target]);
        system.reset();
        expect(system.getContact(target)).toBeNull();
        system.addContacts([contact]);
        expect(system.isAvailable(target)).toBe(false);
    });

    it("measures sensor range from the observer to the current world position", () => {
        const parent = new TransformNode("parent", scene);
        parent.position.z = 1000;
        const target = createTarget(0, 100);
        target.getTransform().parent = parent;
        system.addContacts([{ target, acquisition: TargetAcquisition.SENSOR }]);
        system.update(new Vector3(0, 0, 1000));
        expect(system.isAvailable(target)).toBe(true);
        parent.position.z++;
        expect(system.isAvailable(target)).toBe(false);
    });
});
