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
import {
    PhysicsConstraintAxis,
    PhysicsConstraintMotorType,
    PhysicsShapeType,
} from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { Physics6DoFConstraint } from "@babylonjs/core/Physics/v2/physicsConstraint";
import { Scene } from "@babylonjs/core/scene";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Wheel } from "./wheel";

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
            };
        }
    },
}));
vi.mock("@babylonjs/core/Physics/v2/physicsConstraint", () => ({
    Physics6DoFConstraint: vi.fn(
        class {
            setAxisMotorType = vi.fn();
            setAxisMotorMaxForce = vi.fn();
            setAxisMotorTarget = vi.fn();
        },
    ),
}));

type TestWheelLayout = {
    readonly z: number;
    readonly steerable: boolean;
    readonly powered?: boolean;
};

function createWheels(layout: ReadonlyArray<TestWheelLayout> = [{ z: 2.6, steerable: true }]) {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const frameMesh = MeshBuilder.CreateBox("frame", {}, scene);
    frameMesh.position.set(30, 5, -20);
    frameMesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(1, 0.3, -0.2);
    frameMesh.computeWorldMatrix(true);
    const frame = new PhysicsAggregate(frameMesh, PhysicsShapeType.BOX, { mass: 1 }, scene);
    const models = layout.map(({ z, steerable, powered = false }) => ({
        position: new Vector3(0, -1, z),
        geometry: { radius: 1, thickness: 0.3 },
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
    return { models, wheels, scene, engine };
}

let fixture: ReturnType<typeof createWheels>;
afterEach(() => {
    fixture.scene.dispose();
    fixture.engine.dispose();
    vi.restoreAllMocks();
});

describe("wheel geometry", () => {
    it("retains immutable local wheel positions through world translation and rotation", () => {
        fixture = createWheels();
        expect(fixture.wheels[0]?.frameLocalPosition).toEqual(fixture.models[0]?.position);
        fixture.models[0]?.position.set(99, 99, 99);
        expect(fixture.wheels[0]?.frameLocalPosition.z).toBe(2.6);
        expect(Object.isFrozen(fixture.wheels[0]?.frameLocalPosition)).toBe(true);
    });
});

describe("wheel suspension constraints", () => {
    it("locks support pitch while retaining suspension travel, steering and independent wheel spin", () => {
        vi.mocked(Physics6DoFConstraint).mockClear();
        fixture = createWheels([
            { z: 2, steerable: true, powered: true },
            { z: -2, steerable: false, powered: false },
        ]);
        const joints = vi.mocked(Physics6DoFConstraint).mock.calls.map(([, limits]) => limits);
        const frameJoints = joints.filter((limits) =>
            limits.some((limit) => limit.axis === PhysicsConstraintAxis.LINEAR_Y),
        );
        const wheelJoints = joints.filter((limits) =>
            limits.some((limit) => limit.axis === PhysicsConstraintAxis.LINEAR_DISTANCE),
        );
        expect(frameJoints).toHaveLength(2);
        expect(wheelJoints).toHaveLength(2);
        for (const limits of frameJoints) {
            expect(limits).toContainEqual({ axis: PhysicsConstraintAxis.ANGULAR_X, minLimit: 0, maxLimit: 0 });
            expect(limits).toContainEqual({
                axis: PhysicsConstraintAxis.LINEAR_Y,
                minLimit: -0.35,
                maxLimit: 0.35,
                stiffness: 45000,
                damping: 5000,
            });
        }
        expect(frameJoints[0]).toContainEqual({
            axis: PhysicsConstraintAxis.ANGULAR_Y,
            minLimit: -Math.PI / 3,
            maxLimit: Math.PI / 3,
        });
        expect(frameJoints[1]).toContainEqual({ axis: PhysicsConstraintAxis.ANGULAR_Y, minLimit: 0, maxLimit: 0 });
        for (const limits of wheelJoints) {
            expect(limits.some((limit) => limit.axis === PhysicsConstraintAxis.ANGULAR_X)).toBe(false);
        }
        const powered = fixture.wheels[0];
        if (powered === undefined) {
            throw new Error("Expected a powered wheel");
        }
        expect(vi.spyOn(powered.wheelAxleConstraint, "setAxisMotorType")).toHaveBeenCalledWith(
            PhysicsConstraintAxis.ANGULAR_X,
            PhysicsConstraintMotorType.VELOCITY,
        );
    });
});
