import { AbstractMesh, InstancedMesh, Mesh, MeshBuilder } from "@babylonjs/core/Meshes";
import { Assets } from "../controller/assets";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { IPhysicsCollisionEvent, PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsShapeMesh } from "@babylonjs/core/Physics/v2/physicsShape";
import { Scene } from "@babylonjs/core/scene";
import { Observable } from "@babylonjs/core/Misc/observable";
import { Input, InputType } from "../controller/inputs/input";
import { Keyboard } from "../controller/inputs/keyboard";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { Thruster } from "./thruster";
import { Matrix, inverse, pseudoInverse } from "ml-matrix";
import { buildThrusterMatrix, getThrustAndTorque, getThrusterConfiguration } from "./thrusterMatrix";
import { clamp } from "terrain-generation";

export class Spaceship {
    readonly instanceRoot: InstancedMesh;

    private aggregate: PhysicsAggregate | null = null;

    private collisionObservable: Observable<IPhysicsCollisionEvent> | null = null;

    private inputs: Input[] = [];

    private engineRunning = false;

    private hoverThrusters: Thruster[] = [];

    private otherMeshes: AbstractMesh[] = [];

    //private centerOfMassHelper: Mesh;

    private targetThrustHelper: Mesh | null = null;

    private thrusterMatrix: Matrix;
    private inverseThrusterMatrix: Matrix;

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
                console.log("found", child.name);

                const helperLine = MeshBuilder.CreateLines("helperLine", {
                    points: [
                        Vector3.Zero(),
                        new Vector3(0, -1, 0),
                    ]
                }, scene);
                helperLine.scaling.scaleInPlace(5);
                helperLine.material = Assets.DebugMaterial(`helperLine${child.name}`, true);

                helperLine.parent = child;
            } else {
                this.otherMeshes.push(child);
            }
        }

        this.thrusterMatrix = buildThrusterMatrix(this.hoverThrusters);
        console.log(this.thrusterMatrix);

        this.inverseThrusterMatrix = pseudoInverse(this.thrusterMatrix);
        console.log(this.inverseThrusterMatrix);

        console.log(getThrusterConfiguration(new Vector3(0, 1, 0), new Vector3(0, 0, 0), this.inverseThrusterMatrix));
    }

    initPhysics(scene: Scene) {
        this.aggregate = new PhysicsAggregate(this.instanceRoot
            , PhysicsShapeType.CONTAINER, { mass: 10, restitution: 0.2 }, scene);
        for (const child of this.otherMeshes) {
            const childShape = new PhysicsShapeMesh(child as Mesh, scene);
            this.aggregate.shape.addChildFromParent(this.instanceRoot, childShape, child);
        }
        for (const thruster of this.hoverThrusters) thruster.initPhysics(this.instanceRoot, this.aggregate, scene);

        //this.centerOfMassHelper.position = this.getCenterOfMass();

        this.aggregate.body.setCollisionCallbackEnabled(true);

        this.collisionObservable = this.aggregate.body.getCollisionObservable();
        this.collisionObservable.add((collisionEvent: IPhysicsCollisionEvent) => {
            if (collisionEvent.impulse < 0.8) return;
            Assets.OuchSound.play();
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

    update() {
        for (const input of this.inputs) {
            if (input.type === InputType.KEYBOARD) {
                const keyboard = input as Keyboard;

                const spacePressed = keyboard.isPressed(" ");

                if (spacePressed != this.engineRunning) {
                    if (spacePressed) Assets.EngineRunningSound.play();
                    else Assets.EngineRunningSound.stop();

                    this.engineRunning = spacePressed;
                }
            }
        }

        if (this.engineRunning) {
            const worldToSpaceShip = this.instanceRoot.computeWorldMatrix().getRotationMatrix().invert();
            const targetThrustWorld = new Vector3(0, 1, 0);
            const targetThrustLocal = Vector3.TransformCoordinates(targetThrustWorld, worldToSpaceShip);  
            const targetHeight = 15;

            const upward = this.instanceRoot.getDirection(Vector3.Up());
            const targetTorqueWorld = Vector3.Cross(upward, targetThrustWorld);
            const targetTorqueLocal = Vector3.TransformCoordinates(targetTorqueWorld, worldToSpaceShip);

            if(this.targetThrustHelper !== null) this.targetThrustHelper.dispose();
            this.targetThrustHelper = MeshBuilder.CreateLines("targetThrustHelper", {
                points: [
                    this.instanceRoot.position,
                    this.instanceRoot.position.add(targetThrustWorld.scale(5)),
                ]
            }, this.instanceRoot.getScene());
            this.targetThrustHelper.material = Assets.DebugMaterial("targetThrustHelper", true);

            const thrusterConfiguration = getThrusterConfiguration(targetThrustLocal, targetTorqueLocal, this.inverseThrusterMatrix);
            
            const linearVelocity = Vector3.Zero();
            this.aggregate?.body.getLinearVelocityToRef(linearVelocity);

            const gravity = new Vector3(0, -9.81, 0);
            const fallDirection = gravity.normalizeToNew();
            const fallSpeed = Vector3.Dot(linearVelocity, fallDirection);

            const currentHeight = this.instanceRoot.position.y;
            
            let heightFactor = (1 + clamp(targetHeight - currentHeight, -0.5, 0.5)) * (1 + fallSpeed);
            if(Math.abs(currentHeight - targetHeight) < 0.5) heightFactor = 1;


            const thrust = gravity.length() * heightFactor * this.getMass();
            //console.log((1 + clamp(fallSpeed, -0.5, 0.5)), heightFactor, thrust);

            for (let i = 0; i < this.hoverThrusters.length; i++) {
                this.hoverThrusters[i].setThrottle(thrusterConfiguration[i]);
                this.hoverThrusters[i].update();

                this.aggregate?.body.applyForce(this.hoverThrusters[i].getThrustDirection().scale(thrust * thrusterConfiguration[i]), this.hoverThrusters[i].getAbsolutePosition());
            }
        } else {
            this.targetThrustHelper?.dispose();

            for (const thruster of this.hoverThrusters) {
                thruster.setThrottle(0);
                thruster.update();
            }
        }
    }
}