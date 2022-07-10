import { ITransformable } from "./iTransformable";
import { Axis, Quaternion, Space, TransformNode, Vector3 } from "@babylonjs/core";

/**
 * Very thin wrapper around a BabylonJS TransformNode
 */
export class BasicTransform implements ITransformable {
    transform: TransformNode;

    constructor(name: string) {
        this.transform = new TransformNode(name + "Transform");
        this.transform.position = Vector3.Zero();
        this.transform.rotationQuaternion = Quaternion.Identity();
    }

    public setAbsolutePosition(newPosition: Vector3): void {
        this.transform.setAbsolutePosition(newPosition);
    }

    public getAbsolutePosition(): Vector3 {
        if (this.transform.getAbsolutePosition()._isDirty) this.transform.computeWorldMatrix(true);
        return this.transform.getAbsolutePosition();
    }

    public translate(displacement: Vector3): void {
        this.setAbsolutePosition(this.getAbsolutePosition().add(displacement));
    }

    public rotateAround(pivot: Vector3, axis: Vector3, amount: number): void {
        this.transform.rotateAround(pivot, axis, amount);
    }

    public rotate(axis: Vector3, amount: number) {
        this.transform.rotate(axis, amount, Space.WORLD);
    }

    public getRotationQuaternion(): Quaternion {
        if (this.transform.rotationQuaternion == undefined) throw new Error(`Undefined quaternion for ${this.transform.name}`);
        return this.transform.rotationQuaternion;
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
}
