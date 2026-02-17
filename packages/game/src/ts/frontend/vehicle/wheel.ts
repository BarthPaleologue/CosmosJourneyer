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

import type { Material } from "@babylonjs/core/Materials/material";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import {
    PhysicsConstraintAxis,
    PhysicsConstraintMotorType,
    PhysicsShapeType,
} from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import type { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import { Physics6DoFConstraint } from "@babylonjs/core/Physics/v2/physicsConstraint";
import type { PhysicsShape } from "@babylonjs/core/Physics/v2/physicsShape";
import type { Scene } from "@babylonjs/core/scene";

import { CollisionMask } from "@/settings";

import { CreateTorusVertexData } from "../assets/procedural/helpers/torusBuilder";
import { filterVehicleShape } from "./filterVehicleShape";

export type WheelModel = {
    position: Vector3;
    geometry: {
        radius: number;
        thickness: number;
    };
    behavior: {
        powered: boolean;
        steerable: boolean;
    };
};

type WheelDraft = {
    model: WheelModel;
    wheelMesh: Mesh;
    axleMesh: Mesh;
    frameBody: PhysicsBody;
    scene: Scene;
};

export class Wheel {
    readonly radius: number;

    readonly wheelAxleConstraint: Physics6DoFConstraint;
    readonly steering: {
        position: "rear" | "front";
        constraint: Physics6DoFConstraint;
    } | null;
    readonly motor: Physics6DoFConstraint | null;

    readonly axle: {
        mesh: Mesh;
        body: PhysicsBody;
        shape: PhysicsShape;
    };

    readonly wheel: {
        mesh: Mesh;
        body: PhysicsBody;
        shape: PhysicsShape;
    };

    constructor({ model, wheelMesh, axleMesh, frameBody, scene }: WheelDraft) {
        const { radius, thickness } = model.geometry;
        const { powered, steerable } = model.behavior;

        const { physicsBody: axleBody, physicsShape: axleShape } = AddAxlePhysics(axleMesh, 190, 0, 0, scene);
        filterVehicleShape(axleShape, CollisionMask.VEHICLE_PARTS);

        this.axle = {
            mesh: axleMesh,
            body: axleBody,
            shape: axleShape,
        };

        this.radius = radius;

        const { physicsBody: wheelBody, physicsShape: wheelShape } = AddWheelPhysics(
            wheelMesh,
            radius,
            thickness,
            150,
            0.2,
            1.3,
            scene,
        );
        filterVehicleShape(wheelShape, CollisionMask.VEHICLE_PARTS);

        this.wheel = {
            mesh: wheelMesh,
            body: wheelBody,
            shape: wheelShape,
        };

        this.wheelAxleConstraint = AttachWheelToAxle(this.axle, this.wheel, scene);
        if (powered) {
            this.wheelAxleConstraint.setAxisMotorType(
                PhysicsConstraintAxis.ANGULAR_X,
                PhysicsConstraintMotorType.VELOCITY,
            );
            this.motor = this.wheelAxleConstraint;
        } else {
            this.motor = null;
        }

        const frameAxleConstraint = AttachAxleToFrame(this.axle.body, frameBody, scene, steerable);
        const frameInverseWorldMatrix = frameBody.transformNode.getWorldMatrix().clone().invert();
        const wheelPositionInFrameSpace = Vector3.TransformCoordinates(
            this.wheel.mesh.position,
            frameInverseWorldMatrix,
        );
        this.steering = steerable
            ? {
                  position: wheelPositionInFrameSpace.z > 0 ? "front" : "rear",
                  constraint: frameAxleConstraint,
              }
            : null;
    }

    dispose() {
        this.axle.body.dispose();
        this.axle.shape.dispose();
        this.axle.mesh.dispose();
        this.wheel.body.dispose();
        this.wheel.shape.dispose();
        this.wheel.mesh.dispose();

        this.wheelAxleConstraint.dispose();
        this.steering?.constraint.dispose();
    }
}

function AddAxlePhysics(mesh: Mesh, mass: number, bounce: number, friction: number, scene: Scene) {
    const aggregate = new PhysicsAggregate(
        mesh,
        PhysicsShapeType.BOX,
        {
            mass: mass,
            restitution: bounce,
            friction: friction,
        },
        scene,
    );
    const physicsBody = aggregate.body;
    const physicsShape = aggregate.shape;

    return { physicsBody, physicsShape };
}

function AddWheelPhysics(
    mesh: Mesh,
    radius: number,
    thickness: number,
    mass: number,
    bounce: number,
    friction: number,
    scene: Scene,
) {
    const aggregate = new PhysicsAggregate(
        mesh,
        PhysicsShapeType.CYLINDER,
        {
            mass: mass,
            restitution: bounce,
            friction: friction,
            pointA: new Vector3(-thickness / 2, 0, 0),
            pointB: new Vector3(thickness / 2, 0, 0),
            radius: radius,
        },
        scene,
    );
    const physicsBody = aggregate.body;
    const physicsShape = aggregate.shape;

    return { physicsBody, physicsShape };
}

function AttachWheelToAxle(
    axle: { mesh: Mesh; body: PhysicsBody },
    wheel: { mesh: Mesh; body: PhysicsBody },
    scene: Scene,
) {
    const motorJoint = new Physics6DoFConstraint(
        {},
        [
            {
                axis: PhysicsConstraintAxis.LINEAR_DISTANCE,
                minLimit: 0,
                maxLimit: 0,
            },
            {
                axis: PhysicsConstraintAxis.ANGULAR_Y,
                minLimit: 0,
                maxLimit: 0,
            },
            {
                axis: PhysicsConstraintAxis.ANGULAR_Z,
                minLimit: 0,
                maxLimit: 0,
            },
        ],
        scene,
    );

    axle.body.addConstraint(wheel.body, motorJoint);

    return motorJoint;
}

function AttachAxleToFrame(axle: PhysicsBody, frame: PhysicsBody, scene: Scene, steerable = false) {
    const frameInverseWorldMatrix = frame.transformNode.getWorldMatrix().clone().invert();

    const axlePosition = axle.transformNode.position;
    const axlePositionInFrameSpace = Vector3.TransformCoordinates(axlePosition, frameInverseWorldMatrix);

    const joint = new Physics6DoFConstraint(
        {
            pivotA: new Vector3(0, 0, 0),
            pivotB: axlePositionInFrameSpace,
        },
        [
            {
                axis: PhysicsConstraintAxis.LINEAR_X,
                minLimit: 0,
                maxLimit: 0,
            },
            {
                // Suspension
                axis: PhysicsConstraintAxis.LINEAR_Y,
                minLimit: -0.15,
                maxLimit: 0.15,
                stiffness: 100000,
                damping: 4000,
            },
            {
                axis: PhysicsConstraintAxis.LINEAR_Z,
                minLimit: 0,
                maxLimit: 0,
            },
            {
                // Angular leeway X
                axis: PhysicsConstraintAxis.ANGULAR_X,
                minLimit: -0.25,
                maxLimit: 0.25,
            },
            {
                // Steering
                axis: PhysicsConstraintAxis.ANGULAR_Y,
                ...(steerable ? {} : { minLimit: 0, maxLimit: 0 }),
            },
            {
                // Angular leeway Z
                axis: PhysicsConstraintAxis.ANGULAR_Z,
                minLimit: -0.05,
                maxLimit: 0.05,
            },
        ],
        scene,
    );

    axle.addConstraint(frame, joint);

    if (steerable) {
        joint.setAxisMotorType(PhysicsConstraintAxis.ANGULAR_Y, PhysicsConstraintMotorType.POSITION);
    }

    return joint;
}

export function CreateAxle(position: Vector3, radius: number, scene: Scene) {
    const axleMesh = MeshBuilder.CreateCylinder("Axle", { diameter: radius * 0.7 * 2, height: radius }, scene);
    axleMesh.rotation = new Vector3(0, 0, Math.PI / 2);
    axleMesh.bakeCurrentTransformIntoVertices();
    axleMesh.position.copyFrom(position);

    return axleMesh;
}

export function CreateWheel(
    position: Vector3,
    radius: number,
    thickness: number,
    materials: {
        wheel: Material;
        tire: Material;
    },
    scene: Scene,
) {
    const rimRadius = radius * 0.6;
    const tireRadius = radius - rimRadius;

    const wheelMesh = MeshBuilder.CreateCylinder("Wheel", { height: thickness, diameter: rimRadius * 2 }, scene);
    wheelMesh.rotation = new Vector3(0, 0, Math.PI / 2);

    const tireVertexData = CreateTorusVertexData({
        diameter: rimRadius * 2,
        thickness: tireRadius * 2,
        tessellation: 64,
        minorLpExponent: 5,
        sideOrientation: VertexData.BACKSIDE,
    });

    const tireMesh = new Mesh("Tire", scene);
    tireVertexData.applyToMesh(tireMesh, false);
    tireMesh.scaling.y = thickness / (2.0 * tireRadius);
    tireMesh.material = materials.tire;
    tireMesh.parent = wheelMesh;

    wheelMesh.material = materials.wheel;
    wheelMesh.bakeCurrentTransformIntoVertices();
    wheelMesh.position.copyFrom(position);

    return wheelMesh;
}
