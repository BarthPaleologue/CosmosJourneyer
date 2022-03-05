import {Vector2, Vector3, Vector4, Quaternion} from "@babylonjs/core";

export class Vector {
    private readonly components: number[];
    constructor(...components: number[]) {
        this.components = components;
    }
    public get dim(): number {
        return this.components.length;
    }
    public get x(): number {
        if (this.dim == 0) throw Error("The vector has no x component !");
        return this.components[0];
    }
    public set x(v: number) {
        this.components[0] = v;
    }
    public get y(): number {
        if (this.dim <= 1) throw Error("The vector has no y component !");
        return this.components[1];
    }
    public set y(v: number) {
        this.components[1] = v;
    }
    public get z(): number {
        if (this.dim <= 2) throw Error("The vector has no z component !");
        return this.components[2];
    }
    public set z(v: number) {
        this.components[2] = v;
    }
    public get w(): number {
        if (this.dim <= 3) throw Error("The vector has no w component !");
        return this.components[3];
    }
    public set w(v: number) {
        this.components[3] = v;
    }
    public get r(): number {
        if (this.dim == 0) throw Error("The vector has no r component !");
        return this.components[0];
    }
    public get g(): number {
        if (this.dim <= 1) throw Error("The vector has no g component !");
        return this.components[1];
    }
    public get b(): number {
        if (this.dim <= 2) throw Error("The vector has no b component !");
        return this.components[2];
    }
    public get a(): number {
        if (this.dim <= 3) throw Error("The vector has no a component !");
        return this.components[3];
    }
    public get xy(): Vector {
        return new Vector(this.x, this.y);
    }
    public set xy(vector: Vector) {
        if (vector.dim != 2) throw Error("Setting 2D Vector with ND Vector where N != 2 : Dimension mismatch");
        this.x = vector.x;
        this.y = vector.y;
    }
    public get xz(): Vector {
        return new Vector(this.x, this.z);
    }
    public set xz(vector: Vector) {
        if (vector.dim != 2) throw Error("Setting 2D Vector with ND Vector where N != 2 : Dimension mismatch");
        this.x = vector.x;
        this.z = vector.y;
    }
    public get yx(): Vector {
        return new Vector(this.y, this.x);
    }
    public set yx(vector: Vector) {
        if (vector.dim != 2) throw Error("Setting 2D Vector with ND Vector where N != 2 : Dimension mismatch");
        this.y = vector.x;
        this.x = vector.y;
    }
    public get yz(): Vector {
        return new Vector(this.y, this.z);
    }
    public set yz(vector: Vector) {
        if (vector.dim != 2) throw Error("Setting 2D Vector with ND Vector where N != 2 : Dimension mismatch");
        this.y = vector.x;
        this.z = vector.y;
    }
    public get zx(): Vector {
        return new Vector(this.z, this.x);
    }
    public set zx(vector: Vector) {
        if (vector.dim != 2) throw Error("Setting 2D Vector with ND Vector where N != 2 : Dimension mismatch");
        this.z = vector.x;
        this.x = vector.y;
    }
    public get zw(): Vector {
        return new Vector(this.z, this.w);
    }
    public get xxx(): Vector {
        return Vector.Ns(this.x, 3);
    }
    public get yyy(): Vector {
        return Vector.Ns(this.y, 3);
    }
    public get zzz(): Vector {
        return Vector.Ns(this.z, 3);
    }
    public get xyz(): Vector {
        return new Vector(this.x, this.y, this.z);
    }
    public get yzx(): Vector {
        return new Vector(this.y, this.z, this.x);
    }
    public get zxy(): Vector {
        return new Vector(this.z, this.x, this.y);
    }
    public get wyz(): Vector {
        return new Vector(this.w, this.y, this.z);
    }
    public get xzx(): Vector {
        return new Vector(this.x, this.z, this.x);
    }
    public get yyyy(): Vector {
        return Vector.Ns(this.y, 4);
    }
    public get xzyw(): Vector {
        return new Vector(this.x, this.z, this.y, this.w);
    }
    public get xxyy(): Vector {
        return new Vector(this.x, this.x, this.y, this.y);
    }
    public get zzww(): Vector {
        return new Vector(this.z, this.z, this.w, this.w);
    }
    public get sum(): number {
        return this.components.reduce((previous: number, value: number) => previous + value, 0);
    }
    public static FromVectors(...vectors: Vector[]): Vector {
        let components: number[] = [];
        for (let vector of vectors) {
            components = components.concat(vector.components);
        }
        return new Vector(...components);
    }
    public static FromVectorsAndNumbers(...array: (Vector | number)[]): Vector {
        let components: number[] = [];
        for (let element of array) {
            if (element instanceof Vector) {
                components = components.concat(element.components);
            } else {
                components.push(element);
            }
        }
        return new Vector(...components);
    }
    public static fromBABYLON(vector: Vector2 | Vector3 | Vector4) {
        let components: number[] = [vector.x, vector.y];
        if (vector instanceof Vector3) components.push(vector.z);
        if (vector instanceof Vector4) components.push(vector.w);
        return new Vector(...components);
    }
    public static Ns(n: number, dim: number) {
        return new Vector(...(new Array(dim)).fill(n));
    }
    public static Zeros(dim: number) {
        return Vector.Ns(0, dim);
    }
    public static Ones(dim: number) {
        return Vector.Ns(1, dim);
    }
    public get(component: number): number {
        if (component >= this.components.length) throw Error("Undefined Component");
        return this.components[component];
    }
    public getSquaredMagnitude(): number {
        return this.components.reduce(
            (previousValue: number, currentValue: number) => {
                return previousValue + currentValue ** 2;
            }, 0);
    }
    public getMagnitude(): number {
        return Math.sqrt(this.getSquaredMagnitude());
    }
    public scale(scaleFactor: number): Vector {
        return new Vector(...this.components.map((value: number) => { return value * scaleFactor; }));
    }
    public scaleInPlace(scaleFactor: number): void {
        for (let i = 0; i < this.components.length; i++) {
            this.components[i] *= scaleFactor;
        }
    }
    public divide(divideFactor: number): Vector {
        if (divideFactor == 0) throw Error("Division par 0");
        return this.scale(1 / divideFactor);
    }
    public divideInPlace(divideFactor: number): void {
        if (divideFactor == 0) throw Error("Division par 0");
        this.scaleInPlace(1 / divideFactor);
    }
    public normalize(): Vector {
        return this.divide(this.getMagnitude());
    }
    public normalizeInPlace(): void {
        this.divideInPlace(this.getMagnitude());
    }
    public add(otherVector: Vector) {
        if (this.dim != otherVector.dim) new Error("Dimension error while adding");
        let components: number[] = this.components.map((value: number, i: number) => {
            return value + otherVector.get(i);
        });
        return new Vector(...components);
    }
    public addInPlace(otherVector: Vector) {
        if (this.dim != otherVector.dim) new Error("Dimension error while adding");
        for (let i = 0; i < this.components.length; i++) {
            this.components[i] += otherVector.get(i);
        }
    }
    public subtract(otherVector: Vector) {
        if (this.dim != otherVector.dim) new Error("Dimension error while subtracting");
        let components: number[] = this.components.map((value: number, i: number) => {
            return value - otherVector.get(i);
        });
        return new Vector(...components);
    }
    public subtractInPlace(otherVector: Vector) {
        if (this.dim != otherVector.dim) new Error("Dimension error while subtracting");
        this.addInPlace(otherVector.scale(-1));
    }
    public toBABYLON() {
        if (this.dim == 2) {
            return new Vector2(this.x, this.y);
        } else if (this.dim == 3) {
            return new Vector3(this.x, this.y, this.z);
        } else if (this.dim == 4) {
            return new Vector4(this.x, this.y, this.z, this.w);
        } else {
            throw Error("Vector of too many dimensions : cannot be casted as a BABYLON Vector 2 3 or 4");
        }
    }
    public static DistanceSquared(vector1: Vector, vector2: Vector): number {
        if (vector1.dim != vector2.dim) throw Error("Distance between two vectors of different dimensions !");
        let squaredDistance = 0;
        for (let i = 0; i < vector1.dim; i++) {
            squaredDistance += (vector1.get(i) - vector2.get(i)) ** 2;
        }
        return squaredDistance;
    }
    public static Distance(vector1: Vector, vector2: Vector): number {
        return Math.sqrt(Vector.DistanceSquared(vector1, vector2));
    }
    public static Dot(vector1: Vector, vector2: Vector): number {
        if (vector1.dim != vector2.dim) throw Error("Distance between two vectors of different dimensions !");
        let acc = 0;
        for (let i = 0; i < vector1.dim; i++) {
            acc += vector1.get(i) * vector2.get(i);
        }
        return acc;
    }
    public static Mod(vector1: Vector, vector2: Vector): Vector {
        return new Vector(...vector1.components.map((val: number, i: number) => { return val % vector2.get(i); }));
    }

