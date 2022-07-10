import { Vector3, FreeCamera, Axis, Space, Scene, Quaternion, TransformNode } from "@babylonjs/core";
import { Gamepad, GamepadAxis, GamepadButton } from "../inputs/gamepad";
import { Keyboard } from "../inputs/keyboard";
import { Mouse } from "../inputs/mouse";
import { AbstractBody } from "../bodies/abstractBody";
import { ITransformable } from "../bodies/iTransformable";
import { Input } from "../inputs/input";

export class PlayerController implements ITransformable {
    nearestBody: AbstractBody | null;

    collisionRadius = 100;

    camera: FreeCamera;

    speed = 1;
    private rotationSpeed = Math.PI / 4;

    readonly inputs: Input[] = [];

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
     * Listens to input, rotate the player accordingly and computes equivalent displacement (the player is fixed at the origin)
     * @param input the input to listen to
     * @param deltaTime the time between 2 frames
     * @returns the negative displacement of the player to apply to every other mesh given the inputs
     */
    public listenTo(input: Input, deltaTime: number): Vector3 {
        // Update Rotation state
        if (input.getRoll() != 0) this.rotate(this.getForwardDirection(), input.getRoll() * this.rotationSpeed * deltaTime);
        if (input.getPitch() != 0) this.rotate(this.getRightDirection(), input.getPitch() * this.rotationSpeed * deltaTime);
        if (input.getYaw() != 0) this.rotate(this.getUpwardDirection(), input.getYaw() * this.rotationSpeed * deltaTime);

        // Update displacement state
        const deplacement = Vector3.Zero();

        const forwardDeplacement = this.getForwardDirection().scale(this.speed * deltaTime);
        const upwardDeplacement = this.getUpwardDirection().scale(this.speed * deltaTime);
        const rightDeplacement = this.getRightDirection().scale(this.speed * deltaTime);

        if (input.getZAxis() != 0) deplacement.addInPlace(forwardDeplacement.scale(input.getZAxis()));
        if (input.getXAxis() != 0) deplacement.addInPlace(rightDeplacement.scale(input.getXAxis()));
        if (input.getYAxis() != 0) deplacement.addInPlace(upwardDeplacement.scale(input.getYAxis()));

        if (input.getAcceleration() != 0) this.speed *= 1 + input.getAcceleration() / 10;

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

    public update(deltaTime: number): Vector3 {
        const playerMovement = Vector3.Zero();
        for(const input of this.inputs) {
            playerMovement.addInPlace(this.listenTo(input, deltaTime));
        }
        return playerMovement;
    }
}
