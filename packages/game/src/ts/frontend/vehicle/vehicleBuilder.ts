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

import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsConstraintAxis, PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { Physics6DoFConstraint } from "@babylonjs/core/Physics/v2/physicsConstraint";
import type { Scene } from "@babylonjs/core/scene";

import { CollisionMask } from "@/settings";

import type { RenderingAssets } from "../assets/renderingAssets";
import type { Door } from "./door";
import { filterVehicleShape } from "./filterVehicleShape";
import { HingedDoor } from "./hingedDoor";
import { Vehicle } from "./vehicle";
import { CreateAxle, CreateWheel, Wheel, type WheelModel } from "./wheel";

type FixationModel = {
    rotation?: {
        x?: number;
        y?: number;
        z?: number;
    };
};

//type PartConnection = PartFixedConnection | PartHingeConnection;

export class VehicleBuilder {
    private readonly frame: Mesh;

    private readonly wheels: Array<{
        model: WheelModel;
        mesh: Mesh;
        axleMesh: Mesh;
    }> = [];

    private readonly fixedParts: Array<{
        mesh: Mesh;
        mass: number;
        connection: FixationModel;
    }> = [];

    private readonly hingedDoorParts: Array<{
        doorMesh: Mesh;
        mass: number;
        axis: PhysicsConstraintAxis;
        angles: { closed: number; opened: number };
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

    addWheel(model: WheelModel): this {
        const { position } = model;
        const { radius, thickness } = model.geometry;

        const wheelMesh = CreateWheel(
            Vector3.Zero(),
            radius,
            thickness,
            {
                wheel: this.assets.materials.crate.get(),
                tire: this.assets.materials.tire.get(),
            },
            this.scene,
        );
        const axleMesh = CreateAxle(Vector3.Zero(), radius, this.scene);
        wheelMesh.parent = this.frame;
        axleMesh.parent = this.frame;
        wheelMesh.position.copyFrom(position);
        axleMesh.position.copyFrom(position);
        this.wheels.push({
            model: {
                position: position.clone(),
                geometry: {
                    radius,
                    thickness,
                },
                behavior: {
                    powered: model.behavior.powered,
                    steerable: model.behavior.steerable,
                },
            },
            mesh: wheelMesh,
            axleMesh: axleMesh,
        });
        return this;
    }

    addFixedPart(part: Mesh, position: Vector3, mass: number, connection: FixationModel): this {
        part.parent = this.frame;
        part.position = position;

        this.fixedParts.push({ mesh: part, mass, connection });

        return this;
    }

    addHingedDoor(
        doorMesh: Mesh,
        position: Vector3,
        mass: number,
        axis: PhysicsConstraintAxis,
        angles: { closed: number; opened: number },
    ): this {
        doorMesh.parent = this.frame;
        doorMesh.position = position;

        this.hingedDoorParts.push({ doorMesh, mass, axis, angles });
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

    public rotateSpawn(rotation: Quaternion): this {
        const { axis, angle } = rotation.toAxisAngle();
        const transforms = this.getTransforms();
        for (const transform of transforms) {
            transform.rotateAround(this.spawnPosition, axis, angle);
        }

        this.spawnRotation = Quaternion.RotationAxis(axis, angle).multiply(this.spawnRotation);

        return this;
    }

    private getTransforms(): Array<TransformNode> {
        return [this.frame];
    }

    build(): Vehicle {
        const frameAggregate = new PhysicsAggregate(this.frame, PhysicsShapeType.MESH, {
            mass: 2000,
            restitution: 0,
            friction: 1,
            center: new Vector3(0, -2.5, 0),
        });
        filterVehicleShape(frameAggregate.shape, CollisionMask.VEHICLE_PARTS);

        for (const { mesh, mass, connection } of this.fixedParts) {
            const positionInFrameSpace = mesh.position.clone();
            mesh.setParent(null);
            const partAggregate = new PhysicsAggregate(mesh, PhysicsShapeType.MESH, { mass }, this.scene);
            filterVehicleShape(partAggregate.shape, CollisionMask.VEHICLE_PARTS);

            const joint = new Physics6DoFConstraint(
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
        }

        const doors: Array<Door> = [];
        for (const { doorMesh, mass, axis, angles } of this.hingedDoorParts) {
            const positionInFrameSpace = doorMesh.position.clone();
            doorMesh.setParent(null);
            const doorAggregate = new PhysicsAggregate(doorMesh, PhysicsShapeType.MESH, { mass }, this.scene);
            filterVehicleShape(doorAggregate.shape, CollisionMask.VEHICLE_PARTS);

            const joint = new Physics6DoFConstraint(
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
                    /*{
                axis: PhysicsConstraintAxis.ANGULAR_X,
                minLimit: 0,
                maxLimit: 0,
            },*/
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
                this.scene,
            );

            frameAggregate.body.addConstraint(doorAggregate.body, joint);

            const door = new HingedDoor(doorAggregate, joint, axis, angles);

            doors.push(door);
        }

        const physicWheels: Array<Wheel> = [];
        for (const wheel of this.wheels) {
            wheel.mesh.setParent(null);
            wheel.axleMesh.setParent(null);
            const physicWheel = new Wheel({
                model: wheel.model,
                wheelMesh: wheel.mesh,
                axleMesh: wheel.axleMesh,
                frameBody: frameAggregate.body,
                scene: this.scene,
            });

            physicWheels.push(physicWheel);
        }

        return new Vehicle(frameAggregate, doors, physicWheels);
    }
}