    public static Step(edge: Vector, x: Vector): Vector {
        return Vector.PerComponentOperation(edge, x, (edgei: number, xi: number) => {
            return (xi < edgei) ? 0.0 : 1.0;
        });
    }

    public static Min(vector1: Vector, vector2: Vector) {
        return Vector.PerComponentOperation(vector1, vector2, Math.min);
    }

    public static Max(vector1: Vector, vector2: Vector) {
        return Vector.PerComponentOperation(vector1, vector2, Math.max);
    }

    public static PerComponentOperation(vector1: Vector, vector2: Vector, f: (v1i: number, v2i: number) => number) {
        if (vector1.dim != vector2.dim) throw Error("Vectors does not have the same dimension !");
        return new Vector(...vector1.components.map((vector1i: number, i: number) => {
            return f(vector1i, vector2.get(i));
        }));
    }

    public applyFunction(f: (v: number) => number): Vector {
        return new Vector(...this.components.map((value: number) => { return f(value); }));
    }

    public fract(): Vector {
        return new Vector(...this.components.map((value: number) => {
            return value % 1;
        }));
    }

    public floor(): Vector {
        return new Vector(...this.components.map((value: number) => {
            return Math.floor(value);
        }));
    }

    public floorInPlace(): void {
        this.components.forEach((value: number) => Math.floor(value));
    }

    public abs(): Vector {
        return new Vector(...this.components.map((value: number) => {
            return Math.abs(value);
        }));
    }

    public absInPlace(): void {
        this.components.forEach((value: number) => Math.abs(value));
    }

    public multiply(otherVector: Vector): Vector {
        return new Vector(...this.components.map((value: number, i: number) => {
            return value * otherVector.get(i);
        }));
    }

    public addNumber(x: number): Vector {
        return new Vector(...this.components.map((value: number) => { return value + x; }));
    }

    public isZero(): boolean {
        for (const component of this.components) {
            if (component != 0) return false;
        }
        return true;
    }

    public toArray(): number[] {
        return this.components;
    }
}

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
    public static normalizeInPlace(vector: Vector3): void {
        let mag = vector.length();
        vector.scaleInPlace(1 / mag);
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