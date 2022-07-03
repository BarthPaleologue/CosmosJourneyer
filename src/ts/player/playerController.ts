import { Vector3, FreeCamera, Axis, Space, Scene, Quaternion, TransformNode, MeshBuilder, StandardMaterial, Color3 } from "@babylonjs/core";
import { Gamepad, GamepadAxis, GamepadButton } from "../inputs/gamepad";
import { Keyboard } from "../inputs/keyboard";
import { Mouse } from "../inputs/mouse";
import { AbstractBody } from "../celestialBodies/abstractBody";
import { ITransformable } from "../celestialBodies/iTransformable";
import { Star } from "../celestialBodies/stars/star";

export class PlayerController implements ITransformable {
    nearestBody: AbstractBody | null;

    collisionRadius = 100;

    camera: FreeCamera;

    private speed = 1;
    private rotationSpeed = Math.PI / 4;

    private controls = {
        upKeys: [" "],
        downKeys: ["Shift", "ShiftLeft", "c", "C"],
        forwardKeys: ["z", "Z"],
        leftKeys: ["q", "Q"],
        backwardKeys: ["s", "S"],
        rightKeys: ["d", "D"],

        rollLeftKey: "a",
        rollRightKey: "e",

        pitchUpKey: "i",
        picthDownKey: "k",

        yawLeftKey: "j",
        yawRightKey: "l"
    };

    readonly transform: TransformNode;

    constructor(scene: Scene) {
        this.transform = new TransformNode("playerTransform", scene);
        this.transform.position = Vector3.Zero();
        this.transform.rotationQuaternion = Quaternion.Identity();

        this.camera = new FreeCamera("firstPersonCamera", Vector3.Zero(), scene);
        this.camera.parent = this.transform;
        scene.activeCamera = this.camera;

        this.nearestBody = null;
    }

    /* #region directions */

    /**
     *
     * @returns the unit vector pointing forward the player controler in world space
     */
    public getForwardDirection(): Vector3 {
        return this.transform.getDirection(Axis.Z);
    }

    /**
     *
     * @returns the unit vector pointing backward the player controler in world space
     */
    public getBackwardDirection(): Vector3 {
        return this.getForwardDirection().negate();
    }

    /**
     *
     * @returns the unit vector pointing upward the player controler in world space
     */
    public getUpwardDirection(): Vector3 {
        return this.transform.getDirection(Axis.Y);
    }

    /**
     *
     * @returns the unit vector pointing downward the player controler in world space
     */
    public getDownwardDirection(): Vector3 {
        return this.getUpwardDirection().negate();
    }

    /**
     *
     * @returns the unit vector pointing to the right of the player controler in world space
     */
    public getRightDirection(): Vector3 {
        return this.transform.getDirection(Axis.X);
    }

    /**
     *
     * @returns the unit vector pointing to the left of the player controler in world space
     */
    public getLeftDirection(): Vector3 {
        return this.getRightDirection().negate();
    }

    /* #endregion directions */

    /**
     * Set new speed for player controler
     * @param newSpeed the new speed value
     */
    public setSpeed(newSpeed: number) {
        this.speed = newSpeed;
    }

    /**
     * Listens to keyboard, rotate the player accordingly and computes equivalent displacement (the player is fixed at the origin)
     * @param keyboard the keyboard to listen to
     * @param deltaTime the time between 2 frames
     * @returns the negative displacement of the player to apply to every other mesh given the inputs
     */
    public listenToKeyboard(keyboard: Keyboard, deltaTime: number): Vector3 {
        // Update Rotation state
        if (keyboard.isPressed(this.controls.rollLeftKey)) {
            this.rotate(this.getForwardDirection(), this.rotationSpeed * deltaTime);
        } else if (keyboard.isPressed(this.controls.rollRightKey)) {
            this.rotate(this.getForwardDirection(), -this.rotationSpeed * deltaTime);
        }

        if (keyboard.isPressed(this.controls.pitchUpKey)) {
            this.rotate(this.getRightDirection(), -this.rotationSpeed * deltaTime);
        } else if (keyboard.isPressed(this.controls.picthDownKey)) {
            this.rotate(this.getRightDirection(), this.rotationSpeed * deltaTime);
        }

        if (keyboard.isPressed(this.controls.yawLeftKey)) {
            this.rotate(this.getUpwardDirection(), -this.rotationSpeed * deltaTime);
        } else if (keyboard.isPressed(this.controls.yawRightKey)) {
            this.rotate(this.getUpwardDirection(), this.rotationSpeed * deltaTime);
        }

        // Update displacement state
        let deplacement = Vector3.Zero();

        let forwardDeplacement = this.getForwardDirection().scale(this.speed * deltaTime);
        let upwardDeplacement = this.getUpwardDirection().scale(this.speed * deltaTime);
        let rightDeplacement = this.getRightDirection().scale(this.speed * deltaTime);

        if (keyboard.isAnyPressed(this.controls.forwardKeys)) deplacement.addInPlace(forwardDeplacement);
        if (keyboard.isAnyPressed(this.controls.backwardKeys)) deplacement.subtractInPlace(forwardDeplacement);
        if (keyboard.isAnyPressed(this.controls.leftKeys)) deplacement.subtractInPlace(rightDeplacement);
        if (keyboard.isAnyPressed(this.controls.rightKeys)) deplacement.addInPlace(rightDeplacement);
        if (keyboard.isAnyPressed(this.controls.upKeys)) deplacement.addInPlace(upwardDeplacement);
        if (keyboard.isAnyPressed(this.controls.downKeys)) deplacement.subtractInPlace(upwardDeplacement);

        if (keyboard.isPressed("+")) this.speed *= 1.1;
        if (keyboard.isPressed("-")) this.speed /= 1.1;
        if (keyboard.isPressed("8")) this.speed = 30;

        return deplacement.negate();
    }

