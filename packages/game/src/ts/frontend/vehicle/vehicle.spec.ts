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
import { VehicleInputs } from "./vehicleControlsInputs";
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
    const driveMotors = wheels
        .filter((wheel) => wheel.motor !== null)
        .map((wheel) => {
            if (wheel.motor === null) {
                throw new Error("Expected a drive motor");
            }
            return {
                target: vi.spyOn(wheel.motor, "setAxisMotorTarget"),
                torque: vi.spyOn(wheel.motor, "setAxisMotorMaxForce"),
            };
        });
    return { vehicle, frame, models, wheels, targets, driveMotors, scene, engine };
}

let fixture: ReturnType<typeof createVehicle>;
afterEach(() => {
    fixture.scene.dispose();
    fixture.engine.dispose();
    window.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyW" }));
    window.dispatchEvent(new KeyboardEvent("keyup", { code: "Space" }));
    VehicleInputs.setEnabled(false);
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
        const expected = Math.atan((EarthG * 2.6) / kmhToMetersPerSecond(40) ** 2);
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
        expect(lastAngles()[0]).toBeCloseTo(Math.atan((EarthG * 2.6) / 50 ** 2));
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

const wolfLayout: ReadonlyArray<TestWheelLayout> = [
    { x: 2.2, z: 2.6, steerable: true },
    { x: -2.2, z: 2.6, steerable: true },
    { x: 2.2, z: 0, steerable: false },
    { x: -2.2, z: 0, steerable: false },
    { x: 2.2, z: -2.6, steerable: true },
    { x: -2.2, z: -2.6, steerable: true },
];

describe("vehicle steering inputs and Ackermann", () => {
    it("reaches full lock under held input instead of fighting return-to-center", () => {
        fixture = createVehicle();
        for (let i = 0; i < 120; i++) {
            fixture.vehicle.turn(1.8, 1 / 60, { horizontalSpeed: 0 });
        }
        expect(lastAngles()[0]).toBeCloseTo(degreesToRadians(45));
        fixture.vehicle.turn(0, 0.225, { horizontalSpeed: 0 });
        expect(lastAngles()[0]).toBeCloseTo(degreesToRadians(22.5));
    });

    it("integrates held input consistently at different frame rates", () => {
        fixture = createVehicle();
        for (const fps of [30, 60, 120]) {
            fixture.vehicle.setTargetSteeringAngle(0, { horizontalSpeed: 0 });
            for (let i = 0; i < fps; i++) {
                fixture.vehicle.turn(0.3, 1 / fps, { horizontalSpeed: 0 });
            }
            expect(lastAngles()[0]).toBeCloseTo(0.3);
        }
    });

    it("limits the Wolf's inside wheels to 45 degrees while sharing one turning center", () => {
        fixture = createVehicle(wolfLayout);
        fixture.vehicle.setTargetSteeringAngle(1, { horizontalSpeed: 0 });
        const angles = lastAngles();
        expect(angles[0]).toBeCloseTo(degreesToRadians(45));
        expect(angles[1]).toBeCloseTo(Math.atan(2.6 / 7));
        expect(angles[2]).toBeCloseTo(-(angles[0] ?? 0));
        expect(angles[3]).toBeCloseTo(-(angles[1] ?? 0));
        const commandedAngles = fixture.wheels.filter((wheel) => wheel.steering !== null);
        commandedAngles.forEach((wheel, i) => {
            expect(wheel.frameLocalPosition.x + wheel.frameLocalPosition.z / Math.tan(angles[i] ?? 0)).toBeCloseTo(4.8);
        });
        // The stored command also respects the Ackermann mechanical limit.
        fixture.vehicle.turn(0, 0.225, { horizontalSpeed: 0 });
        const centerAngle = Math.atan(2.6 / 4.8) / 2;
        expect(lastAngles()[0]).toBeCloseTo(Math.atan2(Math.tan(centerAngle), 1 - (Math.tan(centerAngle) * 2.2) / 2.6));
    });

    it("preserves the lateral acceleration budget, reverse signs and in-phase behavior", () => {
        fixture = createVehicle(wolfLayout);
        const speed = kmhToMetersPerSecond(40);
        const curvature = EarthG / speed ** 2;
        fixture.vehicle.setTargetSteeringAngle(1, { horizontalSpeed: speed });
        const angles = lastAngles();
        expect(angles[0]).toBeCloseTo(Math.atan2(curvature * 2.6, 1 - curvature * 2.2));
        expect(angles[1]).toBeCloseTo(Math.atan2(curvature * 2.6, 1 + curvature * 2.2));
        fixture.vehicle.setTargetSteeringAngle(1, { horizontalSpeed: -speed });
        expect(lastAngles()).toEqual(angles);
        fixture.vehicle.setTargetSteeringAngle(-1, { horizontalSpeed: speed });
        expect(lastAngles()[0]).toBeCloseTo(-(angles[1] ?? 0));
        expect(lastAngles()[1]).toBeCloseTo(-(angles[0] ?? 0));
        fixture.vehicle.setSteeringMode("inPhase");
        fixture.vehicle.setTargetSteeringAngle(0.2, { horizontalSpeed: 0 });
        expect(lastAngles().every((angle) => angle === 0.2)).toBe(true);
    });
});

const driveLayout: ReadonlyArray<TestWheelLayout> = [
    { z: 2, steerable: true, powered: true, radius: 0.5 },
    { z: -2, steerable: false, powered: true, radius: 1 },
    { z: -2, steerable: false },
];
const driveTargets = () => fixture.driveMotors.map((motor) => motor.target.mock.lastCall?.[1]);
const driveTorques = () => fixture.driveMotors.map((motor) => motor.torque.mock.lastCall?.[1]);
function setLongitudinalVelocity(speed: number) {
    const forward = fixture.vehicle.getTransform().getDirection(Vector3.Forward());
    vi.spyOn(fixture.frame.body, "getLinearVelocity").mockReturnValue(forward.scale(speed));
}

describe("vehicle throttle and braking", () => {
    it("integrates acceleration without decaying a held throttle command", () => {
        fixture = createVehicle(driveLayout);
        setLongitudinalVelocity(8);
        for (const fps of [30, 60, 120]) {
            fixture.vehicle.setTargetSpeed(0);
            for (let i = 0; i < fps; i++) {
                fixture.vehicle.accelerate(5, 1 / fps);
            }
            expect(driveTargets()[0]).toBeCloseTo(10);
            expect(driveTargets()[1]).toBeCloseTo(5);
        }
        expect(driveTorques()).toEqual([5000, 5000]);
    });

    it("releases all drive torque at zero throttle and leaves unpowered wheels alone", () => {
        fixture = createVehicle(driveLayout);
        const freeWheel = fixture.wheels[2];
        if (freeWheel === undefined) {
            throw new Error("Expected a free wheel");
        }
        const freeTarget = vi.spyOn(freeWheel.wheelAxleConstraint, "setAxisMotorTarget");
        fixture.vehicle.setTargetSpeed(10);
        fixture.vehicle.accelerate(0, 0.016);
        expect(driveTorques()).toEqual([0, 0]);
        expect(driveTargets()).toEqual([0, 0]);
        expect(freeTarget).not.toHaveBeenCalled();
    });

    it("makes engine braking configurable independently of service braking and boost", () => {
        fixture = createVehicle(driveLayout, { engineBrakeTorque: 500 });
        fixture.vehicle.setBoostEnabled(true);
        fixture.vehicle.setTargetSpeed(5);
        expect(driveTorques()).toEqual([15000, 15000]);
        fixture.vehicle.releaseThrottle();
        expect(driveTorques()).toEqual([500, 500]);
        expect(driveTargets()).toEqual([0, 0]);
        fixture.vehicle.brake();
        expect(driveTorques()).toEqual([20000, 20000]);
        fixture.vehicle.releaseThrottle();
        expect(driveTorques()).toEqual([500, 500]);
    });

    it("resumes from actual signed motion after coasting or braking without restoring stale commands", () => {
        fixture = createVehicle(driveLayout);
        fixture.vehicle.setTargetSpeed(20);
        fixture.vehicle.releaseThrottle();
        setLongitudinalVelocity(8);
        fixture.vehicle.accelerate(2, 0.1);
        expect(driveTargets()[1]).toBeCloseTo(8.2);
        fixture.vehicle.brake();
        setLongitudinalVelocity(4);
        fixture.vehicle.accelerate(2, 0.1);
        expect(driveTargets()[1]).toBeCloseTo(4.2);
        fixture.vehicle.releaseThrottle();
        setLongitudinalVelocity(-3);
        fixture.vehicle.accelerate(-2, 0.1);
        expect(driveTargets()[1]).toBeCloseTo(-3.2);
        expect(driveTorques()).toEqual([5000, 5000]);
    });

    it("retains forward, reverse and boost limits", () => {
        fixture = createVehicle(driveLayout);
        fixture.vehicle.accelerate(100, 1);
        expect(driveTargets()[1]).toBeCloseTo(kmhToMetersPerSecond(40));
        fixture.vehicle.setBoostEnabled(true);
        fixture.vehicle.accelerate(100, 1);
        expect(driveTargets()[1]).toBeCloseTo(kmhToMetersPerSecond(80));
        fixture.vehicle.setBoostEnabled(false);
        fixture.vehicle.accelerate(100, 1);
        expect(driveTargets()[1]).toBeCloseTo(kmhToMetersPerSecond(40));
        fixture.vehicle.accelerate(-100, 1);
        expect(driveTargets()[1]).toBeCloseTo(-kmhToMetersPerSecond(20));
    });
});

describe("vehicle throttle input routing", () => {
    it("prioritizes braking, releases throttle to freewheel and restores drive torque", () => {
        fixture = createVehicle(driveLayout);
        const controls = new VehicleControls(fixture.scene);
        controls.setVehicle(fixture.vehicle);
        VehicleInputs.setEnabled(true);
        window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyW" }));
        controls.update(0.1);
        expect(driveTorques()).toEqual([5000, 5000]);
        window.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyW" }));
        controls.update(0.1);
        expect(driveTorques()).toEqual([0, 0]);
        expect(driveTargets()).toEqual([0, 0]);
        window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyW" }));
        window.dispatchEvent(new KeyboardEvent("keydown", { code: "Space" }));
        controls.update(0.1);
        expect(driveTorques()).toEqual([20000, 20000]);
        expect(driveTargets()).toEqual([0, 0]);
        window.dispatchEvent(new KeyboardEvent("keyup", { code: "Space" }));
        setLongitudinalVelocity(3);
        controls.update(0.1);
        expect(driveTorques()).toEqual([5000, 5000]);
        expect(driveTargets()[1]).toBeCloseTo(3 + 0.7 * EarthG * 0.1);
    });
});
