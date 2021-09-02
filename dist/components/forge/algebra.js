export class Vector3 {
    constructor(x, y, z) {
        this._x = x;
        this._y = y;
        this._z = z;
    }
    getSquaredMagnitude() {
        return Math.pow(this._x, 2) + Math.pow(this._y, 2) + Math.pow(this._z, 2);
    }
    getMagnitude() {
        return Math.sqrt(this.getSquaredMagnitude());
    }
    scaleToNew(scaleFactor) {
        return new Vector3(this._x * scaleFactor, this._y * scaleFactor, this._z * scaleFactor);
    }
    addToNew(otherVector) {
        return new Vector3(this._x + otherVector._x, this._y + otherVector._y, this._z + otherVector._z);
    }
    addInPlace(otherVector) {
        this._x += otherVector._x;
        this._y += otherVector._y;
        this._z += otherVector._z;
    }
    normalizeToNew() {
        return this.scaleToNew(1 / this.getMagnitude());
    }
    static Zero() {
        return new Vector3(0, 0, 0);
    }
    static FromArray(array) {
        return new Vector3(array[0], array[1], array[2]);
    }
    applyMatrixToNew(matrix) {
        let newVector = Vector3.Zero();
        let m = matrix.m;
        newVector._x = m[0][0] * this._x + m[0][1] * this._y + m[0][2] * this._z;
        newVector._y = m[1][0] * this._x + m[1][1] * this._y + m[1][2] * this._z;
        newVector._z = m[2][0] * this._x + m[2][1] * this._y + m[2][2] * this._z;
        return newVector;
    }
    static DistanceSquared(vector1, vector2) {
        return Math.pow((vector1._x - vector2._x), 2) + Math.pow((vector1._y - vector2._y), 2) + Math.pow((vector1._z - vector2._z), 2);
    }
    static Distance(vector1, vector2) {
        return Math.sqrt(Vector3.DistanceSquared(vector1, vector2));
    }
}
export class Matrix3 {
    constructor(values) {
        this.m = values;
    }
    static RotationX(theta) {
        return new Matrix3([
            [1, 0, 0],
            [0, Math.cos(theta), -Math.sin(theta)],
            [0, Math.sin(theta), Math.cos(theta)]
        ]);
    }
    static RotationY(theta) {
        return new Matrix3([
            [Math.cos(theta), 0, Math.sin(theta)],
            [0, 1, 0],
            [-Math.sin(theta), 0, Math.cos(theta)]
        ]);
    }
    static RotationZ(theta) {
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
}
