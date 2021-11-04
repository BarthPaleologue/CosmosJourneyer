export class Vector {
    private components: number[];
    constructor(...components: number[]) {
        this.components = components;
        //Object.seal(this.components); performance issues ? weird
    }
    public get dim(): number {
        return this.components.length;
    }
    public get x(): number {
        if (this.dim == 0) throw Error("The vector has no x component !");
        return this.components[0];
    }
    public get y(): number {
        if (this.dim <= 1) throw Error("The vector has no y component !");
        return this.components[1];
    }
    public get z(): number {
        if (this.dim <= 2) throw Error("The vector has no z component !");
        return this.components[2];
    }
    public get w(): number {
        if (this.dim <= 3) throw Error("The vector has no w component !");
        return this.components[3];
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
    public static fromBABYLON(vector: BABYLON.Vector2 | BABYLON.Vector3 | BABYLON.Vector4) {
        let components: number[] = [vector.x, vector.y];
        if (vector instanceof BABYLON.Vector3) components.push(vector.z);
        if (vector instanceof BABYLON.Vector4) components.push(vector.w);
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
    public scaleToNew(scaleFactor: number): Vector {
        return new Vector(...this.components.map((value: number) => { return value * scaleFactor; }));
    }
    public scaleInPlace(scaleFactor: number): void {
        this.components.forEach((value: number) => value * scaleFactor);
    }
    public divideToNew(divideFactor: number): Vector {
        if (divideFactor == 0) throw Error("Division par 0");
        return this.scaleToNew(1 / divideFactor);
    }
    public divideInPlace(divideFactor: number): void {
        if (divideFactor == 0) throw Error("Division par 0");
        this.scaleInPlace(1 / divideFactor);
    }
    public normalizeToNew(): Vector {
        return this.divideToNew(this.getMagnitude());
    }
    public normalizeInPlace(): void {
        this.divideInPlace(this.getMagnitude());
    }
    public addToNew(otherVector: Vector) {
        if (this.dim != otherVector.dim) new Error("Dimension error while adding");
        let components: number[] = this.components.map((value: number, i: number) => {
            return value + otherVector.get(i);
        });
        return new Vector(...components);
    }
    public addInPlace(otherVector: Vector) {
        if (this.dim != otherVector.dim) new Error("Dimension error while adding");
        this.components.forEach((value: number, i: number) => value + otherVector.get(i));
    }
    public subtractToNew(otherVector: Vector) {
        if (this.dim != otherVector.dim) new Error("Dimension error while subtracting");
        let components: number[] = this.components.map((value: number, i: number) => {
            return value - otherVector.get(i);
        });
        return new Vector(...components);
    }
    public subtractInPlace(otherVector: Vector) {
        if (this.dim != otherVector.dim) new Error("Dimension error while subtracting");
        this.components.forEach((value: number, i: number) => value - otherVector.get(i));
    }
    public toBABYLON() {
        if (this.dim == 2) {
            return new BABYLON.Vector2(this.x, this.y);
        } else if (this.dim == 3) {
            return new BABYLON.Vector3(this.x, this.y, this.z);
        } else if (this.dim == 4) {
            return new BABYLON.Vector4(this.x, this.y, this.z, this.w);
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
        return vector1.components.reduce((previousValue: number, value: number, i: number) => {
            return previousValue + value * vector2.get(i);
        });
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

    public floorToNew(): Vector {
        return new Vector(...this.components.map((value: number) => {
            return Math.floor(value);
        }));
    }

    public floorInPlace(): void {
        this.components.forEach((value: number) => Math.floor(value));
    }

    public absToNew(): Vector {
        return new Vector(...this.components.map((value: number) => {
            return Math.abs(value);
        }));
    }

    public absInPlace(): void {
        this.components.forEach((value: number) => Math.abs(value));
    }

    public multiplyToNew(otherVector: Vector): Vector {
        return new Vector(...this.components.map((value: number, i: number) => {
            return value * otherVector.get(i);
        }));
    }

    public addNumberToNew(x: number): Vector {
        return new Vector(...this.components.map((value: number) => { return value + x; }));
    }

    public applySquaredMatrixToNew(matrix: Matrix): Vector {
        if (matrix.dimX != matrix.dimY) throw Error("Dimension error : the matrix is not squared !");
        if (matrix.dimX != this.dim) throw Error("Dimension error while doing Matrix Vector Multiplication !");
        let components: number[] = [];
        for (let i = 0; i < this.dim; i++) {
            let value = 0;
            for (let j = 0; j < matrix.dimX; j++) {
                value += matrix.m[i][j] * this.get(j);
            }
            components.push(value);
        }
        return new Vector(...components);
    }
}

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
    static FromArray3(array: number[]): Vector3 {
        return new Vector3(array[0], array[1], array[2]);
    }
    static FromBABYLON3(vector: BABYLON.Vector3): Vector3 {
        return new Vector3(vector.x, vector.y, vector.z);
    }
    static ToBABYLON3(vector: Vector3): BABYLON.Vector3 {
        return new BABYLON.Vector3(vector.x, vector.y, vector.z);
    }
    applyMatrixToNew(matrix: Matrix): Vector3 {
        let newVector = Vector3.Zero();

        let m = matrix.m;

        newVector.x = m[0][0] * this.x + m[0][1] * this.y + m[0][2] * this.z;
        newVector.y = m[1][0] * this.x + m[1][1] * this.y + m[1][2] * this.z;
        newVector.z = m[2][0] * this.x + m[2][1] * this.y + m[2][2] * this.z;

        return newVector;
    }
    static DistanceSquared(vector1: Vector3, vector2: Vector3) {
        return (vector1.x - vector2.x) ** 2 + (vector1.y - vector2.y) ** 2 + (vector1.z - vector2.z) ** 2;
    }
    static Distance(vector1: Vector3, vector2: Vector3) {
        return Math.sqrt(Vector3.DistanceSquared(vector1, vector2));
    }
    static Dot(vector1: Vector3, vector2: Vector3) {
        return vector1.x * vector2.x + vector1.y * vector2.y + vector1.z * vector2.z;
    }

    static FloorToNew(vector: Vector3) {
        return new Vector3(Math.floor(vector.x), Math.floor(vector.y), Math.floor(vector.z));
    }
}

export class Matrix {
    m: number[][];
    dimX: number;
    dimY: number;
    constructor(values: number[][]) {
        this.m = values;
        this.dimX = values[0].length || 0;
        this.dimY = values.length;
    }
    public static Rotation3DX(theta: number): Matrix {
        return new Matrix([
            [1, 0, 0],
            [0, Math.cos(theta), -Math.sin(theta)],
            [0, Math.sin(theta), Math.cos(theta)]
        ]);
    }
    public static Rotation3DY(theta: number): Matrix {
        return new Matrix([
            [Math.cos(theta), 0, Math.sin(theta)],
            [0, 1, 0],
            [-Math.sin(theta), 0, Math.cos(theta)]
        ]);
    }
    public static Rotation3DZ(theta: number): Matrix {
        return new Matrix([
            [Math.cos(theta), -Math.sin(theta), 0],
            [Math.sin(theta), Math.cos(theta), 0],
            [0, 0, 1]
        ]);
    }
    public static Identity(n: number): Matrix {
        let m: number[][] = [];
        for (let i = 0; i < n; i++) {
            m.push([]);
            for (let j = 0; j < n; j++) {
                m[i][j] = (i == j) ? 1 : 0;
            }
        }
        return new Matrix(m);
    }
    public static Identity3D(): Matrix {
        return this.Identity(3);
    }
    static FromBABYLON(M: BABYLON.Matrix) {
        let m = M.m;
        return new Matrix([
            [m[0], m[4], m[8]],
            [m[1], m[5], m[9]],
            [m[2], m[6], m[10]]
        ]);
    }
}