//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { AbstractMesh, InstancedMesh, Mesh, MeshBuilder } from "@babylonjs/core/Meshes";
import { Assets } from "../assets";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { IPhysicsCollisionEvent, PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsShapeMesh } from "@babylonjs/core/Physics/v2/physicsShape";
import { Scene } from "@babylonjs/core/scene";
import { Observable } from "@babylonjs/core/Misc/observable";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { Thruster } from "./thruster";
import { Matrix, inverse } from "ml-matrix";
import { buildThrusterMatrix, getThrusterConfiguration } from "./thrusterMatrix";
import { clamp } from "terrain-generation";
import { Input, InputType } from "../inputs/input";
import { Keyboard } from "../inputs/keyboard";

export class Spaceship {
    readonly instanceRoot: InstancedMesh;

    private aggregate: PhysicsAggregate | null = null;

    private collisionObservable: Observable<IPhysicsCollisionEvent> | null = null;

    private inputs: Input[] = [];

    private mainThrustersRunning = false;
    private hoverThrustersRunning = false;

    private mainThrusters: Thruster[] = [];
    private hoverThrusters: Thruster[] = [];

    private allThrusters: Thruster[] = [];

    private otherMeshes: AbstractMesh[] = [];

    //private centerOfMassHelper: Mesh;

    private targetThrustHelper: Mesh | null = null;

    private readonly hoverThrusterMatrix: Matrix;
    private readonly inverseHoverThrusterMatrix: Matrix;

    constructor(scene: Scene, inputs: Input[]) {
        if (!Assets.IS_READY) throw new Error("Assets are not ready yet!");
        this.instanceRoot = Assets.CreateEndeavorSpaceShipInstance();
        this.inputs = inputs;

        /*const centerHelper = MeshBuilder.CreateBox("centerHelper", { size: 0.5 }, scene);
        centerHelper.parent = this.instanceRoot;
        centerHelper.renderingGroupId = 1;

        this.centerOfMassHelper = MeshBuilder.CreateSphere("centerOfMassHelper", { diameter: 0.25 }, scene);
        this.centerOfMassHelper.parent = this.instanceRoot;
        this.centerOfMassHelper.renderingGroupId = 1;
        this.centerOfMassHelper.material = Assets.DebugMaterial("centerOfMassHelper", true);*/

        for (const child of this.instanceRoot.getChildMeshes()) {
            if (child.name.includes("hoverThruster")) {
                const thruster = new Thruster(child as Mesh);
                this.hoverThrusters.push(thruster);
                this.allThrusters.push(thruster);
                console.log("found", child.name);

                const helperLine = MeshBuilder.CreateLines(
                    "helperLine",
                    {
                        points: [Vector3.Zero(), new Vector3(0, -1, 0)]
                    },
                    scene
                );
                helperLine.scaling.scaleInPlace(5);
                helperLine.material = Assets.DebugMaterial(`helperLine${child.name}`, true);

                helperLine.parent = child;
            } else if (child.name.includes("mainThruster")) {
                const thruster = new Thruster(child as Mesh);
                this.mainThrusters.push(thruster);
                this.allThrusters.push(thruster);
                console.log("found", child.name);

                const helperLine = MeshBuilder.CreateLines(
                    "helperLine",
                    {
                        points: [Vector3.Zero(), new Vector3(0, -1, 0)]
                    },
                    scene
                );
                helperLine.scaling.scaleInPlace(5);
                helperLine.material = Assets.DebugMaterial(`helperLine${child.name}`, true);

                helperLine.parent = child;
            } else {
                this.otherMeshes.push(child);
            }
        }

        this.hoverThrusterMatrix = buildThrusterMatrix(this.hoverThrusters);
        console.log(this.hoverThrusterMatrix);

        this.inverseHoverThrusterMatrix = inverse(this.hoverThrusterMatrix, true);
        console.log(this.inverseHoverThrusterMatrix);

        console.log(getThrusterConfiguration(new Vector3(0, 1, 0), new Vector3(0, 0, 0), this.inverseHoverThrusterMatrix));
    }

    initPhysics(scene: Scene) {
        this.aggregate = new PhysicsAggregate(this.instanceRoot, PhysicsShapeType.CONTAINER, { mass: 10, restitution: 0.2 }, scene);
        for (const child of this.otherMeshes) {
            const childShape = new PhysicsShapeMesh(child as Mesh, scene);
            this.aggregate.shape.addChildFromParent(this.instanceRoot, childShape, child);
        }
        for (const thruster of this.hoverThrusters) thruster.initPhysics(this.instanceRoot, this.aggregate, scene);

        //this.centerOfMassHelper.position = this.getCenterOfMass();

        this.aggregate.body.disablePreStep = false;

        this.aggregate.body.setCollisionCallbackEnabled(true);

        this.collisionObservable = this.aggregate.body.getCollisionObservable();
        this.collisionObservable.add((collisionEvent: IPhysicsCollisionEvent) => {
            if (collisionEvent.impulse < 0.8) return;
            Assets.OUCH_SOUND.play();
        });
    }

    getMass(): number {
        if (this.aggregate === null) throw new Error("Aggregate is null!");
        const mass = this.aggregate.body.getMassProperties().mass;
        if (mass === undefined) throw new Error("Mass is undefined!");
        return mass;
    }

