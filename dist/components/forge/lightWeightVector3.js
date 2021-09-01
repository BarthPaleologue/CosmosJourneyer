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
    normalizeToNew() {
        return this.scaleToNew(1 / this.getMagnitude());
    }
    static Zero() {
        return new Vector3(0, 0, 0);
    }
    static FromArray(array) {
        return new Vector3(array[0], array[1], array[2]);
    }
}
