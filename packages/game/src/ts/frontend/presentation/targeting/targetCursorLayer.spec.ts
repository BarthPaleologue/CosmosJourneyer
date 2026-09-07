import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { lightYearsToMeters } from "@cosmos-journeyer/physics";
import type { TFunction } from "i18next";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getSolSystemModel } from "../../../backend/universe/customSystems/sol/sol";
import { initI18n } from "../../../i18n";
import { createSystemTarget } from "../../gameplay/targeting/createTargets";
import { TargetType } from "../../gameplay/targeting/target";
import type { Target } from "../../gameplay/targeting/target";
import { TargetAcquisition } from "../../gameplay/targeting/targetContact";
import { TargetingSystem } from "../../gameplay/targeting/targetingSystem";
import type { Transformable } from "../../simulation/architecture/transformable";
import { SystemTarget } from "../../simulation/systemTarget";
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
    function render(controlledObject: Transformable | null): void {
        camera.getViewMatrix(true);
        system.update(camera.globalPosition);
        layer.update(camera, controlledObject);
    }
    function markerOpacity(): number {
        return Number(document.querySelector<HTMLElement>(".targetCursor")?.style.opacity);
    }
    function isHidden(): boolean | undefined {
        return document.querySelector(".targetCursorRoot")?.classList.contains("hidden");
    }
    it("uses the rendered hover reference for selection without resolving again", () => {
        const other = createTarget(10, 100, 1);
        register([target, other], TargetAcquisition.KNOWN);
        render(null);
        const hovered = layer.getHoveredTarget();
        expect(hovered).toBe(target);
        // The next frame may choose differently, but the action uses the last displayed candidate.
        target.getTransform().position.x = 1000;
        expect(layer.getHoveredTarget()).toBe(hovered);
        system.setTarget(hovered);
        expect(system.getTarget()).toBe(target);
        render(null);
        expect(layer.getHoveredTarget()).toBe(other);
        expect(system.getTarget()).toBe(target);
    });
    it("does not substitute another candidate if the hovered contact disappears before selection", () => {
        const other = createTarget(10, 100, 1);
        register([target, other], TargetAcquisition.KNOWN);
        system.setTarget(other);
        render(null);
        system.removeTarget({ ...target });
        expect(layer.getHoveredTarget()).toBeNull();
        expect(system.getTarget()).toBe(other);
        // Re-registering a wrapper must wait for a new rendered hover.
        register([{ ...target }], TargetAcquisition.KNOWN);
        expect(layer.getHoveredTarget()).toBeNull();
    });
    it("clears hover on hide, reset and disposal while preserving gameplay ownership", () => {
        register([target], TargetAcquisition.KNOWN);
        render(null);
        layer.setEnabled(false);
        expect(layer.getHoveredTarget()).toBeNull();
        system.setTarget(target);
        expect(system.getTarget()).toBe(target);
        layer.setEnabled(true);
        render(null);
        system.reset();
        expect(layer.getHoveredTarget()).toBeNull();
        expect(document.querySelector(".targetCursor")).toBeNull();
        register([target], TargetAcquisition.KNOWN);
        system.setTarget(target);
        render(null);
        layer.dispose();
        expect(layer.getHoveredTarget()).toBeNull();
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
    it("keeps CUSTOM visible close up and at astronomical distances", () => {
        register([target], TargetAcquisition.KNOWN);
        for (const distance of [1, 1e12]) {
            target.getTransform().position.z = distance;
            render(null);
            expect(isHidden()).toBe(false);
            expect(layer.getHoveredTarget()).toBe(target);
        }
    });
    it("lets the selected system marker be hovered and unlocked without changing knowledge", () => {
        const destination = new SystemTarget(getSolSystemModel(), new Vector3(0, 0, lightYearsToMeters(3)), scene);
        target = createSystemTarget(destination);
        register([target], TargetAcquisition.KNOWN);
        render(null);
        expect(isHidden()).toBe(true);
        expect(layer.getHoveredTarget()).toBeNull();
        expect(system.isKnown(target)).toBe(true);
        system.setTarget(target);
        render(null);
        expect(isHidden()).toBe(false);
        expect(layer.getHoveredTarget()).toBe(target);
        system.setTarget(layer.getHoveredTarget());
        expect(system.getTarget()).toBeNull();
        render(null);
        expect(isHidden()).toBe(true);
        expect(layer.getHoveredTarget()).toBeNull();
        expect(system.isKnown(target)).toBe(true);
    });
    it.each([TargetType.SPACESHIP, TargetType.VEHICLE])(
        "keeps the controlled %s visible at distance but excludes its hover until walking",
        (type) => {
            target = { ...target, type };
            target.getTransform().position.z = 0;
            const other = createTarget(1, 100, 1);
            register([target, other], TargetAcquisition.KNOWN);
            for (const [distance, hidden] of [
                [2, true],
                [100, false],
            ] as const) {
                camera.position.z = -distance;
                render({ getTransform: () => target.getTransform() });
                expect(isHidden()).toBe(hidden);
                expect(layer.getHoveredTarget()).toBe(other);
                expect(system.isAvailable(target)).toBe(true);
            }
            render(null);
            expect(layer.getHoveredTarget()).toBe(target);
        },
    );
    it.each([
        [TargetType.SPACESHIP, 15],
        [TargetType.VEHICLE, 10],
    ] as const)("preserves the %s proximity fade even when selected", (type, minDistance) => {
        target = { ...target, type };
        register([target], TargetAcquisition.KNOWN);
        system.setTarget(target);
        for (const [distance, opacity] of [
            [minDistance * 0.5, 0],
            [minDistance * 0.75, 0.5],
            [minDistance, 1],
            [1e12, 1],
        ] as const) {
            target.getTransform().position.z = distance;
            render(null);
            expect(markerOpacity()).toBeCloseTo(opacity);
            expect(system.getTarget()).toBe(target);
        }
    });
    it("uses distinct idle, hovered and selected opacity with immediate text feedback", () => {
        register([target], TargetAcquisition.KNOWN);
        render(target);
        expect(markerOpacity()).toBeCloseTo(0.3);
        expect(document.querySelector<HTMLElement>(".targetCursorText")?.style.opacity).toBe("0");
        render(null);
        expect(markerOpacity()).toBeCloseTo(0.65);
        expect(document.querySelector<HTMLElement>(".targetCursorText")?.style.opacity).toBe("1");
        system.setTarget(layer.getHoveredTarget());
        render(null);
        expect(markerOpacity()).toBeCloseTo(1);
    });
    it("fades sensor contacts and excludes invisible contacts without altering acquisition or retained selection", () => {
        target = { ...target, type: TargetType.ANOMALY, getBoundingRadius: (): number => 2 };
        register([target], TargetAcquisition.SENSOR);
        const other = createTarget(10, 1000, 10);
        register([other], TargetAcquisition.KNOWN);
        for (const [distance, fade, available] of [
            [100, 1, true],
            [160, 1, true],
            [180, 0.5, true],
            [200, 0, true],
            [201, 0, false],
        ] as const) {
            target.getTransform().position.z = distance;
            render(null);
            expect(markerOpacity()).toBeCloseTo(fade * 0.65);
            expect(system.isAvailable(target)).toBe(available);
            expect(layer.getHoveredTarget()).toBe(fade > 0 ? target : other);
        }
        system.setTarget(target);
        target.getTransform().position.z = 10000;
        render(null);
        expect(markerOpacity()).toBeCloseTo(1);
        system.setTarget(null);
        system.setKnownTargets([{ ...target }]);
        render(null);
        expect(markerOpacity()).toBeCloseTo(0.65);
        system.setKnownTargets([]);
        render(null);
        expect(markerOpacity()).toBe(0);
        expect(layer.getHoveredTarget()).toBe(other);
    });
    it("filters satellites beyond eight semi-major axes from both display and hover, with selection and guidance exceptions", () => {
        target = { ...target, type: TargetType.TELLURIC_SATELLITE, orbitSemiMajorAxis: 100 };
        const planet = { ...createTarget(10, 1000, 10), type: TargetType.TELLURIC_PLANET };
        register([target, planet], TargetAcquisition.KNOWN);
        for (const [distance, fade] of [
            [640, 1],
            [720, 0.5],
            [800, 0],
            [1000, 0],
        ] as const) {
            target.getTransform().position.z = distance;
            render(null);
            expect(markerOpacity()).toBeCloseTo(fade * 0.65);
            expect(layer.getHoveredTarget()).toBe(fade > 0 ? target : planet);
            expect(system.isAvailable(target)).toBe(true);
        }
        system.setTarget(target);
        render(null);
        expect(isHidden()).toBe(false);
        expect(layer.getHoveredTarget()).toBe(target);
        system.setTarget(null);
        system.setKnownTargets([{ ...target }]);
        render(null);
        expect(isHidden()).toBe(false);
        expect(layer.getHoveredTarget()).toBe(target);
        system.setKnownTargets([]);
        render(null);
        expect(isHidden()).toBe(true);
        expect(layer.getHoveredTarget()).toBe(planet);
    });
    it.each([TargetType.TELLURIC_PLANET, TargetType.TELLURIC_SATELLITE])(
        "hides %s at the surface and in low orbit, including selected targets",
        (type) => {
            target = { ...target, type, orbitSemiMajorAxis: 10000, getBoundingRadius: (): number => 100 };
            register([target], TargetAcquisition.KNOWN);
            system.setTarget(target);
            for (const [distance, opacity] of [
                [100, 0],
                [110, 0],
                [500, 0],
                [750, 0.5],
                [1000, 1],
            ] as const) {
                target.getTransform().position.z = distance;
                render(null);
                expect(markerOpacity()).toBeCloseTo(opacity);
                expect(layer.getHoveredTarget()).toBe(opacity > 0 ? target : null);
                expect(system.getTarget()).toBe(target);
            }
        },
    );
    it("keeps a nearby landing pad hoverable inside a station sphere", () => {
        target = { ...createTarget(0.02, 2, 0.1), padIdentifier: "1", type: TargetType.LANDING_PAD };
        const station = { ...createTarget(30, 100, 200), type: TargetType.SPACE_STATION };
        register([station], TargetAcquisition.KNOWN);
        register([target], TargetAcquisition.SENSOR);
        render(null);
        expect(layer.getHoveredTarget()).toBe(target);
    });
    it("excludes offscreen marker centers even when their bounding sphere intersects the reticle", () => {
        target = createTarget(0, 100, 70);
        target.getTransform().position.y = 60;
        register([target], TargetAcquisition.KNOWN);
        render(null);
        expect(isHidden()).toBe(true);
        expect(layer.getHoveredTarget()).toBeNull();
        const other = createTarget(1, 100, 1);
        register([other], TargetAcquisition.KNOWN);
        render(null);
        expect(layer.getHoveredTarget()).toBe(other);
    });
});
