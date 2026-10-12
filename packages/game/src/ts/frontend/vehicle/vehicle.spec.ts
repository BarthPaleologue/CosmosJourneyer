//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsConstraintAxis, PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { Scene } from "@babylonjs/core/scene";
import { degreesToRadians, EarthG, kmhToMetersPerSecond } from "@cosmos-journeyer/physics";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Vehicle } from "./vehicle";
import type { VehicleOptions } from "./vehicle";
import { VehicleControls } from "./vehicleControls";
import { Wheel } from "./wheel";

// Keep real meshes/transforms and the production steering controller; mock only physics motors.
vi.mock("@babylonjs/core/Physics/v2/physicsAggregate", () => ({
    PhysicsAggregate: class {
        readonly shape = {};
        readonly body;
        readonly transformNode: TransformNode;
        constructor(transformNode: TransformNode) {
            this.transformNode = transformNode;
            this.body = {
                transformNode,
                addConstraint: vi.fn(),
                getLinearVelocity: vi.fn(() => Vector3.Zero()),
            };
        }
    },
}));
vi.mock("@babylonjs/core/Physics/v2/physicsConstraint", () => ({
    Physics6DoFConstraint: class {
        setAxisMotorType = vi.fn();
        setAxisMotorMaxForce = vi.fn();
        setAxisMotorTarget = vi.fn();
    },
}));

type TestWheelLayout = {
    readonly x?: number;
    readonly z: number;
    readonly steerable: boolean;
    readonly powered?: boolean;
    readonly radius?: number;
};

function createVehicle(
    layout: ReadonlyArray<TestWheelLayout> = [
        { z: 2.6, steerable: true },
        { z: 0, steerable: false },
        { z: -2.6, steerable: true },
    ],
    options?: Partial<VehicleOptions>,
) {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const frameMesh = MeshBuilder.CreateBox("frame", {}, scene);
    frameMesh.position.set(30, 5, -20);
    frameMesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(1, 0.3, -0.2);
    frameMesh.computeWorldMatrix(true);
    const frame = new PhysicsAggregate(frameMesh, PhysicsShapeType.BOX, { mass: 1 }, scene);
    const models = layout.map(({ x = 0, z, steerable, powered = false, radius = 1 }) => ({
        position: new Vector3(x, -1, z),
        geometry: { radius, thickness: 0.3 },
        behavior: { powered, steerable },
    }));
    const wheels = models.map((model) => {
        const mesh = MeshBuilder.CreateBox("wheel", {}, scene);
        mesh.parent = frameMesh;
        mesh.position.copyFrom(model.position);
        mesh.setParent(null);
        const axleMesh = new TransformNode("axle", scene);
        axleMesh.position.copyFrom(mesh.position);
        return new Wheel({ model, wheelMesh: mesh, axleMesh, frameBody: frame.body, scene });
    });
    const vehicle = new Vehicle("test", frame, [], wheels, [], [frameMesh], options);
    const targets = wheels
        .filter((wheel) => wheel.steering !== null)
        .map((wheel) => {
            if (wheel.steering === null) {
                throw new Error("Expected a steering motor");
            }
            return vi.spyOn(wheel.steering.constraint, "setAxisMotorTarget");
        });
    return { vehicle, frame, models, wheels, targets, scene, engine };
}

let fixture: ReturnType<typeof createVehicle>;
afterEach(() => {
    fixture.scene.dispose();
    fixture.engine.dispose();
    vi.restoreAllMocks();
});
const lastAngles = () => fixture.targets.map((target) => target.mock.lastCall?.[1]);

