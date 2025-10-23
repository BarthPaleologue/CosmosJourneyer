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
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import {
    PhysicsConstraintAxis,
    PhysicsConstraintMotorType,
    PhysicsShapeType,
} from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { type PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import { Physics6DoFConstraint } from "@babylonjs/core/Physics/v2/physicsConstraint";
import { type PhysicsShape } from "@babylonjs/core/Physics/v2/physicsShape";
import type { Scene } from "@babylonjs/core/scene";

import { CollisionMask } from "@/settings";

import { Vehicle } from "./vehicle";

export class VehicleBuilder {
    private readonly frame: Mesh;

    private readonly wheels: Array<{
        position: Vector3;
        radius: number;
        thickness: number;
        powered: boolean;
        steerable: boolean;
        mesh?: Mesh;
        axleMesh?: Mesh;
    }> = [];

    private spawnPosition = Vector3.Zero();

    private spawnRotation = Quaternion.Identity();

    constructor(frame: Mesh) {
        this.frame = frame;
    }

    addWheel(position: Vector3, radius: number, thickness: number, powered: boolean, steerable: boolean): this {
        this.wheels.push({ position, radius, thickness, powered, steerable });
        return this;
    }

    build(assets: { tireMaterial: Material }, scene: Scene): this {
        for (const wheel of this.wheels) {
            wheel.mesh = CreateWheel(wheel.position, wheel.radius, wheel.thickness, assets.tireMaterial, scene);
            wheel.axleMesh = CreateAxle(wheel.position, wheel.radius, scene);
        }

        return this;
    }

    public translateSpawn(position: Vector3): this {
        this.spawnPosition = position;
        const transforms = this.getTransforms();
        for (const transform of transforms) {
            transform.position.addInPlace(this.spawnPosition);
        }

        return this;
    }

    public rotateSpawn(axis: Vector3, angle: number): this {
        const transforms = this.getTransforms();
        for (const transform of transforms) {
            transform.rotateAround(this.spawnPosition, axis, angle);
        }

        this.spawnRotation = Quaternion.RotationAxis(axis, angle).multiply(this.spawnRotation);

        return this;
    }

    private getTransforms(): Array<TransformNode> {
        const transforms: Array<TransformNode> = [];
        transforms.push(this.frame);
        for (const wheel of this.wheels) {
            if (wheel.mesh !== undefined) {
                transforms.push(wheel.mesh);
            }
            if (wheel.axleMesh !== undefined) {
                transforms.push(wheel.axleMesh);
            }
        }

        return transforms;
    }

    assemble(scene: Scene): Vehicle {
        const frameAggregate = new PhysicsAggregate(this.frame, PhysicsShapeType.MESH, {
            mass: 2000,
            restitution: 0,
            friction: 0,
            center: new Vector3(0, -2.5, 0),
        });
        FilterMeshCollisions(frameAggregate.shape);

        const motorConstraints: Array<Physics6DoFConstraint> = [];
        const steeringConstraints: Array<{ position: "rear" | "front"; constraint: Physics6DoFConstraint }> = [];
        for (const wheel of this.wheels) {
            if (wheel.mesh === undefined || wheel.axleMesh === undefined) {
                throw new Error("VehicleBuilder: Wheel or axle mesh is undefined. Did you forget to call build()?");
            }

            const { physicsBody: axleBody, physicsShape: axleShape } = AddAxlePhysics(
                wheel.axleMesh,
                wheel.radius,
                190,
                0,
                0,
                scene,
            );
            FilterMeshCollisions(axleShape);

            const axle = {
                mesh: wheel.axleMesh,
                physicsBody: axleBody,
                physicsShape: axleShape,
            };

            const { physicsBody: wheelBody, physicsShape: wheelShape } = AddWheelPhysics(
                wheel.mesh,
                wheel.radius,
                wheel.thickness,
                150,
                0,
                2.5,
                scene,
            );
            FilterMeshCollisions(wheelShape);

            const wheelObj = {
                mesh: wheel.mesh,
                physicsBody: wheelBody,
                physicsShape: wheelShape,
            };

            const wheelAxleConstraint = AttachWheelToAxle(axle, wheelObj, scene);
            if (wheel.powered) {
                wheelAxleConstraint.setAxisMotorType(
                    PhysicsConstraintAxis.ANGULAR_X,
                    PhysicsConstraintMotorType.VELOCITY,
                );
            }

            const frameAxleConstraint = AttachAxleToFrame(
                axle.physicsBody,
                frameAggregate.body,
                scene,
                wheel.steerable,
            );

            if (wheel.steerable) {
                const positionLabel = wheel.position.z > 0 ? "front" : "rear";
                steeringConstraints.push({ position: positionLabel, constraint: frameAxleConstraint });
            }

            if (wheel.powered) {
                motorConstraints.push(wheelAxleConstraint);
            }
        }

        return new Vehicle(
            {
                mesh: this.frame,
                physicsBody: frameAggregate.body,
                physicsShape: frameAggregate.shape,
            },
            motorConstraints,
            steeringConstraints,
        );
    }
}

export function FilterMeshCollisions(shape: PhysicsShape) {
    shape.filterMembershipMask = CollisionMask.VEHICLE_PARTS;
    shape.filterCollideMask = CollisionMask.EVERYTHING & ~CollisionMask.VEHICLE_PARTS;
}

export function AddWheelPhysics(
    mesh: Mesh,
    radius: number,
    thickness: number,
    mass: number,
    bounce: number,
    friction: number,
    scene: Scene,
) {
    /*const physicsShape = new PhysicsShapeCylinder(new Vector3(-0.8, 0, 0), new Vector3(0.8, 0, 0), radius, scene);
    const physicsBody = new PhysicsBody(mesh, PhysicsMotionType.DYNAMIC, false, scene);
    physicsBody.setMassProperties({ mass: mass });
    physicsShape.material = { restitution: bounce, friction: friction };
    physicsBody.shape = physicsShape;*/

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

export function AddAxlePhysics(
    mesh: Mesh,
    wheelRadius: number,
    mass: number,
    bounce: number,
    friction: number,
    scene: Scene,
) {
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

export function CreateAxle(position: Vector3, radius: number, scene: Scene) {
    const axleMesh = MeshBuilder.CreateCylinder("Axle", { diameter: radius * 0.5 * 2, height: radius }, scene);
    axleMesh.rotation = new Vector3(0, 0, Math.PI / 2);
    axleMesh.bakeCurrentTransformIntoVertices();
    axleMesh.position.copyFrom(position);

    return axleMesh;
}

export function CreateWheel(
    position: Vector3,
    radius: number,
    thickness: number,
    tireMaterial: Material,
    scene: Scene,
) {
    const rimRadius = radius * 0.5;
    const tireThickness = thickness;

    const wheelThickness = tireThickness * 2;
    const wheelMesh = MeshBuilder.CreateCylinder(
        "Wheel",
        { height: wheelThickness / 5, diameter: rimRadius * 2 },
        scene,
    );
    wheelMesh.rotation = new Vector3(0, 0, Math.PI / 2);

    const tireMesh = MeshBuilder.CreateTorus(
        "Tire",
        { diameter: rimRadius * 2, thickness: tireThickness, tessellation: 24 },
        scene,
    );
    tireMesh.material = tireMaterial;
    tireMesh.parent = wheelMesh;

    wheelMesh.bakeCurrentTransformIntoVertices();
    wheelMesh.position.copyFrom(position);

    return wheelMesh;
}

export function AttachAxleToFrame(axle: PhysicsBody, frame: PhysicsBody, scene: Scene, steerable = false) {
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

    axle.physicsBody.addConstraint(wheel.physicsBody, motorJoint);

    return motorJoint;
}