    /**
     * Listens to mouse and rotate player accordingly
     * @param mouse the mouse to listen to
     * @param deltaTime the time between 2 frames
     */
    public listenToMouse(mouse: Mouse, deltaTime: number): void {
        const greaterLength = Math.max(window.innerWidth, window.innerHeight);
        this.rotate(this.getRightDirection(), (this.rotationSpeed * deltaTime * mouse.getDYToCenter()) / (greaterLength / 2));
        this.rotate(this.getUpwardDirection(), (this.rotationSpeed * deltaTime * mouse.getDXToCenter()) / (greaterLength / 2));
    }

    /**
     * Listens to gamepad and rotate player accordingly and computes equivalent displacement (the player is fixed at the origin)
     * @param gamepad the gamepad to listen to
     * @param deltaTime the time between 2 frames
     * @returns the negative displacement of the playerControler given the inputs
     */
    public listenToGamepad(gamepad: Gamepad, deltaTime: number): Vector3 {
        gamepad.update();

        let deplacement = Vector3.Zero();

        let forwardDeplacement = this.getForwardDirection().scale(this.speed * deltaTime);
        let upwardDeplacement = this.getUpwardDirection().scale(this.speed * deltaTime);
        let rightDeplacement = this.getRightDirection().scale(this.speed * deltaTime);

        deplacement.addInPlace(forwardDeplacement.scale(-gamepad.getAxisValue(GamepadAxis.LY)));
        deplacement.addInPlace(rightDeplacement.scale(gamepad.getAxisValue(GamepadAxis.LX)));

        deplacement.addInPlace(upwardDeplacement.scale(gamepad.getPressedValue(GamepadButton.ZR)));
        deplacement.subtractInPlace(upwardDeplacement.scale(gamepad.getPressedValue(GamepadButton.ZL)));

        if (gamepad.isPressed(GamepadButton.Start)) this.speed *= 1.1;
        if (gamepad.isPressed(GamepadButton.Select)) this.speed /= 1.1;

        // pitch and yaw control
        this.rotate(this.getRightDirection(), this.rotationSpeed * deltaTime * gamepad.getAxisValue(GamepadAxis.RY));
        this.rotate(this.getUpwardDirection(), this.rotationSpeed * deltaTime * gamepad.getAxisValue(GamepadAxis.RX));

        // roll control
        this.rotate(this.getForwardDirection(), this.rotationSpeed * deltaTime * gamepad.getPressedValue(GamepadButton.L));
        this.rotate(this.getForwardDirection(), -this.rotationSpeed * deltaTime * gamepad.getPressedValue(GamepadButton.R));

        return deplacement.negate();
    }

    public getAbsolutePosition(): Vector3 {
        if (this.transform.getAbsolutePosition()._isDirty) this.transform.computeWorldMatrix(true);
        return this.transform.getAbsolutePosition();
    }

    public setAbsolutePosition(newPosition: Vector3): void {
        this.transform.setAbsolutePosition(newPosition);
    }

    public getRotationQuaternion(): Quaternion {
        if (this.transform.rotationQuaternion == undefined) throw new Error(`PlayerController's rotation Quaternion is undefined !`);
        return this.transform.rotationQuaternion;
    }

    public getInverseRotationQuaternion(): Quaternion {
        return this.getRotationQuaternion().conjugate();
    }

    public translate(displacement: Vector3): void {
        this.transform.setAbsolutePosition(this.getAbsolutePosition().add(displacement));
    }

    public rotateAround(pivot: Vector3, axis: Vector3, amount: number): void {
        this.transform.rotateAround(pivot, axis, amount);
    }

    public rotate(axis: Vector3, amount: number): void {
        this.transform.rotate(axis, amount, Space.WORLD);
    }

    public positionNearBody(body: AbstractBody): void {
        const dir = body.getAbsolutePosition();
        const dist = dir.length();
        dir.normalize();
        this.setAbsolutePosition(dir.scale(dist - body.getRadius() * 3));

        body.starSystem.translateAllBodies(this.getAbsolutePosition().negate());
        this.translate(this.getAbsolutePosition().negate());

        this.transform.lookAt(body.getAbsolutePosition());
    }

    /**
     * If the parameter is unset, returns whereas the player is orbiting a body, if the parameter is set returns if the player orbits the given body
     * @param body
     */
    public isOrbiting(body: AbstractBody | null = null, orbitLimitFactor = 2.5): boolean {
        if (this.nearestBody == null) return false;
        else if (body == null) {
            return this.nearestBody.getAbsolutePosition().lengthSquared() < (orbitLimitFactor * this.nearestBody.getRadius()) ** 2;
        } else {
            return this.nearestBody == body && this.nearestBody.getAbsolutePosition().lengthSquared() < (orbitLimitFactor * this.nearestBody.getRadius()) ** 2;
        }
    }
}
