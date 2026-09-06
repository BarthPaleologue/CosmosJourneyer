import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { describe, expect, it } from "vitest";

import { PositionPDController } from "./positionPdController";

const expectVectorClose = (actual: Vector3, expected: Vector3, precision = 6): void => {
    expect(actual.x).toBeCloseTo(expected.x, precision);
    expect(actual.y).toBeCloseTo(expected.y, precision);
    expect(actual.z).toBeCloseTo(expected.z, precision);
};

describe("PositionPDController", () => {
    it("returns zero force when current matches target", () => {
        const controller = new PositionPDController(2, 3);
        const ref = new Vector3(1, 2, 3);

        const force = controller.computeForceToRef(
            { position: Vector3.Zero(), velocity: Vector3.Zero() },
            { position: Vector3.Zero(), velocity: Vector3.Zero() },
            5,
            ref,
        );

        expect(force).toBe(ref);
        expectVectorClose(force, Vector3.Zero());
    });

    it("computes proportional force from position error", () => {
        const controller = new PositionPDController(4, 0);
        const ref = Vector3.Zero();

        const force = controller.computeForceToRef(
            { position: new Vector3(1, -2, 0.5), velocity: Vector3.Zero() },
            { position: new Vector3(4, 0, -1.5), velocity: Vector3.Zero() },
            2,
            ref,
        );

        const expected = new Vector3(24, 16, -16);
        expectVectorClose(force, expected);
    });

    it("computes derivative force from velocity error", () => {
        const controller = new PositionPDController(0, 1.5);
        const ref = Vector3.Zero();

        const force = controller.computeForceToRef(
            { position: Vector3.Zero(), velocity: new Vector3(2, -1, 0) },
            { position: Vector3.Zero(), velocity: new Vector3(-1, 3, 1) },
            2,
            ref,
        );

        const expected = new Vector3(-9, 12, 3);
        expectVectorClose(force, expected);
    });

    it("accumulates proportional and derivative terms into the provided ref", () => {
        const controller = new PositionPDController(1, 2);
        const ref = new Vector3(10, 20, 30);

        const force = controller.computeForceToRef(
            { position: new Vector3(0, 0, 0), velocity: new Vector3(1, 0, -1) },
            { position: new Vector3(3, -2, 1), velocity: new Vector3(0, 2, 1) },
            1,
            ref,
        );

        expect(force).toBe(ref);
        const expected = new Vector3(3, -2, 1).add(new Vector3(-2, 4, 4));
        expectVectorClose(force, expected);
    });

    it("skips position correction when within the max distance threshold", () => {
        const controller = new PositionPDController(10, 2);
        const ref = new Vector3(1, 1, 1);

        const force = controller.computeForceToRef(
            { position: new Vector3(0, 0, 0), velocity: new Vector3(2, 0, -1) },
            { position: new Vector3(0.005, 0, 0), velocity: new Vector3(-1, 2, 3) },
            2,
            ref,
            { max: { closingSpeed: 10, acceleration: 5 } },
        );

        const expected = new Vector3(-3, 2, 4).scaleInPlace(4);
        expectVectorClose(force, expected);
    });

    it("adds desired closing speed from max acceleration when below closing speed cap", () => {
        const controller = new PositionPDController(0, 1);
        const ref = Vector3.Zero();

        const force = controller.computeForceToRef(
            { position: Vector3.Zero(), velocity: Vector3.Zero() },
            { position: new Vector3(8, 0, 0), velocity: Vector3.Zero() },
            1,
            ref,
            { max: { closingSpeed: 100, acceleration: 2 } },
        );

        const expected = new Vector3(Math.sqrt(32), 0, 0);
        expectVectorClose(force, expected);
    });

    it("clamps desired closing speed to the configured maximum", () => {
        const controller = new PositionPDController(0, 1);
        const ref = Vector3.Zero();

        const force = controller.computeForceToRef(
            { position: Vector3.Zero(), velocity: Vector3.Zero() },
            { position: new Vector3(100, 0, 0), velocity: Vector3.Zero() },
            1,
            ref,
            { max: { closingSpeed: 5, acceleration: 2 } },
        );

        const expected = new Vector3(5, 0, 0);
        expectVectorClose(force, expected);
    });
});
