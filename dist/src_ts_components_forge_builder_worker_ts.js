"use strict";
(self["webpackChunkmy_webpack_project"] = self["webpackChunkmy_webpack_project"] || []).push([["src_ts_components_forge_builder_worker_ts"],{

/***/ "./src/ts/components/forge/algebra.ts":
/*!********************************************!*\
  !*** ./src/ts/components/forge/algebra.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Vector3": () => (/* binding */ Vector3),
/* harmony export */   "Matrix3": () => (/* binding */ Matrix3)
/* harmony export */ });
class Vector3 {
    constructor(x, y, z) {
        this._x = x;
        this._y = y;
        this._z = z;
    }
    getSquaredMagnitude() {
        return this._x ** 2 + this._y ** 2 + this._z ** 2;
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
        return (vector1._x - vector2._x) ** 2 + (vector1._y - vector2._y) ** 2 + (vector1._z - vector2._z) ** 2;
    }
    static Distance(vector1, vector2) {
        return Math.sqrt(Vector3.DistanceSquared(vector1, vector2));
    }
}
class Matrix3 {
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


/***/ }),

/***/ "./src/ts/components/forge/builder.worker.ts":
/*!***************************************************!*\
  !*** ./src/ts/components/forge/builder.worker.ts ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _direction__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./direction */ "./src/ts/components/forge/direction.ts");
/* harmony import */ var _layers_simplexNoiseLayer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./layers/simplexNoiseLayer */ "./src/ts/components/forge/layers/simplexNoiseLayer.ts");
/* harmony import */ var _layers_filters_craterFilter__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./layers/filters/craterFilter */ "./src/ts/components/forge/layers/filters/craterFilter.ts");
/* harmony import */ var _computeNormals__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./computeNormals */ "./src/ts/components/forge/computeNormals.ts");
/* harmony import */ var _algebra__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./algebra */ "./src/ts/components/forge/algebra.ts");
/* harmony import */ var _layers_moutainNoiseLayer__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./layers/moutainNoiseLayer */ "./src/ts/components/forge/layers/moutainNoiseLayer.ts");
/* harmony import */ var _layers_continentNoiseLayer__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./layers/continentNoiseLayer */ "./src/ts/components/forge/layers/continentNoiseLayer.ts");







