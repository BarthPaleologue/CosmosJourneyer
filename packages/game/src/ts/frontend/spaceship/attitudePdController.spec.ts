import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { describe, expect, it } from "vitest";

import { AttitudePDController, type AngularMassProperties } from "./attitudePdController";

const expectVectorClose = (actual: Vector3, expected: Vector3, precision = 6): void => {
    expect(actual.x).toBeCloseTo(expected.x, precision);
    expect(actual.y).toBeCloseTo(expected.y, precision);
    expect(actual.z).toBeCloseTo(expected.z, precision);
};

describe("AttitudePDController", () => {
    const massProps: AngularMassProperties = {
        mass: 2,
        inertia: new Vector3(1, 2, 3),
        inertiaOrientation: Quaternion.Identity(),
    };

    it("returns zero torque when current matches target", () => {
        const controller = new AttitudePDController(2, 3);
        const torque = controller.computeTorqueToRef(
            {
                orientation: Quaternion.Identity(),
                angularVelocity: Vector3.Zero(),
            },
            {
                orientation: Quaternion.Identity(),
                angularVelocity: Vector3.Zero(),
            },
            massProps,
            Vector3.Zero(),
        );

        expectVectorClose(torque, Vector3.Zero());
    });

    it("computes proportional torque from orientation error", () => {
        const controller = new AttitudePDController(2, 0);
        const targetOrientation = Quaternion.RotationAxis(Vector3.Right(), Math.PI / 2);

        const torque = controller.computeTorqueToRef(
            {
                orientation: Quaternion.Identity(),
                angularVelocity: Vector3.Zero(),
            },
            {
                orientation: targetOrientation,
                angularVelocity: Vector3.Zero(),
            },
            massProps,
            Vector3.Zero(),
        );

        const expected = new Vector3(2 * Math.PI, 0, 0);
        expectVectorClose(torque, expected);
    });

    it("computes derivative torque from angular velocity error", () => {
        const controller = new AttitudePDController(0, 1.5);

        const torque = controller.computeTorqueToRef(
            {
                orientation: Quaternion.Identity(),
                angularVelocity: new Vector3(1, -2, 0.5),
            },
            {
                orientation: Quaternion.Identity(),
                angularVelocity: Vector3.Zero(),
            },
            massProps,
            Vector3.Zero(),
        );

        const expected = new Vector3(-3, 12, -4.5);
        expectVectorClose(torque, expected);
    });

    it("uses shortest arc by normalizing quaternion sign", () => {
        const controller = new AttitudePDController(1, 0);
        const targetOrientation = Quaternion.RotationAxis(Vector3.Up(), Math.PI / 6);
        const targetOrientationNegated = new Quaternion(
            -targetOrientation.x,
            -targetOrientation.y,
            -targetOrientation.z,
            -targetOrientation.w,
        );

        const torqueFromPositive = controller.computeTorqueToRef(
            {
                orientation: Quaternion.Identity(),
                angularVelocity: Vector3.Zero(),
            },
            {
                orientation: targetOrientation,
                angularVelocity: Vector3.Zero(),
            },
            massProps,
            Vector3.Zero(),
        );

        const torqueFromNegative = controller.computeTorqueToRef(
            {
                orientation: Quaternion.Identity(),
                angularVelocity: Vector3.Zero(),
            },
            {
                orientation: targetOrientationNegated,
                angularVelocity: Vector3.Zero(),
            },
            massProps,
            Vector3.Zero(),
        );

        expectVectorClose(torqueFromNegative, torqueFromPositive);
    });
});
