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

import {
    ArcRotateCamera,
    DirectionalLight,
    KeyboardEventTypes,
    MeshBuilder,
    Physics6DoFConstraint,
    PhysicsBody,
    PhysicsConstraintAxis,
    PhysicsConstraintMotorType,
    PhysicsMotionType,
    PhysicsShapeCylinder,
    PhysicsShapeMesh,
    Scene,
    ShadowGenerator,
    Vector3,
    type AbstractEngine,
    type Mesh,
    type PhysicsShape,
} from "@babylonjs/core";

import type { ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";

import { clamp } from "@/utils/math";

import { enablePhysics } from "./utils";

export async function createRoverScene(
    engine: AbstractEngine,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    await enablePhysics(scene, new Vector3(0, -9.81, 0));

    const camera = new ArcRotateCamera("camera", Math.PI / 2, -Math.PI / 3, 50, Vector3.Zero(), scene);
    camera.attachControl();
    const sun = new DirectionalLight("sun", new Vector3(0, -1, -1), scene);
    sun.autoUpdateExtends = true;

    const shadowGenerator = new ShadowGenerator(1024, sun);
    shadowGenerator.useExponentialShadowMap = true;
    shadowGenerator.useBlurExponentialShadowMap = true;

    const ground = MeshBuilder.CreateGround("ground", { width: 300, height: 300 }, scene);
    ground.receiveShadows = true;
    ground.position.y = -2;

    AddStaticPhysics(ground, 2, scene);

    const car = CreateCar(scene);
    camera.setTarget(car);

    shadowGenerator.addShadowCaster(car);

    //spawn a bunch of boxes
    for (let i = 0; i < 50; i++) {
        const box = MeshBuilder.CreateBox(`box${i}`, { size: 4 }, scene);
        box.position = new Vector3((Math.random() - 0.5) * 200, 20 + Math.random() * 50, (Math.random() - 0.5) * 200);
        box.rotation = new Vector3(Math.random(), Math.random(), Math.random());
        shadowGenerator.addShadowCaster(box);

        AddDynamicPhysics(box, 50, 0.3, 1, new Vector3(0, 0, 0), scene);
    }

    return Promise.resolve(scene);
}

function AddStaticPhysics(mesh: Mesh, friction: number, scene: Scene) {
    const physicsShape = new PhysicsShapeMesh(mesh, scene);
    const physicsBody = new PhysicsBody(mesh, PhysicsMotionType.STATIC, false, scene);
    physicsShape.material = { restitution: 0, friction: friction };
    physicsBody.shape = physicsShape;

    return physicsBody;
}

function AddDynamicPhysics(
    mesh: Mesh,
    mass: number,
    bounce: number,
    friction: number,
    centerOfMass: Vector3,
    scene: Scene,
) {
    const physicsShape = new PhysicsShapeMesh(mesh, scene);
    const physicsBody = new PhysicsBody(mesh, PhysicsMotionType.DYNAMIC, false, scene);
    physicsBody.setMassProperties({ mass: mass, centerOfMass: centerOfMass });
    physicsShape.material = { restitution: bounce, friction: friction };
    physicsBody.shape = physicsShape;

    return { physicsBody, physicsShape };
}

const FILTERS = { CarParts: 1, Everything: 0xff };

function FilterMeshCollisions(shape: PhysicsShape) {
    shape.filterMembershipMask = FILTERS.CarParts;
    shape.filterCollideMask = FILTERS.Everything & ~FILTERS.CarParts;
}

type SteeringMode = "counterPhase" | "inPhase";

class Vehicle {
    private readonly wheelAxles: Array<WheelAxleAggregate> = [];

    private readonly frame: { mesh: Mesh; physicsBody: PhysicsBody; physicsShape: PhysicsShape };

    readonly motorConstraints: Array<Physics6DoFConstraint> = [];
    readonly steeringConstraints: Array<{ position: "rear" | "front"; constraint: Physics6DoFConstraint }> = [];

    private steeringMode: SteeringMode = "counterPhase";

    private targetSpeed = 0;
    private targetSteeringAngle = 0;

    readonly maxForwardSpeed = 50;
    readonly maxReverseSpeed = 25;
    readonly maxSteeringAngle = Math.PI / 6;

    constructor(frame: { mesh: Mesh; physicsBody: PhysicsBody; physicsShape: PhysicsShape }) {
        this.frame = frame;
    }

    public addWheel(position: Vector3, powered: boolean, steerable: boolean, scene: Scene) {
        const wheelAxle = CreateWheelAxleAggregate(position, powered, steerable, scene);
        this.wheelAxles.push(wheelAxle);

        if (powered) {
            this.motorConstraints.push(wheelAxle.wheelAxleConstraint);
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
            this.steeringConstraints.push({ position: positionLabel, constraint: frameAxleConstraint });
        }
    }

    getSteeringMode() {
        return this.steeringMode;
    }

    setSteeringMode(mode: SteeringMode) {
        this.steeringMode = mode;
    }

    setTargetSteeringAngle(angle: number) {
        this.targetSteeringAngle = clamp(angle, -this.maxSteeringAngle, this.maxSteeringAngle);
        for (const { constraint, position } of this.steeringConstraints) {
            const wheelAngle =
                position === "front"
                    ? angle
                    : this.getSteeringMode() === "counterPhase"
                      ? -this.targetSteeringAngle
                      : this.targetSteeringAngle;
            constraint.setAxisMotorMaxForce(PhysicsConstraintAxis.ANGULAR_Y, 60000000);
            constraint.setAxisMotorTarget(PhysicsConstraintAxis.ANGULAR_Y, wheelAngle);
        }
    }

    setTargetSpeed(speed: number) {
        this.targetSpeed = clamp(speed, -this.maxReverseSpeed, this.maxForwardSpeed);
        const motorTorque = 330000 / 20;
        for (const motor of this.motorConstraints) {
            motor.setAxisMotorMaxForce(PhysicsConstraintAxis.ANGULAR_X, motorTorque);
            motor.setAxisMotorTarget(PhysicsConstraintAxis.ANGULAR_X, this.targetSpeed);
        }
    }

    accelerate(deltaSpeed: number) {
        this.setTargetSpeed(this.targetSpeed + deltaSpeed);
        this.targetSpeed *= 0.98;
    }

    brake() {
        const brakeTorque = 1e6;
        for (const motor of this.motorConstraints) {
            motor.setAxisMotorMaxForce(PhysicsConstraintAxis.ANGULAR_X, brakeTorque);
            motor.setAxisMotorTarget(PhysicsConstraintAxis.ANGULAR_X, 0);
        }

        this.targetSpeed = 0;
    }

    turn(angle: number) {
        this.setTargetSteeringAngle(this.targetSteeringAngle + angle);
        this.targetSteeringAngle *= 0.95;
    }
}

function CreateCar(scene: Scene) {
    const carFrame = MeshBuilder.CreateBox("Frame", { height: 1, width: 12, depth: 24 });
    carFrame.position = new Vector3(0, 1, 0);
    const { physicsBody: carFrameBody, physicsShape: carFrameShape } = AddDynamicPhysics(
        carFrame,
        2000,
        0,
        0,
        new Vector3(0, -2.5, 0),
        scene,
    );
    FilterMeshCollisions(carFrameShape);

    const wheelDistanceFromCenter = 6;

    const forwardLeftWheelPosition = new Vector3(wheelDistanceFromCenter, 0, 8);
    const forwardRightWheelPosition = new Vector3(-wheelDistanceFromCenter, 0, 8);
    const middleLeftWheelPosition = new Vector3(wheelDistanceFromCenter, 0, 0);
    const middleRightWheelPosition = new Vector3(-wheelDistanceFromCenter, 0, 0);
    const rearLeftWheelPosition = new Vector3(wheelDistanceFromCenter, 0, -8);
    const rearRightWheelPosition = new Vector3(-wheelDistanceFromCenter, 0, -8);

    const vehicle = new Vehicle({
        mesh: carFrame,
        physicsBody: carFrameBody,
        physicsShape: carFrameShape,
    });

    vehicle.addWheel(forwardLeftWheelPosition, true, true, scene);
    vehicle.addWheel(forwardRightWheelPosition, true, true, scene);
    vehicle.addWheel(middleLeftWheelPosition, true, false, scene);
    vehicle.addWheel(middleRightWheelPosition, true, false, scene);
    vehicle.addWheel(rearLeftWheelPosition, true, true, scene);
    vehicle.addWheel(rearRightWheelPosition, true, true, scene);

    InitKeyboardControls(vehicle, scene);

    carFrameBody.disablePreStep = false;
    carFrame.position.y = 5;

    return carFrame;
}

type WheelAxleAggregate = {
    wheel: { mesh: Mesh; physicsBody: PhysicsBody; physicsShape: PhysicsShape };
    axle: { mesh: Mesh; physicsBody: PhysicsBody; physicsShape: PhysicsShape };
    wheelAxleConstraint: Physics6DoFConstraint;
    powered: boolean;
    steerable: boolean;
};

function CreateWheelAxleAggregate(
    position: Vector3,
    powered: boolean,
    steerable: boolean,
    scene: Scene,
): WheelAxleAggregate {
    const axleMesh = CreateAxle(position, scene);
    const { physicsBody: axleBody, physicsShape: axleShape } = AddAxlePhysics(axleMesh, 190, 0, 0, scene);
    FilterMeshCollisions(axleShape);

    const axle = {
        mesh: axleMesh,
        physicsBody: axleBody,
        physicsShape: axleShape,
    };

    const wheelMesh = CreateWheel(position, scene);
    const { physicsBody: wheelBody, physicsShape: wheelShape } = AddWheelPhysics(wheelMesh, 150, 0, 2.5, scene);
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

function AddWheelPhysics(mesh: Mesh, mass: number, bounce: number, friction: number, scene: Scene) {
    const physicsShape = new PhysicsShapeCylinder(new Vector3(-0.8, 0, 0), new Vector3(0.8, 0, 0), 2, scene);
    const physicsBody = new PhysicsBody(mesh, PhysicsMotionType.DYNAMIC, false, scene);
    physicsBody.setMassProperties({ mass: mass });
    physicsShape.material = { restitution: bounce, friction: friction };
    physicsBody.shape = physicsShape;

    return { physicsBody, physicsShape };
}

function AddAxlePhysics(mesh: Mesh, mass: number, bounce: number, friction: number, scene: Scene) {
    //
    // NOTE: Making the axle shape similar dimensions to the wheel shape increases stability of the joint when it is added
    //
    const physicsShape = new PhysicsShapeCylinder(new Vector3(-0.8, 0, 0), new Vector3(0.8, 0, 0), 1.8, scene);
    const physicsBody = new PhysicsBody(mesh, PhysicsMotionType.DYNAMIC, false, scene);
    physicsBody.setMassProperties({ mass: mass });
    physicsShape.material = { restitution: bounce, friction: friction };
    physicsBody.shape = physicsShape;

    return { physicsBody, physicsShape };
}

function CreateAxle(position: Vector3, scene: Scene) {
    const axleMesh = MeshBuilder.CreateBox("Axle", { height: 1, width: 2.5, depth: 1 }, scene);
    axleMesh.position.copyFrom(position);

    return axleMesh;
}

function CreateWheel(position: Vector3, scene: Scene) {
    const wheelMesh = MeshBuilder.CreateCylinder("Wheel", { height: 1.6, diameter: 4 }, scene);
    wheelMesh.rotation = new Vector3(0, 0, Math.PI / 2);
    wheelMesh.bakeCurrentTransformIntoVertices();
    wheelMesh.position.copyFrom(position);

    return wheelMesh;
}

function AttachAxleToFrame(axle: PhysicsBody, frame: PhysicsBody, scene: Scene, steerable = false) {
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

function InitKeyboardControls(vehicle: Vehicle, scene: Scene) {
    let forwardPressed = false;
    let backPressed = false;
    let leftPressed = false;
    let rightPressed = false;
    let brakePressed = false;

    scene.onKeyboardObservable.add((e) => {
        switch (e.event.key) {
            case "z":
                forwardPressed = e.type === KeyboardEventTypes.KEYDOWN ? true : false;
                break;
            case "s":
                backPressed = e.type === KeyboardEventTypes.KEYDOWN ? true : false;
                break;
            case "q":
                leftPressed = e.type === KeyboardEventTypes.KEYDOWN ? true : false;
                break;
            case "d":
                rightPressed = e.type === KeyboardEventTypes.KEYDOWN ? true : false;
                break;
            case " ":
                brakePressed = e.type === KeyboardEventTypes.KEYDOWN ? true : false;
                break;
        }
    });

    scene.onBeforeRenderObservable.add(() => {
        let turnAngle = 0;
        if (rightPressed) {
            turnAngle = 0.03;
        } else if (leftPressed) {
            turnAngle = -0.03;
        }

        vehicle.turn(turnAngle);

        if (brakePressed) {
            vehicle.brake();
        } else {
            const vehicleMaxAcceleration = 8;
            let vehicleAcceleration = 0;
            if (forwardPressed) {
                vehicleAcceleration = vehicleMaxAcceleration;
            } else if (backPressed) {
                vehicleAcceleration = -vehicleMaxAcceleration;
            }

            vehicle.accelerate(vehicleAcceleration);
        }
    });
}