let craterModifiers = {
    radiusModifier: 1,
    steepnessModifier: 1,
    maxDepthModifier: 1,
    scaleFactor: 1,
};
let noiseModifiers = {
    amplitudeModifier: 1,
    offsetModifier: [0, 0, 0],
    frequencyModifier: 1,
    minValueModifier: 1,
    archipelagoFactor: 0.5,
};
let bumpyLayer;
let continentsLayer2;
let continentsLayer3;
let mountainsLayer2;
function initLayers() {
    bumpyLayer = new _layers_simplexNoiseLayer__WEBPACK_IMPORTED_MODULE_1__.SimplexNoiseLayer(1e-4, 5, 2, 2, 0.0);
    continentsLayer2 = new _layers_simplexNoiseLayer__WEBPACK_IMPORTED_MODULE_1__.SimplexNoiseLayer(5e-6, 5, 1.8, 2, noiseModifiers.archipelagoFactor);
    continentsLayer3 = new _layers_continentNoiseLayer__WEBPACK_IMPORTED_MODULE_6__.ContinentNoiseLayer(2e-5, 5, 1.5, 2, 0.0);
    mountainsLayer2 = new _layers_moutainNoiseLayer__WEBPACK_IMPORTED_MODULE_5__.MountainNoiseLayer(2e-5, 6, 2, 2, 0.0);
}
initLayers();
let craterFilter = new _layers_filters_craterFilter__WEBPACK_IMPORTED_MODULE_2__.CraterFilter([]);
let moutainHeight = 10000;
let bumpyHeight = 300;
function terrainFunction(p, craterFilter, planetRadius) {
    let initialPosition = [p._x, p._y, p._z];
    let initialMagnitude = Math.sqrt(initialPosition[0] ** 2 + initialPosition[1] ** 2 + initialPosition[2] ** 2);
    // on se ramène à la position à la surface du globe (sans relief)
    initialPosition = initialPosition.map((value) => value * planetRadius / initialMagnitude);
    let coords = _algebra__WEBPACK_IMPORTED_MODULE_4__.Vector3.FromArray(initialPosition); // p.normalizeToNew().scale(planetRadius);
    let unitCoords = coords.normalizeToNew().scaleToNew(noiseModifiers.frequencyModifier);
    let elevation = 0;
    let craterMask = craterFilter.evaluate(unitCoords, craterModifiers) / 20;
    elevation += craterMask;
    let continentMask = continentsLayer2.evaluate(coords);
    //if (continentMask < 0.1) continentMask = 0;
    elevation += continentMask * mountainsLayer2.evaluate(coords) * moutainHeight;
    elevation += bumpyLayer.evaluate(coords) * bumpyHeight;
    let newPosition = p.addToNew(unitCoords.scaleToNew(elevation));
    return new _algebra__WEBPACK_IMPORTED_MODULE_4__.Vector3(newPosition._x, newPosition._y, newPosition._z);
}
;
onmessage = e => {
    if (e.data.taskType == "buildTask") {
        let chunkLength = e.data.chunkLength;
        let subs = e.data.subdivisions;
        let depth = e.data.depth;
        let direction = e.data.direction;
        let offset = e.data.position;
        craterFilter.setCraters(e.data.craters);
        noiseModifiers = e.data.noiseModifiers;
        craterModifiers = e.data.craterModifiers;
        initLayers();
        let size = chunkLength / (2 ** depth);
        let planetRadius = chunkLength / 2;
        let vertices = [];
        let faces = [];
        //let uvs: number[] = [];
        let vertexPerLine = subs + 1;
        let rotation = _algebra__WEBPACK_IMPORTED_MODULE_4__.Matrix3.Identity();
        switch (direction) {
            case _direction__WEBPACK_IMPORTED_MODULE_0__.Direction.Up:
                rotation = _algebra__WEBPACK_IMPORTED_MODULE_4__.Matrix3.RotationX(-Math.PI / 2);
                break;
            case _direction__WEBPACK_IMPORTED_MODULE_0__.Direction.Down:
                rotation = _algebra__WEBPACK_IMPORTED_MODULE_4__.Matrix3.RotationX(Math.PI / 2);
                break;
            case _direction__WEBPACK_IMPORTED_MODULE_0__.Direction.Forward:
                rotation = _algebra__WEBPACK_IMPORTED_MODULE_4__.Matrix3.Identity();
                break;
            case _direction__WEBPACK_IMPORTED_MODULE_0__.Direction.Backward:
                rotation = _algebra__WEBPACK_IMPORTED_MODULE_4__.Matrix3.RotationY(-Math.PI);
                break;
            case _direction__WEBPACK_IMPORTED_MODULE_0__.Direction.Left:
                rotation = _algebra__WEBPACK_IMPORTED_MODULE_4__.Matrix3.RotationY(Math.PI / 2);
                break;
            case _direction__WEBPACK_IMPORTED_MODULE_0__.Direction.Right:
                rotation = _algebra__WEBPACK_IMPORTED_MODULE_4__.Matrix3.RotationY(-Math.PI / 2);
                break;
        }
        for (let x = 0; x < vertexPerLine; x++) {
            for (let y = 0; y < vertexPerLine; y++) {
                let vertexPosition = new _algebra__WEBPACK_IMPORTED_MODULE_4__.Vector3((x - subs / 2) / subs, (y - subs / 2) / subs, 0);
                vertexPosition = vertexPosition.scaleToNew(size);
                let vecOffset = _algebra__WEBPACK_IMPORTED_MODULE_4__.Vector3.FromArray(offset);
                vertexPosition = vertexPosition.addToNew(vecOffset);
                vertexPosition = vertexPosition.applyMatrixToNew(rotation);
                vertexPosition = vertexPosition.normalizeToNew().scaleToNew(planetRadius);
                //let offset2 = BABYLON.Vector3.TransformCoordinates(BABYLON.Vector3.FromArray(offset), rotation);
                vertexPosition = terrainFunction(vertexPosition, craterFilter, planetRadius);
                // solving floating point precision
                //vertexPosition = vertexPosition.subtract(offset2);
                vertices.push(vertexPosition._x, vertexPosition._y, vertexPosition._z);
                //uvs.push(x / vertexPerLine, y / vertexPerLine);
                if (x < vertexPerLine - 1 && y < vertexPerLine - 1) {
                    faces.push([
                        x * vertexPerLine + y,
                        x * vertexPerLine + y + 1,
                        (x + 1) * vertexPerLine + y + 1,
                        (x + 1) * vertexPerLine + y,
                    ]);
                }
            }
        }
        let positions = vertices;
        let indices = [];
        let normals = [];
        // indices from faces
        for (let face of faces) {
            for (let i = 0; i < face.length - 2; i++) {
                indices.push(face[0], face[i + 2], face[i + 1]);
            }
        }
        (0,_computeNormals__WEBPACK_IMPORTED_MODULE_3__.ComputeNormals)(positions, indices, normals);
        let tPositions = new Float32Array(positions.length);
        tPositions.set(positions);
        let tIndices = new Int16Array(indices.length);
        tIndices.set(indices);
        let tNormals = new Float32Array(normals.length);
        tNormals.set(normals);
        //@ts-ignore
        postMessage({
            p: tPositions,
            i: tIndices,
            n: tNormals,
            //@ts-ignore
        }, [tPositions.buffer, tIndices.buffer, tNormals.buffer]);
    }
    else {
        console.log(`Tâche reçue : ${e.data.taskType}`);
    }
};


