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
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
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

import { CreateTorusVertexData } from "../assets/procedural/helpers/torusBuilder";
import type { RenderingAssets } from "../assets/renderingAssets";
import { Vehicle } from "./vehicle";

type PartFixedConnection = {
    type: "fixed";
    rotation?: {
        x?: number;
        y?: number;
        z?: number;
    };
};

type PartHingeConnection = {
    type: "hinge";
    axis: "x" | "y" | "z";
    range: {
        min: number;
        max: number;
    };
};

type PartConnection = PartFixedConnection | PartHingeConnection;

export class VehicleBuilder {
    private readonly frame: Mesh;

    private readonly wheels: Array<{
        position: Vector3;
        radius: number;
        thickness: number;
        powered: boolean;
        steerable: boolean;
        mesh: Mesh;
        axleMesh: Mesh;
    }> = [];

    private readonly parts: Array<{
        mesh: Mesh;
        mass: number;
        connection: PartConnection;
    }> = [];

    private spawnPosition = Vector3.Zero();

    private spawnRotation = Quaternion.Identity();

    private readonly assets: RenderingAssets;

    private readonly scene: Scene;

    constructor(frame: Mesh, assets: RenderingAssets, scene: Scene) {
        this.frame = frame;
        this.assets = assets;
        this.scene = scene;
    }

    addWheel(position: Vector3, radius: number, thickness: number, powered: boolean, steerable: boolean): this {
        const wheelMesh = CreateWheel(
            position,
            radius,
            thickness,
            {
                wheel: this.assets.materials.crate.get(),
                tire: this.assets.materials.tire.get(),
            },
            this.scene,
        );
        const axleMesh = CreateAxle(position, radius, this.scene);
        this.wheels.push({ position, radius, thickness, powered, steerable, mesh: wheelMesh, axleMesh: axleMesh });
        return this;
    }

    addPart(part: Mesh, position: Vector3, mass: number, connection: PartConnection): this {
        part.parent = this.frame;
        part.position = position;

        this.parts.push({ mesh: part, mass, connection });

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
            transforms.push(wheel.mesh);
            transforms.push(wheel.axleMesh);
        }

        return transforms;
    }

    assemble(): Vehicle {
        const frameAggregate = new PhysicsAggregate(this.frame, PhysicsShapeType.MESH, {
            mass: 2000,
            restitution: 0,
            friction: 1,
            center: new Vector3(0, -2.5, 0),
        });
        FilterMeshCollisions(frameAggregate.shape);

        for (const { mesh, mass, connection } of this.parts) {
            const positionInFrameSpace = mesh.position.clone();
            mesh.setParent(null);
            const partAggregate = new PhysicsAggregate(mesh, PhysicsShapeType.MESH, { mass }, this.scene);
            FilterMeshCollisions(partAggregate.shape);

            let joint: Physics6DoFConstraint;
            switch (connection.type) {
                case "fixed":
                    joint = new Physics6DoFConstraint(
                        {
                            pivotA: positionInFrameSpace,
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
                                minLimit: connection.rotation?.x ?? 0,
                                maxLimit: connection.rotation?.x ?? 0,
                            },
                            {
                                axis: PhysicsConstraintAxis.ANGULAR_Y,
                                minLimit: connection.rotation?.y ?? 0,
                                maxLimit: connection.rotation?.y ?? 0,
                            },
                            {
                                axis: PhysicsConstraintAxis.ANGULAR_Z,
                                minLimit: connection.rotation?.z ?? 0,
                                maxLimit: connection.rotation?.z ?? 0,
                            },
                        ],
                        this.scene,
                    );

                    frameAggregate.body.addConstraint(partAggregate.body, joint);
                    break;
                case "hinge":
                    joint = new Physics6DoFConstraint(
                        {
                            pivotA: positionInFrameSpace,
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
                                minLimit: connection.axis === "x" ? connection.range.min : 0,
                                maxLimit: connection.axis === "x" ? connection.range.max : 0,
                            },
                            {
                                axis: PhysicsConstraintAxis.ANGULAR_Y,
                                minLimit: connection.axis === "y" ? connection.range.min : 0,
                                maxLimit: connection.axis === "y" ? connection.range.max : 0,
                            },
                            {
                                axis: PhysicsConstraintAxis.ANGULAR_Z,
                                minLimit: connection.axis === "z" ? connection.range.min : 0,
                                maxLimit: connection.axis === "z" ? connection.range.max : 0,
                            },
                        ],
                        this.scene,
                    );

                    frameAggregate.body.addConstraint(partAggregate.body, joint);

                    joint.setAxisMotorType(PhysicsConstraintAxis.ANGULAR_X, PhysicsConstraintMotorType.VELOCITY);
                    joint.setAxisMotorTarget(PhysicsConstraintAxis.ANGULAR_X, -1.0);
                    joint.setAxisMotorMaxForce(PhysicsConstraintAxis.ANGULAR_X, 100 * mass);
                    break;
            }
        }

        const motorConstraints: Array<Physics6DoFConstraint> = [];
        const steeringConstraints: Array<{ position: "rear" | "front"; constraint: Physics6DoFConstraint }> = [];
        for (const wheel of this.wheels) {
            const { physicsBody: axleBody, physicsShape: axleShape } = AddAxlePhysics(
                wheel.axleMesh,
                wheel.radius,
                190,
                0,
                0,
                this.scene,
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
                1.5,
                this.scene,
            );
            FilterMeshCollisions(wheelShape);

            const wheelObj = {
                mesh: wheel.mesh,
                physicsBody: wheelBody,
                physicsShape: wheelShape,
            };

            const wheelAxleConstraint = AttachWheelToAxle(axle, wheelObj, this.scene);
            if (wheel.powered) {
                wheelAxleConstraint.setAxisMotorType(
                    PhysicsConstraintAxis.ANGULAR_X,
                    PhysicsConstraintMotorType.VELOCITY,
                );
            }

            const frameAxleConstraint = AttachAxleToFrame(
                axle.physicsBody,
                frameAggregate.body,
                this.scene,
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
