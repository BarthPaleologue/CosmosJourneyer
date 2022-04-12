import {Vector3, FreeCamera, Mesh, StandardMaterial, Color3, Axis, Space, Scene, Quaternion} from "@babylonjs/core";

import {Gamepad, GamepadAxis, GamepadButton} from "../inputs/gamepad";
import {Keyboard} from "../inputs/keyboard";
import {Mouse} from "../inputs/mouse";
import {CelestialBody} from "../celestialBodies/celestialBody";
import {Transformable} from "../celestialBodies/interfaces";
import {Algebra} from "../utils/algebra";

export class PlayerController implements Transformable {

    nearestBody: CelestialBody | null;
    isOrbiting: boolean = false;

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
        yawRightKey: "l",
    };

    readonly mesh: Mesh;

    constructor(scene: Scene) {
        this.mesh = Mesh.CreateBox("player", 1, scene);
        let mat = new StandardMaterial("mat", scene);
        mat.emissiveColor = Color3.White();
        this.mesh.material = mat;

        this.camera = new FreeCamera("firstPersonCamera", Vector3.Zero(), scene);
        this.camera.parent = this.mesh;
        scene.activeCamera = this.camera;

        this.nearestBody = null;
    }

    /* #region directions */

    /**
     * 
     * @returns the unit vector pointing forward the player controler in world space
     */
    public getForwardDirection(): Vector3 {
        return this.mesh.getDirection(Axis.Z);
    }

    /**
     * 
     * @returns the unit vector pointing backward the player controler in world space
     */
    public getBackwardDirection(): Vector3 {
        return this.getForwardDirection().scale(-1);
    }

    /**
     * 
     * @returns the unit vector pointing upward the player controler in world space
     */
    public getUpwardDirection(): Vector3 {
        return this.mesh.getDirection(Axis.Y);
    }

    /**
     * 
     * @returns the unit vector pointing downward the player controler in world space
     */
    public getDownwardDirection(): Vector3 {
        return this.getUpwardDirection().scale(-1);
    }

    /**
     * 
     * @returns the unit vector pointing to the right of the player controler in world space
     */
    public getRightDirection(): Vector3 {
        return this.mesh.getDirection(Axis.X);
    }

    /**
     * 
     * @returns the unit vector pointing to the left of the player controler in world space
     */
    public getLeftDirection(): Vector3 {
        return this.getRightDirection().scale(-1);
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
        if (keyboard.isPressed(this.controls.rollLeftKey)) { // rotation autour de l'axe de déplacement
            this.mesh.rotate(this.getForwardDirection(), this.rotationSpeed * deltaTime, Space.WORLD);
        } else if (keyboard.isPressed(this.controls.rollRightKey)) {
            this.mesh.rotate(this.getForwardDirection(), -this.rotationSpeed * deltaTime, Space.WORLD);
        }

        if (keyboard.isPressed(this.controls.pitchUpKey)) {
            this.mesh.rotate(this.getRightDirection(), -this.rotationSpeed * deltaTime, Space.WORLD);
        } else if (keyboard.isPressed(this.controls.picthDownKey)) {
            this.mesh.rotate(this.getRightDirection(), this.rotationSpeed * deltaTime, Space.WORLD);
        }

        if (keyboard.isPressed(this.controls.yawLeftKey)) {
            this.mesh.rotate(this.getUpwardDirection(), -this.rotationSpeed * deltaTime, Space.WORLD);
        } else if (keyboard.isPressed(this.controls.yawRightKey)) {
            this.mesh.rotate(this.getUpwardDirection(), this.rotationSpeed * deltaTime, Space.WORLD);
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

        return deplacement.scale(-1);
    }

    /**
     * Listens to mouse and rotate player accordingly
     * @param mouse the mouse to listen to
     * @param deltaTime the time between 2 frames
     */
    public listenToMouse(mouse: Mouse, deltaTime: number): void {
        // Update Rotation state
        this.mesh.rotate(this.getRightDirection(), this.rotationSpeed * deltaTime * mouse.getDYToCenter() / (Math.max(window.innerWidth, window.innerHeight) / 2), Space.WORLD);
        this.mesh.rotate(this.getUpwardDirection(), this.rotationSpeed * deltaTime * mouse.getDXToCenter() / (Math.max(window.innerWidth, window.innerHeight) / 2), Space.WORLD);
    }

    /**
     * Listens to gamepad and rotate player accordingly and computes equivalent displacement (the player is fixed at the origin)
     * @param gamepad the gamepad to listen to
     * @param deltaTime the time between 2 frames
     * @returns the negative displacement of the playerControler given the inputs
     */
    public listenToGamepad(gamepad: Gamepad, deltaTime: number): Vector3 {

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

        // Update Rotation state
        // pitch and yaw control
        this.mesh.rotate(this.getRightDirection(), this.rotationSpeed * deltaTime * gamepad.getAxisValue(GamepadAxis.RY), Space.WORLD);
        this.mesh.rotate(this.getUpwardDirection(), this.rotationSpeed * deltaTime * gamepad.getAxisValue(GamepadAxis.RX), Space.WORLD);

        // roll control
        this.mesh.rotate(this.getForwardDirection(), this.rotationSpeed * deltaTime * gamepad.getPressedValue(GamepadButton.L), Space.WORLD);
        this.mesh.rotate(this.getForwardDirection(), -this.rotationSpeed * deltaTime * gamepad.getPressedValue(GamepadButton.R), Space.WORLD);

        return deplacement.scale(-1);
    }

    public getAbsolutePosition(): Vector3 {
        return this.mesh.getAbsolutePosition();
    }

    setAbsolutePosition(newPosition: Vector3): void {
        this.mesh.setAbsolutePosition(newPosition);
    }
    getRotationQuaternion(): Quaternion {
        return this.mesh.rotationQuaternion!;
    }
    getOriginBodySpaceSamplePosition(): Vector3 {
        let position = this.getAbsolutePosition().clone(); // position de la planète / au joueur
        position.scaleInPlace(-1); // position du joueur / au centre de la planète

        // on applique le quaternion inverse pour obtenir le sample point correspondant à la planète rotatée (fais un dessin si c'est pas clair)
        Algebra.applyQuaternionInPlace(Quaternion.Inverse(this.getRotationQuaternion()), position);

        return position;
    }
    translate(displacement: Vector3): void {
        this.mesh.position.addInPlace(displacement);
    }
    rotateAround(pivot: Vector3, axis: Vector3, amount: number): void {
        this.mesh.rotateAround(pivot, axis, amount);
    }
    rotate(axis: Vector3, amount: number): void {
        this.mesh.rotate(axis, amount, Space.WORLD);
    }
}