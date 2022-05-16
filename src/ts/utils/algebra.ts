import {Vector3, Quaternion} from "@babylonjs/core";

/**
 * Lightweight vector3 for fast algebra computation
 */
export class LVector3 {
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
    add(otherVector: LVector3): LVector3 {
        return new LVector3(this._x + otherVector.x, this._y + otherVector.y, this._z + otherVector.z);
    }

    addInPlace(otherVector: LVector3): void {
        this._x += otherVector.x;
        this._y += otherVector.y;
        this._z += otherVector.z;
    }

    subtract(otherVector: LVector3): LVector3 {
        return new LVector3(this._x - otherVector.x, this._y - otherVector.y, this._z - otherVector.z);
    }

    subtractInPlace(otherVector: LVector3): void {
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
    //https://www.wikiwand.com/en/Quaternions_and_spatial_rotation
    applyQuaternionInPlace(quaternion: Quaternion): void {
        Algebra.applyQuaternionInPlace(quaternion, this);
    }
}

export type Vec3 = Vector3 | LVector3;

export class Algebra {
    public static applyQuaternionInPlace(quaternion: Quaternion, vector: Vec3) {
        let qx = quaternion.x;
        let qy = quaternion.y;
        let qz = quaternion.z;
        let qw = quaternion.w;
        let x = vector.x;
        let y = vector.y;
        let z = vector.z;
        // apply quaternion to vector
        let ix = qw * x + qy * z - qz * y;
        let iy = qw * y + qz * x - qx * z;
        let iz = qw * z + qx * y - qy * x;
        let iw = -qx * x - qy * y - qz * z;
        // calculate result * inverse quat
        vector.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
        vector.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
        vector.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    }
    public static Dot(vector1: Vec3, vector2: Vec3): number {
        return vector1.x * vector2.x + vector1.y * vector2.y + vector1.z * vector2.z;
    }
}

export class LQuaternion extends Quaternion {
    constructor(x: number, y: number, z: number, w: number) {
        super(x, y, z, w);
    }
    static RotationX(angle: number): Quaternion {
        return new Quaternion(Math.sin(angle / 2), 0, 0, Math.cos(angle / 2));
    }
    static RotationY(angle: number): Quaternion {
        return new Quaternion(0, Math.sin(angle / 2), 0, Math.cos(angle / 2));
    }
    static RotationZ(angle: number): Quaternion {
        return new Quaternion(0, 0, Math.sin(angle / 2), Math.cos(angle / 2));
    }
}