/***/ }),

/***/ "./src/ts/components/forge/computeNormals.ts":
/*!***************************************************!*\
  !*** ./src/ts/components/forge/computeNormals.ts ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ComputeNormals": () => (/* binding */ ComputeNormals)
/* harmony export */ });
//https://github.com/BabylonJS/Babylon.js/blob/master/src/Meshes/mesh.vertexData.ts
function ComputeNormals(positions, indices, normals) {
    // temporary scalar variables
    var index = 0; // facet index
    var p1p2x = 0.0; // p1p2 vector x coordinate
    var p1p2y = 0.0; // p1p2 vector y coordinate
    var p1p2z = 0.0; // p1p2 vector z coordinate
    var p3p2x = 0.0; // p3p2 vector x coordinate
    var p3p2y = 0.0; // p3p2 vector y coordinate
    var p3p2z = 0.0; // p3p2 vector z coordinate
    var faceNormalx = 0.0; // facet normal x coordinate
    var faceNormaly = 0.0; // facet normal y coordinate
    var faceNormalz = 0.0; // facet normal z coordinate
    var length = 0.0; // facet normal length before normalization
    var v1x = 0; // vector1 x index in the positions array
    var v1y = 0; // vector1 y index in the positions array
    var v1z = 0; // vector1 z index in the positions array
    var v2x = 0; // vector2 x index in the positions array
    var v2y = 0; // vector2 y index in the positions array
    var v2z = 0; // vector2 z index in the positions array
    var v3x = 0; // vector3 x index in the positions array
    var v3y = 0; // vector3 y index in the positions array
    var v3z = 0; // vector3 z index in the positions array
    var faceNormalSign = 1;
    // reset the normals
    for (index = 0; index < positions.length; index++) {
        normals[index] = 0.0;
    }
    // Loop : 1 indice triplet = 1 facet
    var nbFaces = (indices.length / 3) | 0;
    for (index = 0; index < nbFaces; index++) {
        // get the indexes of the coordinates of each vertex of the facet
        v1x = indices[index * 3] * 3;
        v1y = v1x + 1;
        v1z = v1x + 2;
        v2x = indices[index * 3 + 1] * 3;
        v2y = v2x + 1;
        v2z = v2x + 2;
        v3x = indices[index * 3 + 2] * 3;
        v3y = v3x + 1;
        v3z = v3x + 2;
        p1p2x = positions[v1x] - positions[v2x]; // compute two vectors per facet : p1p2 and p3p2
        p1p2y = positions[v1y] - positions[v2y];
        p1p2z = positions[v1z] - positions[v2z];
        p3p2x = positions[v3x] - positions[v2x];
        p3p2y = positions[v3y] - positions[v2y];
        p3p2z = positions[v3z] - positions[v2z];
        // compute the face normal with the cross product
        faceNormalx = faceNormalSign * (p1p2y * p3p2z - p1p2z * p3p2y);
        faceNormaly = faceNormalSign * (p1p2z * p3p2x - p1p2x * p3p2z);
        faceNormalz = faceNormalSign * (p1p2x * p3p2y - p1p2y * p3p2x);
        // normalize this normal and store it in the array facetData
        length = Math.sqrt(faceNormalx * faceNormalx + faceNormaly * faceNormaly + faceNormalz * faceNormalz);
        length = (length === 0) ? 1.0 : length;
        faceNormalx /= length;
        faceNormaly /= length;
        faceNormalz /= length;
        // compute the normals anyway
        normals[v1x] += faceNormalx; // accumulate all the normals per face
        normals[v1y] += faceNormaly;
        normals[v1z] += faceNormalz;
        normals[v2x] += faceNormalx;
        normals[v2y] += faceNormaly;
        normals[v2z] += faceNormalz;
        normals[v3x] += faceNormalx;
        normals[v3y] += faceNormaly;
        normals[v3z] += faceNormalz;
    }
    // last normalization of each normal
    for (index = 0; index < normals.length / 3; index++) {
        faceNormalx = normals[index * 3];
        faceNormaly = normals[index * 3 + 1];
        faceNormalz = normals[index * 3 + 2];
        length = Math.sqrt(faceNormalx * faceNormalx + faceNormaly * faceNormaly + faceNormalz * faceNormalz);
        length = (length === 0) ? 1.0 : length;
        faceNormalx /= length;
        faceNormaly /= length;
        faceNormalz /= length;
        normals[index * 3] = faceNormalx;
        normals[index * 3 + 1] = faceNormaly;
        normals[index * 3 + 2] = faceNormalz;
    }
}


