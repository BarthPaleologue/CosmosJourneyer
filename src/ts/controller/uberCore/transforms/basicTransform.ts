import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { ITransformLike } from "./ITransformLike";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Axis, Space } from "@babylonjs/core/Maths/math.axis";
import { Scene } from "@babylonjs/core/scene";

/**
 * Very thin wrapper around a BabylonJS TransformNode
 */
export class BasicTransform implements ITransformLike {
    node: TransformNode;

    constructor(name: string, scene: Scene) {
        this.node = new TransformNode(name + "Transform", scene);
        this.node.position = Vector3.Zero();
        this.node.rotationQuaternion = Quaternion.Identity();
    }

    public setAbsolutePosition(newPosition: Vector3): void {
        this.node.setAbsolutePosition(newPosition);
    }

    public getAbsolutePosition(): Vector3 {
        return this.node.getAbsolutePosition();
    }

    public getPosition(): Vector3 {
        return this.node.position;
    }

    public translate(displacement: Vector3): void {
        this.node.setAbsolutePosition(this.node.getAbsolutePosition().add(displacement));
    }

    public rotateAround(pivot: Vector3, axis: Vector3, amount: number): void {
        this.node.rotateAround(pivot, axis, amount);
        this.node.computeWorldMatrix(true);
    }

    public rotate(axis: Vector3, amount: number) {
        this.node.rotate(axis, amount, Space.WORLD);
    }

    public getRotationQuaternion(): Quaternion {
        if (this.node.rotationQuaternion === undefined) throw new Error(`Undefined quaternion for ${this.node.name}`);
        if (this.node.rotationQuaternion === null) throw new Error(`Null quaternion for ${this.node.name}`);
        return this.node.rotationQuaternion;
    }

    public getInverseRotationQuaternion(): Quaternion {
        return this.getRotationQuaternion().invert();
    }

    public setRotationQuaternion(newRotation: Quaternion): void {
        this.node.rotationQuaternion = newRotation;
    }

    public getRotationMatrix(): Matrix {
        const rotationMatrix = new Matrix();
        this.getRotationQuaternion().toRotationMatrix(rotationMatrix);
        return rotationMatrix;
    }

    public getInverseRotationMatrix(): Matrix {
        const inverseRotationMatrix = new Matrix();
        this.getInverseRotationQuaternion().toRotationMatrix(inverseRotationMatrix);
        return inverseRotationMatrix;
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

    public dispose(): void {
        this.node.dispose();
    }
}