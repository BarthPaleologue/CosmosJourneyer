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
import "@babylonjs/core/Collisions/collisionCoordinator";
import { Mouse } from "../inputs/mouse";

class AnimationGroupWrapper {
    name: string;
    group: AnimationGroup;
    weight: number;

    constructor(name: string, group: AnimationGroup, startingWeight: number, loop: boolean) {
        this.name = name;
        this.weight = startingWeight;

        this.group = group;
        this.group.play(loop);
        this.group.setWeightForAllAnimatables(startingWeight);
    }

    moveTowardsWeight(targetWeight: number, deltaTime: number) {
        this.weight = Math.min(Math.max(this.weight + deltaTime * Math.sign(targetWeight - this.weight), 0), 1);
        this.group.setWeightForAllAnimatables(this.weight);
    }
}

export class CharacterController extends AbstractController {
    private readonly character: AbstractMesh;
    private readonly thirdPersonCamera: UberOrbitCamera;

    private readonly characterWalkSpeed = 1.8;
    private readonly characterWalkSpeedBackwards = 1.2;
    private readonly characterRunSpeed = 3.6;
    private readonly characterRotationSpeed = 6;

    private animating = false;

    private readonly idleAnim: AnimationGroupWrapper;
    private readonly walkAnim: AnimationGroupWrapper;
    private readonly walkBackAnim: AnimationGroupWrapper;
    private readonly sambaAnim: AnimationGroupWrapper;
    private readonly runningAnim: AnimationGroupWrapper;
    private readonly fallingIdleAnim: AnimationGroupWrapper;
    private readonly jumpingAnim: AnimationGroupWrapper;
    private readonly nonIdleAnimations: AnimationGroupWrapper[];

    private targetAnim: AnimationGroupWrapper | null = null;

    private closestWalkableObject: AbstractObject | null = null;

    private readonly raycastResult = new PhysicsRaycastResult();
    private readonly scene: Scene;

    private isGrounded = false;
    private jumpVelocity = Vector3.Zero();