/***/ }),

/***/ "./src/ts/components/forge/direction.ts":
/*!**********************************************!*\
  !*** ./src/ts/components/forge/direction.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Direction": () => (/* binding */ Direction)
/* harmony export */ });
var Direction;
(function (Direction) {
    Direction[Direction["Up"] = 0] = "Up";
    Direction[Direction["Down"] = 1] = "Down";
    Direction[Direction["Left"] = 2] = "Left";
    Direction[Direction["Right"] = 3] = "Right";
    Direction[Direction["Forward"] = 4] = "Forward";
    Direction[Direction["Backward"] = 5] = "Backward";
})(Direction || (Direction = {}));


/***/ }),

/***/ "./src/ts/components/forge/layers/continentNoiseLayer.ts":
/*!***************************************************************!*\
  !*** ./src/ts/components/forge/layers/continentNoiseLayer.ts ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ContinentNoiseLayer": () => (/* binding */ ContinentNoiseLayer)
/* harmony export */ });
/* harmony import */ var _engine_noiseTools__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../engine/noiseTools */ "./src/ts/engine/noiseTools.ts");

class ContinentNoiseLayer {
    constructor(frequency, nbOctaves, decay, lacunarity, minValue) {
        this._frequency = frequency;
        this._nbOctaves = nbOctaves;
        this._decay = decay;
        this._lacunarity = lacunarity;
        this._minValue = minValue;
    }
    evaluate(coords) {
        let noiseValue = 0.0;
        let totalAmplitude = 0.0;
        for (let i = 0; i < this._nbOctaves; i++) {
            let samplePoint = coords.scaleToNew(this._frequency);
            samplePoint = samplePoint.scaleToNew(Math.pow(this._lacunarity, i));
            noiseValue += (0,_engine_noiseTools__WEBPACK_IMPORTED_MODULE_0__.simplex3FromVector)(samplePoint) / Math.pow(this._decay, i);
            totalAmplitude += 1.0 / Math.pow(this._decay, i);
        }
        noiseValue /= totalAmplitude;
        noiseValue = Math.pow(noiseValue, 2);
        if (this._minValue < 1) {
            noiseValue = Math.max(this._minValue, noiseValue) - this._minValue;
            noiseValue /= 1.0 - this._minValue;
        }
        let riverFactor = 0.95;
        noiseValue *= riverFactor;
        noiseValue += 1 - riverFactor;
        return noiseValue;
    }
}


/***/ }),

/***/ "./src/ts/components/forge/layers/filters/craterFilter.ts":
/*!****************************************************************!*\
  !*** ./src/ts/components/forge/layers/filters/craterFilter.ts ***!
  \****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "CraterFilter": () => (/* binding */ CraterFilter)
/* harmony export */ });
/* harmony import */ var _algebra__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../algebra */ "./src/ts/components/forge/algebra.ts");
/* harmony import */ var _filter__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./filter */ "./src/ts/components/forge/layers/filters/filter.ts");


