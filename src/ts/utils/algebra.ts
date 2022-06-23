import { Quaternion, Vector3, Vector4 } from "@babylonjs/core";
import { IVector3Like } from "@babylonjs/core/Maths/math.like";

/**
 * Lightweight vector3 for fast algebra computation
 */
export class LVector3 implements IVector3Like {
    private _x: number;
    private _y: number;
    private _z: number;

    constructor(x: number, y: number, z: number) {
        this._x = x;
        this._y = y;
        this._z = z;
    }

    public get x(): number {
        return this._x;
    }

    public set x(value: number) {
        this._x = value;
    }

    public get y(): number {
        return this._y;
    }

    public set y(value: number) {
        this._y = value;
    }

    public get z(): number {
        return this._z;
    }

    public set z(value: number) {
        this._z = value;
    }

    /**
     *
     * @returns the euclidean squared magnitude of the current vector
     */
    getSquaredMagnitude(): number {
        return this._x ** 2 + this._y ** 2 + this._z ** 2;
    }

    /**
     *
     * @returns the euclidean magnitude of the current vector
     */
    getMagnitude(): number {
        return Math.sqrt(this.getSquaredMagnitude());
    }

    /**
     *
     * @param scaleFactor the factor you want your new vector scaled to
     * @returns a new Vector3, copy of the current one scaled by the scaleFactor
     */
    scale(scaleFactor: number): LVector3 {
        return new LVector3(this._x * scaleFactor, this._y * scaleFactor, this._z * scaleFactor);
    }

    scaleInPlace(scaleFactor: number): void {
        this._x *= scaleFactor;
        this._y *= scaleFactor;
        this._z *= scaleFactor;
    }

    divide(divisor: number): LVector3 {
        return new LVector3(this._x / divisor, this._y / divisor, this._z / divisor);
    }

    divideInPlace(divisor: number): void {
        this._x /= divisor;
        this._y /= divisor;
        this._z /= divisor;
    }

    /**
     *
     * @param otherVector The other Vector3 you want to add
     * @returns returns the sum of the current Vector3 and the other Vector3 as a new Vector3
     */
    add(otherVector: IVector3Like): LVector3 {
        return new LVector3(this._x + otherVector.x, this._y + otherVector.y, this._z + otherVector.z);
    }

    addInPlace(otherVector: IVector3Like): void {
        this._x += otherVector.x;
        this._y += otherVector.y;
        this._z += otherVector.z;
    }

    subtract(otherVector: IVector3Like): LVector3 {
        return new LVector3(this._x - otherVector.x, this._y - otherVector.y, this._z - otherVector.z);
    }

    subtractInPlace(otherVector: IVector3Like): void {
        this._x -= otherVector.x;
        this._y -= otherVector.y;
        this._z -= otherVector.z;
    }

    normalize(): LVector3 {
        return this.scale(1 / this.getMagnitude());
    }

    normalizeInPlace(): void {
        this.scaleInPlace(1 / this.getMagnitude());
    }

    public setMagnitudeInPlace(newMagnitude: number): void {
        this.normalizeInPlace();
        this.scaleInPlace(newMagnitude);
    }

    public clone(): LVector3 {
        return new LVector3(this._x, this._y, this._z);
    }

    static Zero(): LVector3 {
        return new LVector3(0, 0, 0);
    }

    public static Dot(vector1: IVector3Like, vector2: IVector3Like): number {
        return vector1.x * vector2.x + vector1.y * vector2.y + vector1.z * vector2.z;
    }

    applyRotationQuaternionInPlace(q: Quaternion): void {
        // apply quaternion to vector
        let ix = q.w * this.x + q.y * this.z - q.z * this.y;
        let iy = q.w * this.y + q.z * this.x - q.x * this.z;
        let iz = q.w * this.z + q.x * this.y - q.y * this.x;
        let iw = -q.x * this.x - q.y * this.y - q.z * this.z;
        // calculate result * inverse quat
        this.x = ix * q.w + iw * -q.x + iy * -q.z - iz * -q.y;
        this.y = iy * q.w + iw * -q.y + iz * -q.x - ix * -q.z;
        this.z = iz * q.w + iw * -q.z + ix * -q.y - iy * -q.x;
    }
}

export type Vec3 = Vector3 | LVector3;

/**
 * Removes the rotation around an axis from the quaternion
 * @param quaternion the quaternion to strip
 * @param axisToRemove the axis to remove the rotation around (unit vector)
 * @return a new Quaternion
 * @see https://stackoverflow.com/a/22401169
 */
export function stripAxisFromQuaternion(quaternion: Quaternion, axisToRemove: Vector3): Quaternion {
    const rotationAxis = new Vector3(quaternion.x, quaternion.y, quaternion.z);
    const p = axisToRemove.scale(Vector3.Dot(rotationAxis, axisToRemove)); // return projection v1 on to v2  (parallel component)
    const twist = new Quaternion(p.x, p.y, p.z, quaternion.w);
    twist.normalize();
    return quaternion.multiply(twist.conjugate());
}

export function getAxisComponentFromQuaternion(quaternion: Quaternion, axisToGet: Vector3): Quaternion {
    const rotationAxis = new Vector3(quaternion.x, quaternion.y, quaternion.z);
    const p = axisToGet.scale(Vector3.Dot(rotationAxis, axisToGet)); // return projection v1 on to v2  (parallel component)
    const twist = new Quaternion(p.x, p.y, p.z, quaternion.w);
    return twist.normalize().conjugate();
}
