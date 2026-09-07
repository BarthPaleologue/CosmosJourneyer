import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { TargetType } from "../../gameplay/targeting/target";
import type { Target } from "../../gameplay/targeting/target";
import { resolveReticleTarget } from "./resolveReticleTarget";

describe("resolveReticleTarget", () => {
    let engine: NullEngine;
    let scene: Scene;
    const ray = { origin: Vector3.Zero(), direction: Vector3.Forward() };
    const fov = Math.PI / 3;
    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });
    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });
    function target(x: number, z: number, radius: number): Target {
        const transform = new TransformNode("target", scene);
        transform.position.set(x, 0, z);
        return { type: TargetType.CUSTOM, getTransform: () => transform, getBoundingRadius: () => radius };
    }
    it.each([0.001, 1, 1e9])("preserves apparent-geometry ranking at scale %s and prioritizes precise aim", (scale) => {
        const large = target(40 * scale, 100 * scale, 100 * scale);
        const small = target(30 * scale, 100 * scale, 40 * scale);
        expect(resolveReticleTarget([small, large], ray, fov)).toBe(large);
        const direction = new Vector3(30, 0, 100);
        expect(resolveReticleTarget([large, small], { origin: ray.origin, direction }, fov)).toBe(small);
        expect(direction).toEqual(new Vector3(30, 0, 100));
    });
    it("lets a precisely aimed pad beat station assistance in either order", () => {
        const pad = target(0.02, 2, 0.5);
        const station = target(30, 100, 90);
        expect(resolveReticleTarget([station, pad], ray, fov)).toBe(pad);
        expect(resolveReticleTarget([pad, station], ray, fov)).toBe(pad);
    });
    it("does not use an enclosing station sphere for assistance", () => {
        const pad = target(0.02, 2, 20);
        const station = target(30, 100, 200);
        expect(resolveReticleTarget([station, pad], ray, fov)).toBe(pad);
        expect(resolveReticleTarget([station], ray, fov)).toBeNull();
        expect(resolveReticleTarget([station], { origin: ray.origin, direction: new Vector3(30, 0, 100) }, fov)).toBe(
            station,
        );
    });
    it("uses world positions, parent motion and the ray origin", () => {
        const parent = new TransformNode("parent", scene);
        parent.position.x = 10;
        const child = target(-10, 10, 1);
        child.getTransform().parent = parent;
        const other = target(1, 10, 1);
        expect(resolveReticleTarget([other, child], ray, fov)).toBe(child);
        parent.position.x = 20;
        expect(resolveReticleTarget([other, child], ray, fov)).toBe(other);
        expect(
            resolveReticleTarget(
                [other, child],
                { origin: new Vector3(10, 0, 0), direction: new Vector3(0, 0, 2) },
                fov,
            ),
        ).toBe(child);
    });
    it("excludes behind, perpendicular, origin, empty and zero-direction candidates", () => {
        expect(resolveReticleTarget([target(0, -1, 1), target(1, 0, 1), target(0, 0, 1)], ray, fov)).toBeNull();
        expect(resolveReticleTarget([], ray, fov)).toBeNull();
        expect(
            resolveReticleTarget([target(0, 10, 1)], { origin: ray.origin, direction: Vector3.Zero() }, fov),
        ).toBeNull();
    });
    it.each([-1, NaN, Infinity, -Infinity])("ignores invalid radius %s", (radius) => {
        expect(resolveReticleTarget([target(0, 10, radius)], ray, fov)).toBeNull();
    });
    it("keeps the first candidate on equal scores", () => {
        const first = target(0.5, 10, 1);
        expect(resolveReticleTarget([first, target(1, 20, 2)], ray, fov)).toBe(first);
    });
    it("responds to FOV changes and returns null beyond capture range", () => {
        const small = target(20, 100, 0.01);
        expect(resolveReticleTarget([small], ray, fov)).toBe(small);
        expect(resolveReticleTarget([small], ray, Math.PI / 6)).toBeNull();
        const tangent = target(40, 100, 40);
        expect(resolveReticleTarget([tangent], ray, fov)).toBe(tangent);
        tangent.getTransform().position.x = 40.001;
        expect(resolveReticleTarget([tangent], ray, fov)).toBeNull();
    });
});