class CraterFilter extends _filter__WEBPACK_IMPORTED_MODULE_1__.Filter {
    constructor(craters) {
        super((p, s) => {
            let elevation = 0;
            for (let crater of craters) {
                let d = _algebra__WEBPACK_IMPORTED_MODULE_0__.Vector3.DistanceSquared(p, _algebra__WEBPACK_IMPORTED_MODULE_0__.Vector3.FromArray(crater.position));
                let radius = crater.radius * s.radiusModifier;
                let steepness = crater.steepness * s.steepnessModifier;
                //console.log(crater.position);
                if (d * 1e100 <= radius ** 2) {
                    //let depth = 10;
                    //let height = depth * (d / ((radius) ** 2)) - depth;
                    //let border = 100 * depth * radius ** 2 * (((Math.sqrt(d) / radius) - 1) ** 2);
                    //let border = 10 * Math.exp(-d * 1000); //- depth / 100;
                    //let plancher = Math.max(height, -depth * 0.3);
                    //elevation += border;
                    //elevation += Math.max(height, plancher);
                    //elevation += Math.min(height, border);
                    //elevation += Math.max(Math.min(height, border), plancher);
                    //let height = Math.min((d / ((radius * steepness) ** 2)) - 0.4, 0.05);
                    //height = Math.max(height, -crater.maxDepth * s.maxDepthModifier) * s.scaleFactor;
                    //elevation += height;
                    //elevation -= 1e3 * 100;
                }
            }
            return elevation;
        });
    }
    setCraters(craters) {
        this.filterFunction = (p, s) => {
            let elevation = 0;
            for (let crater of craters) {
                let d = _algebra__WEBPACK_IMPORTED_MODULE_0__.Vector3.Distance(p, _algebra__WEBPACK_IMPORTED_MODULE_0__.Vector3.FromArray(crater.position));
                let radius = crater.radius * s.radiusModifier;
                let steepness = crater.steepness * s.steepnessModifier;
                if (d <= radius) {
                    /*function smin(a: number, b: number, k: number) {
                        let res = Math.exp(-k * a) + Math.exp(-k * b);
                        return -Math.log(res) / k;
                    }*/
                    let depth = (d / radius) ** (16 * s.steepnessModifier) - 1;
                    elevation += 300 * 1e3 * radius * depth * s.maxDepthModifier;
                }
            }
            return elevation;
        };
    }
}


/***/ }),

/***/ "./src/ts/components/forge/layers/filters/filter.ts":
/*!**********************************************************!*\
  !*** ./src/ts/components/forge/layers/filters/filter.ts ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Filter": () => (/* binding */ Filter)
/* harmony export */ });
class Filter {
    constructor(_filterFunction) {
        this.filterFunction = _filterFunction;
    }
    evaluate(p, s) {
        return this.filterFunction(p, s);
    }
}


/***/ }),

/***/ "./src/ts/components/forge/layers/moutainNoiseLayer.ts":
/*!*************************************************************!*\
  !*** ./src/ts/components/forge/layers/moutainNoiseLayer.ts ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "MountainNoiseLayer": () => (/* binding */ MountainNoiseLayer)
/* harmony export */ });
/* harmony import */ var _engine_noiseTools__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../engine/noiseTools */ "./src/ts/engine/noiseTools.ts");

class MountainNoiseLayer {
    constructor(frequency, nbOctaves, decay, lacunarity, minValue) {
        this._frequency = frequency;
        this._nbOctaves = nbOctaves;
        this._decay = decay;
        this._lacunarity = lacunarity;
        this._minValue = minValue;
    }
    evaluate(coords) {
        let noiseValue = 0.0;
        let totalAmplitude = 0.0;
        for (let i = 0; i < this._nbOctaves; i++) {
            let samplePoint = coords.scaleToNew(this._frequency);
            samplePoint = samplePoint.scaleToNew(Math.pow(this._lacunarity, i));
            noiseValue += (0,_engine_noiseTools__WEBPACK_IMPORTED_MODULE_0__.simplex3FromVector)(samplePoint) / Math.pow(this._decay, i);
            totalAmplitude += 1.0 / Math.pow(this._decay, i);
        }
        noiseValue /= totalAmplitude;
        noiseValue = 1 - Math.abs(noiseValue);
        if (this._minValue < 1) {
            noiseValue = Math.max(this._minValue, noiseValue) - this._minValue;
            noiseValue /= 1.0 - this._minValue;
        }
        return noiseValue;
    }
}


