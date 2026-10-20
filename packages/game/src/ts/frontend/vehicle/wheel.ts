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
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
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

const SteerableAxleAngleLimit = Math.PI / 3;

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
    axleMesh: TransformNode;
    frameBody: PhysicsBody;
    scene: Scene;
};

export class Wheel {
    readonly radius: number;

    /** Immutable geometry relative to the chassis, independent of its world pose. */
    readonly frameLocalPosition: Readonly<Pick<Vector3, "x" | "y" | "z">>;

    readonly wheelAxleConstraint: Physics6DoFConstraint;
    readonly steering: {
        position: "rear" | "front";
        constraint: Physics6DoFConstraint;
    } | null;
    readonly motor: Physics6DoFConstraint | null;

    readonly axle: {
        mesh: TransformNode;
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
        this.frameLocalPosition = Object.freeze(model.position.clone());

        const { physicsBody: wheelBody, physicsShape: wheelShape } = AddWheelPhysics(
            wheelMesh,
            radius,
            thickness,
            150,
            0.2,
            3,
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
        this.steering = steerable
            ? {
                  position: this.frameLocalPosition.z > 0 ? "front" : "rear",
                  constraint: frameAxleConstraint,
              }
            : null;
    }

    dispose(): void {
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

/**
 * Creates a box collision body and shape for an axle mesh.
 * @param mesh Axle transform used by the physics body.
 * @param mass Axle mass in kilograms.
 * @param bounce Restitution coefficient for axle collisions.
 * @param friction Friction coefficient for axle collisions.
 * @param scene Scene that owns the physics aggregate.
 * @returns The axle's physics body and collision shape.
 */
function AddAxlePhysics(
    mesh: TransformNode,
    mass: number,
    bounce: number,
    friction: number,
    scene: Scene,
): { physicsBody: PhysicsBody; physicsShape: PhysicsShape } {
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

/**
 * Creates a cylindrical collision body and shape for a wheel mesh.
 * @param mesh Wheel mesh used by the physics body.
 * @param radius Wheel radius in world units.
 * @param thickness Wheel thickness in world units.
 * @param mass Wheel mass in kilograms.
 * @param bounce Restitution coefficient for wheel collisions.
 * @param friction Friction coefficient for wheel collisions.
 * @param scene Scene that owns the physics aggregate.
 * @returns The wheel's physics body and collision shape.
 */
function AddWheelPhysics(
    mesh: Mesh,
    radius: number,
    thickness: number,
    mass: number,
    bounce: number,
    friction: number,
    scene: Scene,
): { physicsBody: PhysicsBody; physicsShape: PhysicsShape } {
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

/**
 * Connects a wheel to its axle while allowing wheel rotation around the axle.
 * @param axle Axle transform and physics body.
 * @param axle.mesh Transform node for the axle.
 * @param axle.body Physics body for the axle.
 * @param wheel Wheel mesh and physics body.
 * @param wheel.mesh Mesh for the wheel.
 * @param wheel.body Physics body for the wheel.
 * @param scene Scene that owns the constraint.
 * @returns The wheel-to-axle constraint.
 */
function AttachWheelToAxle(
    axle: { mesh: TransformNode; body: PhysicsBody },
    wheel: { mesh: Mesh; body: PhysicsBody },
    scene: Scene,
): Physics6DoFConstraint {
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

/**
 * Connects an axle to the vehicle frame with suspension and optional steering.
 * @param axle Physics body for the axle.
 * @param frame Physics body for the vehicle frame.
 * @param scene Scene that owns the constraint.
 * @param steerable Whether the axle can rotate to steer.
 * @returns The axle-to-frame constraint.
 */
function AttachAxleToFrame(
    axle: PhysicsBody,
    frame: PhysicsBody,
    scene: Scene,
    steerable = false,
): Physics6DoFConstraint {
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
                minLimit: -0.35,
                maxLimit: 0.35,
                stiffness: 45_000,
                damping: 5_000,
            },
            {
                axis: PhysicsConstraintAxis.LINEAR_Z,
                minLimit: 0,
                maxLimit: 0,
            },
            {
                // Lock support pitch so suspension cannot swing fore/aft.
                // Wheel spin remains free in the wheel/axle joint.
                axis: PhysicsConstraintAxis.ANGULAR_X,
                minLimit: 0,
                maxLimit: 0,
            },
            {
                // Steering
                axis: PhysicsConstraintAxis.ANGULAR_Y,
                minLimit: steerable ? -SteerableAxleAngleLimit : 0,
                maxLimit: steerable ? SteerableAxleAngleLimit : 0,
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

/**
 * Creates the transform node used to render and attach an axle.
 * @param position Axle center in vehicle-local coordinates.
 * @param radius Axle radius in world units.
 * @param scene Scene that owns the axle mesh.
 * @returns The axle transform node.
 */
export function CreateAxle(position: Vector3, radius: number, scene: Scene): TransformNode {
    const axleMesh = new TransformNode("Axle", scene);
    axleMesh.rotation = new Vector3(0, 0, Math.PI / 2);
    axleMesh.position.copyFrom(position);

    return axleMesh;
}

/**
 * Creates a wheel mesh with separate materials for its wheel and tire.
 * @param position Wheel center in vehicle-local coordinates.
 * @param radius Wheel radius in world units.
 * @param thickness Wheel thickness in world units.
 * @param materials Materials applied to the wheel and tire surfaces.
 * @param materials.wheel Material for the wheel body.
 * @param materials.tire Material for the tire surface.
 * @param scene Scene that owns the mesh.
 * @returns The configured wheel mesh.
 */
export function CreateWheel(
    position: Vector3,
    radius: number,
    thickness: number,
    materials: {
        wheel: Material;
        tire: Material;
    },
    scene: Scene,
): Mesh {
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