    getCenterOfMass(): Vector3 {
        if (this.aggregate === null) throw new Error("Aggregate is null!");
        const centerOfMass = this.aggregate.body.getMassProperties().centerOfMass;
        if (centerOfMass === undefined) throw new Error("Center of mass is undefined!");
        return centerOfMass;
    }

    getAggregate(): PhysicsAggregate {
        if (this.aggregate === null) throw new Error("Aggregate is null!");
        return this.aggregate;
    }

    getCollisionObservable(): Observable<IPhysicsCollisionEvent> {
        if (this.collisionObservable === null) throw new Error("Collision observable is null!");
        return this.collisionObservable;
    }

    getAbsolutePosition(): Vector3 {
        return this.instanceRoot.getAbsolutePosition();
    }

    update() {
        for (const input of this.inputs) {
            if (input.type === InputType.KEYBOARD) {
                const keyboard = input as Keyboard;

                const spacePressed = keyboard.isPressed(" ");
                const forwardPressed = keyboard.isAnyPressed(["w", "z"]);

                if (spacePressed !== this.hoverThrustersRunning) {
                    if (spacePressed) Assets.ENGINE_RUNNING_SOUND.play();
                    else Assets.ENGINE_RUNNING_SOUND.stop();

                    this.hoverThrustersRunning = spacePressed;
                }

                if (forwardPressed !== this.mainThrustersRunning) {
                    if (forwardPressed) Assets.ENGINE_RUNNING_SOUND.play();
                    else Assets.ENGINE_RUNNING_SOUND.stop();

                    this.mainThrustersRunning = forwardPressed;
                }
            }
        }

        if (this.hoverThrustersRunning) {
            const worldToSpaceShip = this.instanceRoot.computeWorldMatrix().getRotationMatrix().invert();
            const targetThrustWorld = new Vector3(0, 1, 0);
            const targetThrustLocal = Vector3.TransformCoordinates(targetThrustWorld, worldToSpaceShip);
            const targetHeight = 15;

            const upward = this.instanceRoot.getDirection(Vector3.Up());
            const targetTorqueWorld = Vector3.Cross(upward, targetThrustWorld);
            const angle = Vector3.GetAngleBetweenVectors(upward, targetThrustWorld, targetTorqueWorld);
            const targetTorqueLocal = Vector3.TransformCoordinates(targetTorqueWorld, worldToSpaceShip);

            /*const angularSpeed = Vector3.Zero();
            this.aggregate?.body.getAngularVelocityToRef(angularSpeed);

            const targetTorque2 = angularSpeed.negate();
            const targetTorque2Local = Vector3.TransformCoordinates(targetTorque2, worldToSpaceShip);

            targetTorqueLocal.addInPlace(targetTorque2Local).normalize();*/

            if (this.targetThrustHelper !== null) this.targetThrustHelper.dispose();
            this.targetThrustHelper = MeshBuilder.CreateLines(
                "targetThrustHelper",
                {
                    points: [this.instanceRoot.position, this.instanceRoot.position.add(targetThrustWorld.scale(5))]
                },
                this.instanceRoot.getScene()
            );
            this.targetThrustHelper.material = Assets.DebugMaterial("targetThrustHelper", true);

            const thrusterConfiguration = getThrusterConfiguration(targetThrustLocal, targetTorqueLocal, this.inverseHoverThrusterMatrix);
            for (let i = 0; i < thrusterConfiguration.length; i++) {
                thrusterConfiguration[i] = clamp(thrusterConfiguration[i], 0, 1);
            }

            const linearVelocity = Vector3.Zero();
            this.aggregate?.body.getLinearVelocityToRef(linearVelocity);

            const gravity = new Vector3(0, -9.81, 0);
            const fallDirection = gravity.normalizeToNew();
            const fallSpeed = Vector3.Dot(linearVelocity, fallDirection);

            const currentHeight = this.instanceRoot.position.y;

            let heightFactor = 1 + clamp(targetHeight - currentHeight, -0.5, 0.5); //* (1 + fallSpeed);
            if (Math.abs(currentHeight - targetHeight) < 0.5) heightFactor = 1;

            const thrust = gravity.length() * heightFactor * this.getMass();

            for (let i = 0; i < this.hoverThrusters.length; i++) {
                this.hoverThrusters[i].setThrottle(thrusterConfiguration[i]);
                this.hoverThrusters[i].update();

                const force = this.hoverThrusters[i].getThrustDirection().scaleInPlace(thrust * thrusterConfiguration[i]);

                this.aggregate?.body.applyForce(force, this.hoverThrusters[i].getAbsolutePosition());
            }
        } else {
            this.targetThrustHelper?.dispose();

            for (const thruster of this.hoverThrusters) {
                thruster.setThrottle(0);
                thruster.update();
            }
        }

        for (const thruster of this.mainThrusters) {
            thruster.setThrottle(this.mainThrustersRunning ? 1 : 0);
            thruster.update();
            if (thruster.getThrottle() === 0) continue;

            const thrust = 3;

            this.aggregate?.body.applyForce(thruster.getThrustDirection().scaleInPlace(thrust), thruster.getAbsolutePosition());
        }
    }
}
