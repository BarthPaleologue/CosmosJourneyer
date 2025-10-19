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
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import {
    PhysicsConstraintAxis,
    PhysicsConstraintMotorType,
    PhysicsMotionType,
} from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import { Physics6DoFConstraint } from "@babylonjs/core/Physics/v2/physicsConstraint";
import { PhysicsShapeCylinder, type PhysicsShape } from "@babylonjs/core/Physics/v2/physicsShape";
import type { Scene } from "@babylonjs/core/scene";

import { CollisionMask } from "@/settings";

import { Vehicle } from "./vehicle";

export class VehicleBuilder {
    private readonly frame: { mesh: Mesh; physicsBody: PhysicsBody; physicsShape: PhysicsShape };

    private readonly wheels: Array<{
        position: Vector3;
        radius: number;
        powered: boolean;
        steerable: boolean;
    }> = [];

    constructor(frame: { mesh: Mesh; physicsBody: PhysicsBody; physicsShape: PhysicsShape }) {
        this.frame = frame;
    }

    addWheel(position: Vector3, radius: number, powered: boolean, steerable: boolean): this {
        this.wheels.push({ position, radius, powered, steerable });
        return this;
    }

    build(assets: { tireMaterial: Material }, scene: Scene): Vehicle {
        const motorConstraints: Array<Physics6DoFConstraint> = [];
        const steeringConstraints: Array<{ position: "rear" | "front"; constraint: Physics6DoFConstraint }> = [];
        for (const { position, radius, powered, steerable } of this.wheels) {
            const wheelAxle = CreateWheelAxleAggregate(
                position,
                radius,
                powered,
                steerable,
                assets.tireMaterial,
                scene,
            );
            if (powered) {
                motorConstraints.push(wheelAxle.wheelAxleConstraint);
            }

            this.frame.mesh.addChild(wheelAxle.axle.mesh);

            const frameAxleConstraint = AttachAxleToFrame(
                wheelAxle.axle.physicsBody,
                this.frame.physicsBody,
                scene,
                steerable,
            );
            if (steerable) {
                const positionLabel = position.z > 0 ? "front" : "rear";
                steeringConstraints.push({ position: positionLabel, constraint: frameAxleConstraint });
            }
        }

        return new Vehicle(this.frame, motorConstraints, steeringConstraints);
    }
}

export function FilterMeshCollisions(shape: PhysicsShape) {
    shape.filterMembershipMask = CollisionMask.VEHICLE_PARTS;
    shape.filterCollideMask = CollisionMask.EVERYTHING & ~CollisionMask.VEHICLE_PARTS;
}

export type WheelAxleAggregate = {
    wheel: { mesh: Mesh; physicsBody: PhysicsBody; physicsShape: PhysicsShape };
    axle: { mesh: Mesh; physicsBody: PhysicsBody; physicsShape: PhysicsShape };
    wheelAxleConstraint: Physics6DoFConstraint;
    powered: boolean;
    steerable: boolean;
};

export function CreateWheelAxleAggregate(
    position: Vector3,
    radius: number,
    powered: boolean,
    steerable: boolean,
    tireMaterial: Material,
    scene: Scene,
): WheelAxleAggregate {
    const axleMesh = CreateAxle(position, radius, scene);
    const { physicsBody: axleBody, physicsShape: axleShape } = AddAxlePhysics(axleMesh, radius, 190, 0, 0, scene);
    FilterMeshCollisions(axleShape);

    const axle = {
        mesh: axleMesh,
        physicsBody: axleBody,
        physicsShape: axleShape,
    };

    const wheelMesh = CreateWheel(position, radius, tireMaterial, scene);
    const { physicsBody: wheelBody, physicsShape: wheelShape } = AddWheelPhysics(wheelMesh, radius, 150, 0, 2.5, scene);
    FilterMeshCollisions(wheelShape);

    const wheel = {
        mesh: wheelMesh,
        physicsBody: wheelBody,
        physicsShape: wheelShape,
    };

    const wheelAxleConstraint = AttachWheelToAxle(axle, wheel, scene);
    if (powered) {
        wheelAxleConstraint.setAxisMotorType(PhysicsConstraintAxis.ANGULAR_X, PhysicsConstraintMotorType.VELOCITY);
    }

    return {
        wheel,
        axle,
        wheelAxleConstraint,
        powered,
        steerable,
    };
}