/***/ }),

/***/ "./src/ts/components/forge/layers/simplexNoiseLayer.ts":
/*!*************************************************************!*\
  !*** ./src/ts/components/forge/layers/simplexNoiseLayer.ts ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "SimplexNoiseLayer": () => (/* binding */ SimplexNoiseLayer)
/* harmony export */ });
/* harmony import */ var _engine_noiseTools__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../engine/noiseTools */ "./src/ts/engine/noiseTools.ts");

class SimplexNoiseLayer {
    constructor(frequency, nbOctaves, decay, lacunarity, minValue) {
        this._frequency = frequency;
        this._nbOctaves = nbOctaves;
        this._decay = decay;
        this._lacunarity = lacunarity;
        this._minValue = minValue;
    }
    evaluate(coords) {
        let noiseValue = 0.0;
        let totalAmplitude = 0.0;
        for (let i = 0; i < this._nbOctaves; i++) {
            let samplePoint = coords.scaleToNew(this._frequency);
            samplePoint = samplePoint.scaleToNew(Math.pow(this._lacunarity, i));
            noiseValue += (0,_engine_noiseTools__WEBPACK_IMPORTED_MODULE_0__.normalizedSimplex3FromVector)(samplePoint) / Math.pow(this._decay, i);
            totalAmplitude += 1.0 / Math.pow(this._decay, i);
        }
        noiseValue /= totalAmplitude;
        if (this._minValue != 1) {
            noiseValue = Math.max(this._minValue, noiseValue) - this._minValue;
            noiseValue /= 1.0 - this._minValue;
            //noiseValue += this._minValue;
        }
        return noiseValue;
    }
}


/***/ }),

/***/ "./src/ts/engine/noiseTools.ts":
/*!*************************************!*\
  !*** ./src/ts/engine/noiseTools.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "normalizedSimplex3FromVector": () => (/* binding */ normalizedSimplex3FromVector),
/* harmony export */   "simplex3FromVector": () => (/* binding */ simplex3FromVector)
/* harmony export */ });
/*
 * A speed-improved perlin and simplex noise algorithms for 2D.
 *
 * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 * Converted to Javascript by Joseph Gentle.
 *
 * Version 2012-03-09
 *
 * This code was placed in the public domain by its original author,
 * Stefan Gustavson. You may use it as you see fit, but
 * attribution is appreciated.
 *
 */
