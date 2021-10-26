export class Vector3 {
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
    scaleToNew(scaleFactor: number): Vector3 {
        return new Vector3(this._x * scaleFactor, this._y * scaleFactor, this._z * scaleFactor);
    }

    /**
     * 
     * @param otherVector The other Vector3 you want to add
     * @returns returns the sum of the current Vector3 and the other Vector3 as a new Vector3
     */
    addToNew(otherVector: Vector3): Vector3 {
        return new Vector3(this._x + otherVector._x, this._y + otherVector._y, this._z + otherVector._z);
    }
    addInPlace(otherVector: Vector3): void {
        this._x += otherVector._x;
        this._y += otherVector._y;
        this._z += otherVector._z;
    }
    subtractToNew(otherVector: Vector3): Vector3 {
        return new Vector3(this._x - otherVector._x, this._y - otherVector._y, this._z - otherVector._z);
    }
    normalizeToNew(): Vector3 {
        return this.scaleToNew(1 / this.getMagnitude());
    }
    static Zero(): Vector3 {
        return new Vector3(0, 0, 0);
    }
    static FromArray(array: number[]): Vector3 {
        return new Vector3(array[0], array[1], array[2]);
    }
    static FromBABYLON(vector: BABYLON.Vector3): Vector3 {
        return new Vector3(vector.x, vector.y, vector.z);
    }
    static ToBABYLON(vector: Vector3): BABYLON.Vector3 {
        return new BABYLON.Vector3(vector._x, vector._y, vector._z);
    }
    applyMatrixToNew(matrix: Matrix3): Vector3 {
        let newVector = Vector3.Zero();

        let m = matrix.m;

        newVector._x = m[0][0] * this._x + m[0][1] * this._y + m[0][2] * this._z;
        newVector._y = m[1][0] * this._x + m[1][1] * this._y + m[1][2] * this._z;
        newVector._z = m[2][0] * this._x + m[2][1] * this._y + m[2][2] * this._z;

        return newVector;
    }
    static DistanceSquared(vector1: Vector3, vector2: Vector3) {
        return (vector1._x - vector2._x) ** 2 + (vector1._y - vector2._y) ** 2 + (vector1._z - vector2._z) ** 2;
    }
    static Distance(vector1: Vector3, vector2: Vector3) {
        return Math.sqrt(Vector3.DistanceSquared(vector1, vector2));
    }
    static Dot(vector1: Vector3, vector2: Vector3) {
        return vector1._x * vector2._x + vector1._y * vector2._y + vector1._z * vector2._z;
    }
}

export class Matrix3 {
    m: number[][];
    constructor(values: number[][]) {
        this.m = values;
    }
    static RotationX(theta: number) {
        return new Matrix3([
            [1, 0, 0],
            [0, Math.cos(theta), -Math.sin(theta)],
            [0, Math.sin(theta), Math.cos(theta)]
        ]);
    }
    static RotationY(theta: number) {
        return new Matrix3([
            [Math.cos(theta), 0, Math.sin(theta)],
            [0, 1, 0],
            [-Math.sin(theta), 0, Math.cos(theta)]
        ]);
    }
    static RotationZ(theta: number) {
        return new Matrix3([
            [Math.cos(theta), -Math.sin(theta), 0],
            [Math.sin(theta), Math.cos(theta), 0],
            [0, 0, 1]
        ]);
    }
    static Identity() {
        return new Matrix3([
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ]);
    }
    static FromBABYLON(M: BABYLON.Matrix) {
        let m = M.m;
        return new Matrix3([
            [m[0], m[4], m[8]],
            [m[1], m[5], m[9]],
            [m[2], m[6], m[10]]
        ]);
    }
}