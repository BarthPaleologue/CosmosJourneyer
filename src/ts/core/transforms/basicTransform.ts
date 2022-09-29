import { ITransformable } from "./iTransformable";
import { Axis, Quaternion, Space, TransformNode, Vector3 } from "@babylonjs/core";

/**
 * Very thin wrapper around a BabylonJS TransformNode
 */
export class BasicTransform implements ITransformable {
    node: TransformNode;

    constructor(name: string) {
        this.node = new TransformNode(name + "Transform");
        this.node.position = Vector3.Zero();
        this.node.rotationQuaternion = Quaternion.Identity();
    }

    public setAbsolutePosition(newPosition: Vector3): void {
        this.node.setAbsolutePosition(newPosition);
    }

    public getAbsolutePosition(): Vector3 {
        return this.node.getAbsolutePosition();
    }

    public translate(displacement: Vector3): void {
        this.setAbsolutePosition(this.getAbsolutePosition().add(displacement));
    }

    public rotateAround(pivot: Vector3, axis: Vector3, amount: number): void {
        this.node.rotateAround(pivot, axis, amount);
        this.node.computeWorldMatrix(true);
    }

    public rotate(axis: Vector3, amount: number) {
        this.node.rotate(axis, amount, Space.WORLD);
    }

    public getRotationQuaternion(): Quaternion {
        if (this.node.rotationQuaternion == undefined) throw new Error(`Undefined quaternion for ${this.node.name}`);
        return this.node.rotationQuaternion;
    }

    public getInverseRotationQuaternion(): Quaternion {
        return this.getRotationQuaternion().invert();
    }

    /* #region directions */

    /**
     *
     * @returns the unit vector pointing forward the player controler in world space
     */
    public getForwardDirection(): Vector3 {
        return this.node.getDirection(Axis.Z);
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
        return this.node.getDirection(Axis.Y);
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
        return this.node.getDirection(Axis.X);
    }

    /**
     *
     * @returns the unit vector pointing to the left of the player controler in world space
     */
    public getLeftDirection(): Vector3 {
        return this.getRightDirection().negate();
    }

    /**
     *
     * @param amount
     */
    public roll(amount: number): void {
        this.rotate(this.getForwardDirection(), amount);
    }

    /**
     *
     * @param amount
     */
    public pitch(amount: number): void {
        this.rotate(this.getRightDirection(), amount);
    }

    /**
     *
     * @param amount
     */
    public yaw(amount: number): void {
        this.rotate(this.getUpwardDirection(), amount);
    }

    /* #endregion directions */
}
