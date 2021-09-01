export class Vector3 {
    _x: number;
    _y: number;
    _z: number;
    constructor(x: number, y: number, z: number) {
        this._x = x;
        this._y = y;
        this._z = z;
    }
    getSquaredMagnitude(): number {
        return this._x ** 2 + this._y ** 2 + this._z ** 2;
    }
    getMagnitude(): number {
        return Math.sqrt(this.getSquaredMagnitude());
    }
    scaleToNew(scaleFactor: number): Vector3 {
        return new Vector3(this._x * scaleFactor, this._y * scaleFactor, this._z * scaleFactor);
    }
    addToNew(otherVector: Vector3): Vector3 {
        return new Vector3(this._x + otherVector._x, this._y + otherVector._y, this._z + otherVector._z);
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
}