    constructor(scene: Scene) {
        super();

        this.scene = scene;

        this.character = Assets.CreateCharacterInstance();
        setRotationQuaternion(this.character, Quaternion.Identity());

        const walkAnim = scene.getAnimationGroupByName("Walking");
        if (walkAnim === null) throw new Error("'Walking' animation not found");

        const walkBackAnim = scene.getAnimationGroupByName("WalkingBackwards");
        if (walkBackAnim === null) throw new Error("'WalkingBackwards' animation not found");

        const idleAnim = scene.getAnimationGroupByName("Idle");
        if (idleAnim === null) throw new Error("'Idle' animation not found");

        const sambaAnim = scene.getAnimationGroupByName("SambaDancing");
        if (sambaAnim === null) throw new Error("'Samba' animation not found");

        const runningAnim = scene.getAnimationGroupByName("Running");
        if (runningAnim === null) throw new Error("'Running' animation not found");

        const fallingIdleAnim = scene.getAnimationGroupByName("FallingIdle");
        if (fallingIdleAnim === null) throw new Error("'FallingIdle' animation not found");

        const jumpingAnim = scene.getAnimationGroupByName("Jumping");
        if (jumpingAnim === null) throw new Error("'Jumping' animation not found");

        this.idleAnim = new AnimationGroupWrapper("idle", idleAnim, 1, true);
        this.walkAnim = new AnimationGroupWrapper("walk", walkAnim, 0, true);
        this.walkBackAnim = new AnimationGroupWrapper("walkBack", walkBackAnim, 0, true);
        this.sambaAnim = new AnimationGroupWrapper("samba", sambaAnim, 0, true);
        this.runningAnim = new AnimationGroupWrapper("running", runningAnim, 0, true);
        this.fallingIdleAnim = new AnimationGroupWrapper("fallingIdle", fallingIdleAnim, 0, true);
        this.jumpingAnim = new AnimationGroupWrapper("jumping", jumpingAnim, 0, false);
        this.nonIdleAnimations = [this.walkAnim, this.walkBackAnim, this.sambaAnim, this.runningAnim, this.fallingIdleAnim, this.jumpingAnim];

        this.targetAnim = this.idleAnim;

        this.thirdPersonCamera = new UberOrbitCamera("camera", new Vector3(0, 1.5, 0), scene, 40, -Math.PI / 4, 1.0);
        this.thirdPersonCamera.minRadius = 5;
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
            if (input.isLeftButtonPressed()) {
                this.thirdPersonCamera.rotatePhi(-input.getDxNormalized() * 300 * deltaTime);
                this.thirdPersonCamera.rotateTheta(-input.getDyNormalized() * 300 * deltaTime);
            }
            input.reset();
        }
        if (input instanceof Keyboard) {
            const keyboard = input as Keyboard;
            let keydown = false;

            if (this.walkAnim.weight > 0.0) {
                this.character.moveWithCollisions(this.character.forward.scaleInPlace(-this.characterWalkSpeed * deltaTime * this.walkAnim.weight));
            }

            if (this.walkBackAnim.weight > 0.0) {
                this.character.moveWithCollisions(this.character.forward.scaleInPlace(this.characterWalkSpeedBackwards * deltaTime * this.walkBackAnim.weight));
            }

            if(this.runningAnim.weight > 0.0) {
                this.character.moveWithCollisions(this.character.forward.scaleInPlace(-this.characterRunSpeed * deltaTime * this.runningAnim.weight));
            }

            const isWalking = this.walkAnim.weight > 0.0 || this.walkBackAnim.weight > 0.0;

            // Translation
            if (keyboard.isPressed("z") || keyboard.isPressed("w")) {
                this.targetAnim = this.walkAnim;
                keydown = true;
            } else if (keyboard.isPressed("s")) {
                this.targetAnim = this.walkBackAnim;
                keydown = true;
            } else if (keyboard.isPressed("e")) {
                this.targetAnim = this.runningAnim;
                keydown = true;
            }

            if(!this.isGrounded) {
                this.targetAnim = this.fallingIdleAnim;
                keydown = true;
            }

            // Rotation
            if ((keyboard.isPressed("q") || keyboard.isPressed("a")) && isWalking) {
                this.character.rotate(Vector3.Up(), this.characterRotationSpeed * deltaTime);
                keydown = true;
            } else if (keyboard.isPressed("d") && isWalking) {
                this.character.rotate(Vector3.Up(), -this.characterRotationSpeed * deltaTime);
                keydown = true;
            }

            // Samba!
            if (keyboard.isPressed("b")) {
                this.targetAnim = this.sambaAnim;
                keydown = true;
            }

            if (keyboard.isPressed(" ")) {
                if (this.isGrounded) {
                    this.targetAnim = this.jumpingAnim;
                    this.jumpingAnim.weight = 1;
                    this.jumpingAnim.group.stop();
                    this.jumpingAnim.group.play();
                    this.character.moveWithCollisions(Vector3.Up().scale(3.0));
                    this.isGrounded = false;
                    this.jumpVelocity = this.character.up.scale(10.0).add(this.character.forward.scale(-5.0));
                    keydown = true;
                }
            }

            if (!keydown) {
                this.targetAnim = this.idleAnim;
            }

            let weightSum = 0;
            for (const animation of this.nonIdleAnimations) {
                if (animation === this.targetAnim) {
                    animation.moveTowardsWeight(1, deltaTime);
                } else {
                    animation.moveTowardsWeight(0, deltaTime);
                }
                weightSum += animation.weight;
            }

            this.idleAnim.moveTowardsWeight(Math.min(Math.max(1 - weightSum, 0.0), 1.0), deltaTime);

            this.character.computeWorldMatrix(true);

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
            if (distance <= 0.2) {
                // push the character up if it's below the surface
                translate(character, up.scale(-distance));
                this.isGrounded = true;
                this.jumpVelocity = Vector3.Zero();
            } else {
                this.isGrounded = false;
            }
            setUpVector(character, up);
        }

        if (!this.isGrounded) {
            // apply gravity
            this.jumpVelocity.addInPlace(character.up.scale(-9.8 * deltaTime));
            translate(character, this.jumpVelocity.scale(deltaTime));
        }

        const playerMovement = Vector3.Zero();
        //FIXME: the division by Settings.TIME_MULTIPLIER is a hack to make the player move at the same speed regardless of the time multiplier
        for (const input of this.inputs) playerMovement.addInPlace(this.listenTo(input, this.getTransform().getScene().getEngine().getDeltaTime() / 1000));
        translate(this.getTransform(), playerMovement);

        return playerMovement;
    }
}