describe("vehicle steering", () => {
    it("retains immutable local wheel positions through world translation and rotation", () => {
        fixture = createVehicle();
        expect(fixture.wheels[0]?.frameLocalPosition).toEqual(fixture.models[0]?.position);
        fixture.models[0]?.position.set(99, 99, 99);
        expect(fixture.wheels[0]?.frameLocalPosition.z).toBe(2.6);
        expect(Object.isFrozen(fixture.wheels[0]?.frameLocalPosition)).toBe(true);
        expect(fixture.vehicle.steeringGeometry).toEqual({ steeringReferenceZ: 0, referenceLeverArm: 2.6 });
    });

    it("sends equal opposite targets through the original position motors", () => {
        fixture = createVehicle();
        fixture.vehicle.setTargetSteeringAngle(1, { horizontalSpeed: kmhToMetersPerSecond(40) });
        const expected = Math.atan((0.5 * EarthG * 2.6) / kmhToMetersPerSecond(40) ** 2);
        expect(lastAngles()[0]).toBeCloseTo(expected);
        expect(lastAngles()[1]).toBeCloseTo(-expected);
        expect(fixture.targets[0]?.mock.lastCall?.[0]).toBe(PhysicsConstraintAxis.ANGULAR_Y);
    });

    it("does not accumulate a hidden command while constrained, then slowing down", () => {
        fixture = createVehicle();
        for (let i = 0; i < 100; i++) {
            fixture.vehicle.turn(1.8, 0.016, { horizontalSpeed: 30 });
        }
        const limitedAngle = lastAngles()[0] ?? 0;
        fixture.vehicle.turn(0, 0.016, { horizontalSpeed: 0 });
        expect(Math.abs(lastAngles()[0] ?? 0)).toBeLessThanOrEqual(limitedAngle);
        expect(Math.abs(lastAngles()[0] ?? 0)).toBeGreaterThan(0);
    });

    it("keeps keyboard rate, return to center, and direction changes", () => {
        fixture = createVehicle();
        fixture.vehicle.turn(1.8, 0.01, { horizontalSpeed: 0 });
        expect(lastAngles()[0]).toBeCloseTo(0.018);
        fixture.vehicle.turn(0, 0.01, { horizontalSpeed: 0 });
        expect(lastAngles()[0]).toBeCloseTo(0.018 * 2 ** (-0.01 / 0.225));
        fixture.vehicle.turn(-1.8, 0.1, { horizontalSpeed: 0 });
        expect(lastAngles()[0]).toBeLessThan(0);
        expect(lastAngles()[1]).toBeGreaterThan(0);
    });

    it("clears commands on mode changes and preserves legacy in-phase limits", () => {
        fixture = createVehicle();
        fixture.vehicle.setTargetSteeringAngle(0.4, { horizontalSpeed: 0 });
        fixture.vehicle.setSteeringMode("inPhase");
        expect(lastAngles().every((angle) => angle === 0)).toBe(true);
        fixture.vehicle.turn(0, 0.016, { horizontalSpeed: 0 });
        expect(lastAngles().every((angle) => angle === 0)).toBe(true);
        fixture.vehicle.setTargetSteeringAngle(1, { horizontalSpeed: kmhToMetersPerSecond(40) });
        const legacyLimit = degreesToRadians(7 + (45 - 7) / 16);
        expect(lastAngles()[0]).toBeCloseTo(legacyLimit);
        expect(lastAngles()[1]).toBeCloseTo(legacyLimit);
        fixture.vehicle.setSteeringMode("counterPhase");
        expect(lastAngles().every((angle) => angle === 0)).toBe(true);
        fixture.vehicle.setTargetSteeringAngle(0.2, { horizontalSpeed: 0 });
        expect(lastAngles()[0]).toBeCloseTo(0.2);
        expect(lastAngles()[1]).toBeCloseTo(-0.2);
    });

    it("accepts horizontal speed explicitly while retaining the 3D fallback", () => {
        fixture = createVehicle();
        vi.spyOn(fixture.frame.body, "getLinearVelocity").mockReturnValue(new Vector3(0, -50, 0));
        fixture.vehicle.setTargetSteeringAngle(1, { horizontalSpeed: 0 });
        expect(lastAngles()[0]).toBeCloseTo(degreesToRadians(45));
        fixture.vehicle.setTargetSteeringAngle(1);
        expect(lastAngles()[0]).toBeCloseTo(Math.atan((0.5 * EarthG * 2.6) / 50 ** 2));
    });

    it("controls pass speed projected along the supplied local up direction", () => {
        fixture = createVehicle();
        fixture.frame.transformNode.rotationQuaternion = Quaternion.Identity();
        fixture.frame.transformNode.computeWorldMatrix(true);
        const controls = new VehicleControls(fixture.scene);
        controls.setVehicle(fixture.vehicle);
        controls.setUpDirection(Vector3.Right());
        controls.thirdPersonCamera.parent?.computeWorldMatrix(true);
        vi.spyOn(fixture.frame.body, "getLinearVelocity").mockReturnValue(new Vector3(-50, 0, 3));
        const turn = vi.spyOn(fixture.vehicle, "turn");
        controls.update(0.016);
        expect(turn.mock.lastCall?.[2]?.horizontalSpeed).toBeCloseTo(3);
    });

    it("falls back safely for incompatible axles, or uses an explicit approximation", () => {
        const layout = [
            { z: 4, steerable: true },
            { z: 0, steerable: false },
            { z: -2, steerable: false },
        ];
        const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
        fixture = createVehicle(layout);
        fixture.vehicle.setTargetSteeringAngle(0.3, { horizontalSpeed: 0 });
        expect(fixture.vehicle.steeringGeometry).toBeUndefined();
        expect(lastAngles()[0]).toBe(0.3);
        expect(warning).toHaveBeenCalledOnce();
        warning.mockRestore();
        const overridden = new Vehicle("override", fixture.frame, [], fixture.wheels, [], [], {
            steeringReferenceZ: -1,
            maxLateralAcceleration: 0.5 * EarthG,
        });
        overridden.setTargetSteeringAngle(1, { horizontalSpeed: 20 });
        expect(lastAngles()[0]).toBeCloseTo(Math.atan((0.5 * EarthG * 5) / 400));
    });

    it("handles vehicles without steering wheels", () => {
        fixture = createVehicle([{ z: 0, steerable: false }]);
        expect(() => {
            fixture.vehicle.turn(1.8, 0.016, { horizontalSpeed: 0 });
        }).not.toThrow();
        expect(lastAngles()).toEqual([]);
    });
});