class Grad {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    dot2(x, y) {
        return this.x * x + this.y * y;
    }
    dot3(x, y, z) {
        return this.x * x + this.y * y + this.z * z;
    }
}
let grad3 = [
    new Grad(1, 1, 0),
    new Grad(-1, 1, 0),
    new Grad(1, -1, 0),
    new Grad(-1, -1, 0),
    new Grad(1, 0, 1),
    new Grad(-1, 0, 1),
    new Grad(1, 0, -1),
    new Grad(-1, 0, -1),
    new Grad(0, 1, 1),
    new Grad(0, -1, 1),
    new Grad(0, 1, -1),
    new Grad(0, -1, -1),
];
let p = [
    151,
    160,
    137,
    91,
    90,
    15,
    131,
    13,
    201,
    95,
    96,
    53,
    194,
    233,
    7,
    225,
    140,
    36,
    103,
    30,
    69,
    142,
    8,
    99,
    37,
    240,
    21,
    10,
    23,
    190,
    6,
    148,
    247,
    120,
    234,
    75,
    0,
    26,
    197,
    62,
    94,
    252,
    219,
    203,
    117,
    35,
    11,
    32,
    57,
    177,
    33,
    88,
    237,
    149,
    56,
    87,
    174,
    20,
    125,
    136,
    171,
    168,
    68,
    175,
    74,
    165,
    71,
    134,
    139,
    48,
    27,
    166,
    77,
    146,
    158,
    231,
    83,
    111,
    229,
    122,
    60,
    211,
    133,
    230,
    220,
    105,
    92,
    41,
    55,
    46,
    245,
    40,
    244,
    102,
    143,
    54,
    65,
    25,
    63,
    161,
    1,
    216,
    80,
    73,
    209,
    76,
    132,
    187,
    208,
    89,
    18,
    169,
    200,
    196,
    135,
    130,
    116,
    188,
    159,
    86,
    164,
    100,
    109,
    198,
    173,
    186,
    3,
    64,
    52,
    217,
    226,
    250,
    124,
    123,
    5,
    202,
    38,
    147,
    118,
    126,
    255,
    82,
    85,
    212,
    207,
    206,
    59,
    227,
    47,
    16,
    58,
    17,
    182,
    189,
    28,
    42,
    223,
    183,
    170,
    213,
    119,
    248,
    152,
    2,
    44,
    154,
    163,
    70,
    221,
    153,
    101,
    155,
    167,
    43,
    172,
    9,
    129,
    22,
    39,
    253,
    19,
    98,
    108,
    110,
    79,
    113,
    224,
    232,
    178,
    185,
    112,
    104,
    218,
    246,
    97,
    228,
    251,
    34,
    242,
    193,
    238,
    210,
    144,
    12,
    191,
    179,
    162,
    241,
    81,
    51,
    145,
    235,
    249,
    14,
    239,
    107,
    49,
    192,
    214,
    31,
    181,
    199,
    106,
    157,
    184,
    84,
    204,
    176,
    115,
    121,
    50,
    45,
    127,
    4,
    150,
    254,
    138,
    236,
    205,
    93,
    222,
    114,
    67,
    29,
    24,
    72,
    243,
    141,
    128,
    195,
    78,
    66,
    215,
    61,
    156,
    180,
];
// To remove the need for index wrapping, double the permutation table length
let perm = new Array(512);
let gradP = new Array(512);
const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;
const F3 = 1 / 3;
const G3 = 1 / 6;
function seed(seed) {
    if (seed > 0 && seed < 1) {
        // Scale the seed out
        seed *= 65536;
    }
    seed = Math.floor(seed);
    if (seed < 256) {
        seed |= seed << 8;
    }
    for (let i = 0; i < 256; i++) {
        let v;
        if (i & 1) {
            v = p[i] ^ (seed & 255);
        }
        else {
            v = p[i] ^ ((seed >> 8) & 255);
        }
        perm[i] = perm[i + 256] = v;
        gradP[i] = gradP[i + 256] = grad3[v % 12];
    }
}
function simplex2(xin, yin) {
    let n0, n1, n2; // Noise contributions from the three corners
    // Skew the input space to determine which simplex cell we're in
    let s = (xin + yin) * F2; // Hairy factor for 2D
    let i = Math.floor(xin + s);
    let j = Math.floor(yin + s);
    let t = (i + j) * G2;
    let x0 = xin - i + t; // The x,y distances from the cell origin, unskewed.
    let y0 = yin - j + t;
    // For the 2D case, the simplex shape is an equilateral triangle.
    // Determine which simplex we are in.
    let i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
    if (x0 > y0) {
        // lower triangle, XY order: (0,0)->(1,0)->(1,1)
        i1 = 1;
        j1 = 0;
    }
    else {
        // upper triangle, YX order: (0,0)->(0,1)->(1,1)
        i1 = 0;
        j1 = 1;
    }
    // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
    // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
    // c = (3-sqrt(3))/6
    let x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
    let y1 = y0 - j1 + G2;
    let x2 = x0 - 1 + 2 * G2; // Offsets for last corner in (x,y) unskewed coords
    let y2 = y0 - 1 + 2 * G2;
    // Work out the hashed gradient indices of the three simplex corners
    i &= 255;
    j &= 255;
    let gi0 = gradP[i + perm[j]];
    let gi1 = gradP[i + i1 + perm[j + j1]];
    let gi2 = gradP[i + 1 + perm[j + 1]];
    // Calculate the contribution from the three corners
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 < 0) {
        n0 = 0;
    }
    else {
        t0 *= t0;
        n0 = t0 * t0 * gi0.dot2(x0, y0); // (x,y) of grad3 used for 2D gradient
    }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 < 0) {
        n1 = 0;
    }
    else {
        t1 *= t1;
        n1 = t1 * t1 * gi1.dot2(x1, y1);
    }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 < 0) {
        n2 = 0;
    }
    else {
        t2 *= t2;
        n2 = t2 * t2 * gi2.dot2(x2, y2);
    }
    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 70 * (n0 + n1 + n2);
}
/**
 *
 * @param vector
 * @returns simplex between 0 and 1
 */