export function AddWheelPhysics(
    mesh: Mesh,
    radius: number,
    mass: number,
    bounce: number,
    friction: number,
    scene: Scene,
) {
    const physicsShape = new PhysicsShapeCylinder(new Vector3(-0.8, 0, 0), new Vector3(0.8, 0, 0), radius, scene);
    const physicsBody = new PhysicsBody(mesh, PhysicsMotionType.DYNAMIC, false, scene);
    physicsBody.setMassProperties({ mass: mass });
    physicsShape.material = { restitution: bounce, friction: friction };
    physicsBody.shape = physicsShape;

    return { physicsBody, physicsShape };
}

export function AddAxlePhysics(
    mesh: Mesh,
    wheelRadius: number,
    mass: number,
    bounce: number,
    friction: number,
    scene: Scene,
) {
    //
    // NOTE: Making the axle shape similar dimensions to the wheel shape increases stability of the joint when it is added
    //
    const physicsShape = new PhysicsShapeCylinder(
        new Vector3(-0.8, 0, 0),
        new Vector3(0.8, 0, 0),
        wheelRadius * 0.9,
        scene,
    );
    const physicsBody = new PhysicsBody(mesh, PhysicsMotionType.DYNAMIC, false, scene);
    physicsBody.setMassProperties({ mass: mass });
    physicsShape.material = { restitution: bounce, friction: friction };
    physicsBody.shape = physicsShape;

    return { physicsBody, physicsShape };
}

export function CreateAxle(position: Vector3, radius: number, scene: Scene) {
    const axleMesh = MeshBuilder.CreateCylinder("Axle", { diameter: radius * 0.1 * 2, height: radius }, scene);
    axleMesh.rotation = new Vector3(0, 0, Math.PI / 2);
    axleMesh.bakeCurrentTransformIntoVertices();
    axleMesh.position.copyFrom(position);

    return axleMesh;
}

export function CreateWheel(position: Vector3, radius: number, tireMaterial: Material, scene: Scene) {
    const rimRadius = radius * 0.5;
    const tireThickness = radius - rimRadius;

    const wheelThickness = tireThickness * 2;
    const wheelMesh = MeshBuilder.CreateCylinder(
        "Wheel",
        { height: wheelThickness / 5, diameter: rimRadius * 2 },
        scene,
    );
    wheelMesh.rotation = new Vector3(0, 0, Math.PI / 2);

    const tireMesh = MeshBuilder.CreateTorus(
        "Tire",
        { diameter: rimRadius * 2, thickness: tireThickness * 2, tessellation: 24 },
        scene,
    );
    tireMesh.material = tireMaterial;
    tireMesh.parent = wheelMesh;

    wheelMesh.bakeCurrentTransformIntoVertices();
    wheelMesh.position.copyFrom(position);

    return wheelMesh;
}

export function AttachAxleToFrame(axle: PhysicsBody, frame: PhysicsBody, scene: Scene, steerable = false) {
    const aPos = axle.transformNode.position;

    const joint = new Physics6DoFConstraint(
        {
            pivotA: new Vector3(0, 0, 0),
            pivotB: new Vector3(aPos.x, aPos.y, aPos.z),
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

function AttachWheelToAxle(
    axle: { mesh: Mesh; physicsBody: PhysicsBody },
    wheel: { mesh: Mesh; physicsBody: PhysicsBody },
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

    axle.mesh.addChild(wheel.mesh);
    axle.physicsBody.addConstraint(wheel.physicsBody, motorJoint);

    return motorJoint;
}
