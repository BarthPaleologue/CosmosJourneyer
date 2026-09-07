import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import type { TFunction } from "i18next";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { initI18n } from "../../../i18n";
import { TargetType } from "../../gameplay/targeting/target";
import type { Target } from "../../gameplay/targeting/target";
import { TargetAcquisition } from "../../gameplay/targeting/targetContact";
import { TargetingSystem } from "../../gameplay/targeting/targetingSystem";
import { TargetCursorLayer } from "./targetCursorLayer";

describe("TargetCursorLayer", () => {
    let t: TFunction;
    let engine: NullEngine;
    let scene: Scene;
    let camera: FreeCamera;
    let system: TargetingSystem;
    let layer: TargetCursorLayer;
    let target: Target;
    beforeAll(async () => {
        t = await initI18n();
    });
    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        camera = new FreeCamera("camera", Vector3.Zero(), scene);
        target = createTarget(0, 100, 1);
        system = new TargetingSystem();
        layer = new TargetCursorLayer(system, t);
        layer.setEnabled(true);
    });
    afterEach(() => {
        layer.dispose();
        scene.dispose();
        engine.dispose();
    });
    function createTarget(x: number, z: number, radius: number): Target {
        const transform = new TransformNode("target", scene);
        transform.position.set(x, 0, z);
        return { type: TargetType.CUSTOM, getTransform: () => transform, getBoundingRadius: () => radius };
    }
    function register(objects: ReadonlyArray<Target>, acquisition: TargetAcquisition): void {
        system.addContacts(objects.map((object) => ({ target: object, acquisition })));
    }
    function render(): void {
        camera.getViewMatrix(true);
        system.update(camera.globalPosition);
        layer.update(camera);
    }
    it("caches the nearest candidate between updates", () => {
        const other = createTarget(10, 100, 1);
        register([target, other], TargetAcquisition.KNOWN);
        render();
        const hovered = layer.getClosestToScreenCenterOrbitalObject();
        expect(hovered).toBe(target);
        // The next update may choose differently; selection uses the cached candidate.
        target.getTransform().position.x = 1000;
        expect(layer.getClosestToScreenCenterOrbitalObject()).toBe(hovered);
        system.setTarget(hovered);
        expect(system.getTarget()).toBe(target);
        render();
        expect(layer.getClosestToScreenCenterOrbitalObject()).toBe(other);
        expect(system.getTarget()).toBe(target);
    });
    it("does not substitute another candidate if the hovered contact disappears before selection", () => {
        const other = createTarget(10, 100, 1);
        register([target, other], TargetAcquisition.KNOWN);
        system.setTarget(other);
        render();
        system.removeTarget({ ...target });
        expect(layer.getClosestToScreenCenterOrbitalObject()).toBeNull();
        expect(system.getTarget()).toBe(other);
        // Re-registering a wrapper must wait for a new rendered hover.
        register([{ ...target }], TargetAcquisition.KNOWN);
        expect(layer.getClosestToScreenCenterOrbitalObject()).toBeNull();
    });
    it("clears hover on hide, reset and disposal while preserving gameplay ownership", () => {
        register([target], TargetAcquisition.KNOWN);
        render();
        layer.setEnabled(false);
        expect(layer.getClosestToScreenCenterOrbitalObject()).toBeNull();
        system.setTarget(target);
        expect(system.getTarget()).toBe(target);
        layer.setEnabled(true);
        render();
        system.reset();
        expect(layer.getClosestToScreenCenterOrbitalObject()).toBeNull();
        expect(document.querySelector(".targetCursor")).toBeNull();
        register([target], TargetAcquisition.KNOWN);
        system.setTarget(target);
        render();
        layer.dispose();
        expect(layer.getClosestToScreenCenterOrbitalObject()).toBeNull();
        expect(system.getTarget()).toBe(target);
        expect([...system.getTargets()]).toEqual([target]);
        expect(document.querySelector(".targetCursorLayer")).toBeNull();
    });
    it("creates one cursor per canonical target, including pre-existing contacts, and unsubscribes on disposal", () => {
        layer.dispose();
        register([target], TargetAcquisition.KNOWN);
        layer = new TargetCursorLayer(system, t);
        const cursor = document.querySelector(".targetCursor");
        register([{ ...target }], TargetAcquisition.KNOWN);
        system.setKnownTargets([{ ...target }]);
        expect(document.querySelectorAll(".targetCursor")).toHaveLength(1);
        expect(document.querySelector(".targetCursor")).toBe(cursor);
        const otherLayer = new TargetCursorLayer(system, t);
        layer.dispose();
        layer = otherLayer;
        system.reset();
        register([target], TargetAcquisition.KNOWN);
        expect(document.querySelectorAll(".targetCursor")).toHaveLength(1);
        layer.dispose();
        system.reset();
        register([target], TargetAcquisition.KNOWN);
        expect(document.querySelectorAll(".targetCursor")).toHaveLength(0);
    });
});