function normalizedSimplex3FromVector(vector) {
    return (1 + simplex3(vector._x, vector._y, vector._z)) / 2;
}
/**
 *
 * @param vector
 * @returns simplex between -1 and 1
 */
function simplex3FromVector(vector) {
    return simplex3(vector._x, vector._y, vector._z);
}
function simplex3(xin, yin, zin) {
    seed(42);
    let n0, n1, n2, n3; // Noise contributions from the four corners
    // Skew the input space to determine which simplex cell we're in
    let s = (xin + yin + zin) * F3; // Hairy factor for 2D
    let i = Math.floor(xin + s);
    let j = Math.floor(yin + s);
    let k = Math.floor(zin + s);
    let t = (i + j + k) * G3;
    let x0 = xin - i + t; // The x,y distances from the cell origin, unskewed.
    let y0 = yin - j + t;
    let z0 = zin - k + t;
    // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
    // Determine which simplex we are in.
    let i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
    let i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
    if (x0 >= y0) {
        if (y0 >= z0) {
            i1 = 1;
            j1 = 0;
            k1 = 0;
            i2 = 1;
            j2 = 1;
            k2 = 0;
        }
        else if (x0 >= z0) {
            i1 = 1;
            j1 = 0;
            k1 = 0;
            i2 = 1;
            j2 = 0;
            k2 = 1;
        }
        else {
            i1 = 0;
            j1 = 0;
            k1 = 1;
            i2 = 1;
            j2 = 0;
            k2 = 1;
        }
    }
    else {
        if (y0 < z0) {
            i1 = 0;
            j1 = 0;
            k1 = 1;
            i2 = 0;
            j2 = 1;
            k2 = 1;
        }
        else if (x0 < z0) {
            i1 = 0;
            j1 = 1;
            k1 = 0;
            i2 = 0;
            j2 = 1;
            k2 = 1;
        }
        else {
            i1 = 0;
            j1 = 1;
            k1 = 0;
            i2 = 1;
            j2 = 1;
            k2 = 0;
        }
    }
    // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
    // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
    // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
    // c = 1/6.
    let x1 = x0 - i1 + G3; // Offsets for second corner
    let y1 = y0 - j1 + G3;
    let z1 = z0 - k1 + G3;
    let x2 = x0 - i2 + 2 * G3; // Offsets for third corner
    let y2 = y0 - j2 + 2 * G3;
    let z2 = z0 - k2 + 2 * G3;
    let x3 = x0 - 1 + 3 * G3; // Offsets for fourth corner
    let y3 = y0 - 1 + 3 * G3;
    let z3 = z0 - 1 + 3 * G3;
    // Work out the hashed gradient indices of the four simplex corners
    i &= 255;
    j &= 255;
    k &= 255;
    let gi0 = gradP[i + perm[j + perm[k]]];
    let gi1 = gradP[i + i1 + perm[j + j1 + perm[k + k1]]];
    let gi2 = gradP[i + i2 + perm[j + j2 + perm[k + k2]]];
    let gi3 = gradP[i + 1 + perm[j + 1 + perm[k + 1]]];
    // Calculate the contribution from the four corners
    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 < 0) {
        n0 = 0;
    }
    else {
        t0 *= t0;
        n0 = t0 * t0 * gi0.dot3(x0, y0, z0); // (x,y) of grad3 used for 2D gradient
    }
    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 < 0) {
        n1 = 0;
    }
    else {
        t1 *= t1;
        n1 = t1 * t1 * gi1.dot3(x1, y1, z1);
    }
    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 < 0) {
        n2 = 0;
    }
    else {
        t2 *= t2;
        n2 = t2 * t2 * gi2.dot3(x2, y2, z2);
    }
    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 < 0) {
        n3 = 0;
    }
    else {
        t3 *= t3;
        n3 = t3 * t3 * gi3.dot3(x3, y3, z3);
    }
    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 32 * (n0 + n1 + n2 + n3);
}
function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
}
function lerp(a, b, t) {
    return (1 - t) * a + t * b;
}


/***/ })

}]);
//# sourceMappingURL=src_ts_components_forge_builder_worker_ts.js.map