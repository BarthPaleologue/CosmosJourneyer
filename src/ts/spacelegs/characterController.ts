import { AbstractController } from "../uberCore/abstractController";
import { TransformNode } from "@babylonjs/core/Meshes";
import { UberCamera } from "../uberCore/uberCamera";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Input } from "../inputs/input";
import { rotate, setRotationQuaternion, setUpVector, translate } from "../uberCore/transforms/basicTransform";
import { Assets } from "../assets";
import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import { Keyboard } from "../inputs/keyboard";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Settings } from "../settings";
import { UberOrbitCamera } from "../uberCore/uberOrbitCamera";
import { PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";
import { PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";
import { AbstractObject } from "../bodies/abstractObject";
import { Quaternion } from "@babylonjs/core/Maths/math";
import '@babylonjs/core/Collisions/collisionCoordinator';
import { Mouse } from "../inputs/mouse";

export class CharacterController extends AbstractController {
    private readonly character: AbstractMesh;
    private readonly thirdPersonCamera: UberOrbitCamera;

    private readonly walkAnim: AnimationGroup;
    private readonly walkBackAnim: AnimationGroup;
    private readonly idleAnim: AnimationGroup;
    private readonly sambaAnim: AnimationGroup;

    private readonly characterSpeed = 1.8;
    private readonly characterSpeedBackwards = 1.2;
    private readonly characterRotationSpeed = 6;

    private animating = false;

    private closestWalkableObject: AbstractObject | null = null;

    private readonly raycastResult = new PhysicsRaycastResult();
    private readonly scene: Scene;

    constructor(scene: Scene) {
        super();

        this.scene = scene;

        this.character = Assets.CreateCharacterInstance();
        setRotationQuaternion(this.character, Quaternion.Identity());

        const walkAnim = scene.getAnimationGroupByName("Walking");
        if (walkAnim === null) throw new Error("'Walking' animation not found");
        this.walkAnim = walkAnim;

        const walkBackAnim = scene.getAnimationGroupByName("WalkingBackwards");
        if (walkBackAnim === null) throw new Error("'WalkingBackwards' animation not found");
        this.walkBackAnim = walkBackAnim;

        const idleAnim = scene.getAnimationGroupByName("Idle");
        if (idleAnim === null) throw new Error("'Idle' animation not found");
        this.idleAnim = idleAnim;

        const sambaAnim = scene.getAnimationGroupByName("SambaDancing");
        if (sambaAnim === null) throw new Error("'Samba' animation not found");
        this.sambaAnim = sambaAnim;

        this.thirdPersonCamera = new UberOrbitCamera("camera", new Vector3(0, 1.5, 0), scene, 40, -Math.PI / 4, 1.0);
        this.thirdPersonCamera.minZ = 1;
        this.thirdPersonCamera.maxZ = Settings.EARTH_RADIUS * 5;
        this.thirdPersonCamera.parent = this.getTransform();
    }

    public setClosestWalkableObject(object: AbstractObject) {
        this.closestWalkableObject = object;
    }

    public override getActiveCamera(): UberCamera {
        return this.thirdPersonCamera;
    }

    public override getTransform(): TransformNode {
        return this.character;
    }

    protected override listenTo(input: Input, deltaTime: number): Vector3 {
        const displacement = Vector3.Zero();
        if (input instanceof Mouse) {
            if(input.isLeftButtonPressed()) {
                this.thirdPersonCamera.rotatePhi(-input.getDxNormalized() * 300 * deltaTime);
                this.thirdPersonCamera.rotateTheta(-input.getDyNormalized() * 300 * deltaTime);
            }
            input.reset();
        }
        if (input instanceof Keyboard) {
            const keyboard = input as Keyboard;
            const character = this.character;
            let keydown = false;
            if (keyboard.isPressed("z") || keyboard.isPressed("w")) {
                character.moveWithCollisions(character.forward.scaleInPlace(-this.characterSpeed * deltaTime));
                keydown = true;
            }
            if (keyboard.isPressed("s")) {
                character.moveWithCollisions(character.forward.scaleInPlace(this.characterSpeedBackwards * deltaTime));
                keydown = true;
            }
            if (keyboard.isPressed("q") || keyboard.isPressed("a")) {
                rotate(character, character.up, this.characterRotationSpeed * deltaTime);
                keydown = true;
            }
            if (keyboard.isPressed("d")) {
                rotate(character, character.up, -this.characterRotationSpeed * deltaTime);
                keydown = true;
            }
            if (keyboard.isPressed("b")) {
                keydown = true;
            }
            character.computeWorldMatrix(true);

            //Manage animations to be played
            if (keydown) {
                if (!this.animating) {
                    this.animating = true;
                    if (keyboard.isPressed("s")) {
                        //Walk backwards
                        this.walkBackAnim.start(true, 1, this.walkBackAnim.from, this.walkBackAnim.to, false);
                    } else if (keyboard.isPressed("b")) {
                        //Samba!
                        this.sambaAnim.start(true, 1, this.sambaAnim.from, this.sambaAnim.to, false);
                    } else {
                        //Walk
                        this.walkAnim.start(true, 1, this.walkAnim.from, this.walkAnim.to, true);
                    }
                }
            } else {
                if (this.animating) {
                    //Default animation is idle when no key is down
                    this.idleAnim.start(true, 1, this.idleAnim.from, this.idleAnim.to, false);

                    //Stop all animations besides Idle Anim when no key is down
                    this.sambaAnim.stop();
                    this.walkAnim.stop();
                    this.walkBackAnim.stop();

                    //Ensure animation are played only once per rendering loop
                    this.animating = false;
                }
            }

            const cameraRotationSpeed = 0.8 * deltaTime;
            if (keyboard.isPressed("1")) this.thirdPersonCamera.rotatePhi(cameraRotationSpeed);
            if (keyboard.isPressed("3")) this.thirdPersonCamera.rotatePhi(-cameraRotationSpeed);
            if (keyboard.isPressed("2")) this.thirdPersonCamera.rotateTheta(-cameraRotationSpeed);
            if (keyboard.isPressed("5")) this.thirdPersonCamera.rotateTheta(cameraRotationSpeed);
        }
        return displacement;
    }

    public override update(deltaTime: number): Vector3 {
        const character = this.getTransform();
        const start = character.getAbsolutePosition().add(character.up.scale(50e3));
        const end = character.position.add(character.up.scale(-50e3));
        (this.scene.getPhysicsEngine() as PhysicsEngineV2).raycastToRef(start, end, this.raycastResult);
        if (this.raycastResult.hasHit && this.closestWalkableObject !== null) {
            const up = character.getAbsolutePosition().subtract(this.closestWalkableObject.getTransform().getAbsolutePosition()).normalize();
            const distance = Vector3.Dot(character.getAbsolutePosition().subtract(this.raycastResult.hitPointWorld), up);
            translate(character, up.scale(-distance));
            setUpVector(character, up);
        }

        const playerMovement = Vector3.Zero();
        //FIXME: the division by Settings.TIME_MULTIPLIER is a hack to make the player move at the same speed regardless of the time multiplier
        for (const input of this.inputs) playerMovement.addInPlace(this.listenTo(input, this.getTransform().getScene().getEngine().getDeltaTime() / 1000));
        translate(this.getTransform(), playerMovement);

        return playerMovement;
    }
}
