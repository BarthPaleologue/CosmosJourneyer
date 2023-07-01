import { InstancedMesh, Mesh } from "@babylonjs/core/Meshes";
import { Assets } from "../controller/assets";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { IPhysicsCollisionEvent, PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsShapeMesh } from "@babylonjs/core/Physics/v2/physicsShape";
import { Scene } from "@babylonjs/core/scene";
import { Observable } from "@babylonjs/core/Misc/observable";
import { Input, InputType } from "../controller/inputs/input";
import { Keyboard } from "../controller/inputs/keyboard";

export class Spaceship {
    readonly instanceRoot: InstancedMesh;

    private aggregate: PhysicsAggregate | null = null;

    private collisionObservable: Observable<IPhysicsCollisionEvent> | null = null;

    private inputs: Input[] = [];

    private engineRunning = false;

    constructor(inputs: Input[]) {
        if (!Assets.IS_READY) throw new Error("Assets are not ready yet!");
        this.instanceRoot = Assets.CreateEndeavorSpaceShipInstance();
        this.inputs = inputs;
    }

    initPhysics(scene: Scene) {
        this.aggregate = new PhysicsAggregate(this.instanceRoot
            , PhysicsShapeType.CONTAINER, { mass: 10, restitution: 0.2 }, scene);
        for (const child of this.instanceRoot.getChildMeshes()) {
            const childShape = new PhysicsShapeMesh(child as Mesh, scene);
            this.aggregate.shape.addChildFromParent(this.instanceRoot, childShape, child);
        }

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

    getAggregate(): PhysicsAggregate {
        if (this.aggregate === null) throw new Error("Aggregate is null!");
        return this.aggregate;
    }

    getCollisionObservable(): Observable<IPhysicsCollisionEvent> {
        if (this.collisionObservable === null) throw new Error("Collision observable is null!");
        return this.collisionObservable;
    }

    listenToInputs() {
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
    }
}