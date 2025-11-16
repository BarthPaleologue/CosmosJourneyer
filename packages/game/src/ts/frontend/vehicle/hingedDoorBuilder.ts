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

import { Vector3, type Quaternion } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import {
    PhysicsConstraintAxis,
    PhysicsConstraintMotorType,
    PhysicsShapeType,
} from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { Physics6DoFConstraint } from "@babylonjs/core/Physics/v2/physicsConstraint";
import type { Scene } from "@babylonjs/core/scene";

import { HingedDoor } from "./hingedDoor";

export class HingedDoorBuilder {
    readonly hingeMesh: Mesh;
    private readonly doorMesh: Mesh;

    private readonly scene: Scene;

    private minAngle: number | null = null;
    private maxAngle: number | null = null;

    constructor(doorMesh: Mesh, hingeLength: number, scene: Scene) {
        this.scene = scene;

        this.hingeMesh = MeshBuilder.CreateCylinder(
            "Hinge",
            { height: hingeLength, diameter: 0.1, tessellation: 4 },
            scene,
        );
        this.doorMesh = doorMesh;
        this.doorMesh.parent = this.hingeMesh;
    }

    setPosition(position: Vector3): this {
        this.hingeMesh.position.copyFrom(position);
        return this;
    }

    setRotation(rotation: Quaternion): this {
        this.hingeMesh.rotationQuaternion = rotation.clone();
        return this;
    }

    setMinAngle(angle: number | null) {
        this.minAngle = angle;
        return this;
    }

    setMaxAngle(angle: number | null) {
        this.maxAngle = angle;
        return this;
    }

    build() {
        const hingeAggregate = new PhysicsAggregate(
            this.hingeMesh,
            PhysicsShapeType.CYLINDER,
            { mass: 10 },
            this.scene,
        );

        this.doorMesh.setParent(null);

        const doorAggregate = new PhysicsAggregate(this.doorMesh, PhysicsShapeType.MESH, { mass: 100 }, this.scene);

        const joint = new Physics6DoFConstraint(
            {
                pivotA: Vector3.Zero(),
                pivotB: Vector3.Zero(),
            },
            [
                {
                    axis: PhysicsConstraintAxis.LINEAR_DISTANCE,
                    minLimit: 0,
                    maxLimit: 0,
                },
                {
                    axis: PhysicsConstraintAxis.ANGULAR_X,
                    minLimit: 0,
                    maxLimit: 0,
                },
                {
                    axis: PhysicsConstraintAxis.ANGULAR_Y,
                    ...(this.minAngle !== null ? { minLimit: this.minAngle } : {}),
                    ...(this.maxAngle !== null ? { maxLimit: this.maxAngle } : {}),
                },
                {
                    axis: PhysicsConstraintAxis.ANGULAR_Z,
                    minLimit: 0,
                    maxLimit: 0,
                },
            ],
            this.scene,
        );

        hingeAggregate.body.addConstraint(doorAggregate.body, joint);
        joint.setAxisMotorType(PhysicsConstraintAxis.ANGULAR_Y, PhysicsConstraintMotorType.VELOCITY);

        return new HingedDoor(doorAggregate, hingeAggregate, joint);
    }
}
