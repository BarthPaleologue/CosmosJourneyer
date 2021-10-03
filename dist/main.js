/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/ts/components/forge/chunkForge.ts":
/*!***********************************************!*\
  !*** ./src/ts/components/forge/chunkForge.ts ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "TaskType": () => (/* binding */ TaskType),
/* harmony export */   "ChunkForge": () => (/* binding */ ChunkForge)
/* harmony export */ });
var TaskType;
(function (TaskType) {
    TaskType[TaskType["Deletion"] = 0] = "Deletion";
    TaskType[TaskType["Build"] = 1] = "Build";
    TaskType[TaskType["Apply"] = 2] = "Apply";
    TaskType[TaskType["Init"] = 3] = "Init";
})(TaskType || (TaskType = {}));
class ChunkForge {
    constructor(_subdivisions, _depthRenderer, _scene) {
        // What you need to generate a beautiful terrain (à étendre pour ne pas tout hardcode dans le worker)
        this.craters = [];
        this.incomingTasks = [];
        this.trashCan = [];
        this.applyTasks = [];
        this.cadence = 6;
        this.builders = [];
        this.esclavesDispo = [];
        this.subdivisions = _subdivisions;
        for (let i = 0; i < this.cadence; i++) {
            let builder = new Worker(new URL(/* worker import */ __webpack_require__.p + __webpack_require__.u(1), __webpack_require__.b));
            this.builders.push(builder);
            this.esclavesDispo.push(builder);
        }
        this.depthRenderer = _depthRenderer;
        this.scene = _scene;
    }
    addTask(task) {
        this.incomingTasks.push(task);
    }
    executeTask(task) {
        switch (task.taskType) {
            case TaskType.Build:
                let mesh = task.mesh;
                let esclave = this.esclavesDispo.shift();
                // les tâches sont ajoutées de sorte que les tâches de créations sont suivies de leurs
                // tâches de supressions associées : on les stock et on les execute après les créations
                let callbackTasks = [];
                while (this.incomingTasks.length > 0 && this.incomingTasks[0].taskType == TaskType.Deletion) {
                    //@ts-ignore
                    callbackTasks.push(this.incomingTasks.shift());
                }
                esclave?.postMessage({
                    taskType: "buildTask",
                    chunkLength: task.chunkLength,
                    subdivisions: this.subdivisions,
                    depth: task.depth,
                    direction: task.direction,
                    position: [task.position.x, task.position.y, task.position.z],
                    craters: task.planet.craters,
                    noiseModifiers: task.planet.noiseModifiers,
                    craterModifiers: task.planet.craterModifiers,
                });
                const worker = new Worker(new URL(/* worker import */ __webpack_require__.p + __webpack_require__.u(0), __webpack_require__.b));
                esclave.onmessage = e => {
                    let vertexData = new BABYLON.VertexData();
                    vertexData.positions = Array.from(e.data.p);
                    vertexData.indices = Array.from(e.data.i);
                    vertexData.normals = Array.from(e.data.n);
                    this.applyTasks.push({
                        id: task.id,
                        taskType: TaskType.Apply,
                        mesh: mesh,
                        vertexData: vertexData,
                        callbackTasks: callbackTasks,
                    });
                    this.esclavesDispo.push(esclave);
                };
                break;
            case TaskType.Deletion:
                // une tâche de suppression solitaire ne devrait pas exister
                console.warn("Tâche de supression solitaire détectée");
                this.trashCan.push(task);
                break;
            default:
                console.warn("Tache illegale");
                this.executeNextTask();
        }
    }
    executeNextTask() {
        if (this.incomingTasks.length > 0) {
            this.executeTask(this.incomingTasks.shift());
        }
    }
    emptyTrashCan(n) {
        for (let i = 0; i < n; i++) {
            if (this.trashCan.length > 0) {
                let task = this.trashCan.shift();
                task.mesh.dispose();
            }
        }
    }
    executeNextApplyTask() {
        if (this.applyTasks.length > 0) {
            let task = this.applyTasks.shift();
            task.vertexData.applyToMesh(task.mesh);
            this.depthRenderer.getDepthMap().renderList?.push(task.mesh);
            setTimeout(() => {
                this.trashCan = this.trashCan.concat(task.callbackTasks);
            }, 100);
        }
    }
    update() {
        for (let esclave of this.esclavesDispo) {
            this.executeNextTask();
        }
        this.executeNextApplyTask();
        this.emptyTrashCan(10);
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

/***/ "./src/ts/components/forge/planetChunk.ts":
/*!************************************************!*\
  !*** ./src/ts/components/forge/planetChunk.ts ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getChunkPlaneSpacePositionFromPath": () => (/* binding */ getChunkPlaneSpacePositionFromPath),
/* harmony export */   "getChunkSphereSpacePositionFromPath": () => (/* binding */ getChunkSphereSpacePositionFromPath),
/* harmony export */   "PlanetChunk": () => (/* binding */ PlanetChunk)
/* harmony export */ });
/* harmony import */ var _chunkForge__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./chunkForge */ "./src/ts/components/forge/chunkForge.ts");
/* harmony import */ var _direction__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./direction */ "./src/ts/components/forge/direction.ts");


/**
 * Returns the chunk position in plane space
 * @param chunkLength the length of a chunk
 * @param path the path of the chunk
 * @returns the plane coordinates of the chunk
 */
function getChunkPlaneSpacePositionFromPath(chunkLength, path) {
    let [x, y] = [0, 0];
    for (let i = 0; i < path.length; i++) {
        /*
            3   2
              +
            0   1
        */
        // i have no idea why i divide by four but it works heh
        switch (path[i]) {
            case 0:
                x -= chunkLength / 4 / (2 ** i);
                y -= chunkLength / 4 / (2 ** i);
                break;
            case 1:
                x += chunkLength / 4 / (2 ** i);
                y -= chunkLength / 4 / (2 ** i);
                break;
            case 2:
                x += chunkLength / 4 / (2 ** i);
                y += chunkLength / 4 / (2 ** i);
                break;
            case 3:
                x -= chunkLength / 4 / (2 ** i);
                y += chunkLength / 4 / (2 ** i);
                break;
        }
    }
    return new BABYLON.Vector3(x, y, 0);
}
/**
 * Returns chunk position in sphere space (doesn't account for rotation of the planet yet tho)
 * @param chunkLength the length of the chunk
 * @param path the path to the chunk in the quadtree
 * @param direction direction of the parent plane
 * @returns the position in sphere space (no planet rotation)
 */
function getChunkSphereSpacePositionFromPath(chunkLength, path, direction) {
    let position = getChunkPlaneSpacePositionFromPath(chunkLength, path);
    position.addInPlace(new BABYLON.Vector3(0, 0, -chunkLength / 2));
    position = position.normalizeToNew().scale(chunkLength / 2);
    let rotation = BABYLON.Matrix.Identity();
    switch (direction) {
        case _direction__WEBPACK_IMPORTED_MODULE_1__.Direction.Up:
            rotation = BABYLON.Matrix.RotationX(Math.PI / 2);
            break;
        case _direction__WEBPACK_IMPORTED_MODULE_1__.Direction.Down:
            rotation = BABYLON.Matrix.RotationX(-Math.PI / 2);
            break;
        case _direction__WEBPACK_IMPORTED_MODULE_1__.Direction.Forward:
            rotation = BABYLON.Matrix.Identity();
            break;
        case _direction__WEBPACK_IMPORTED_MODULE_1__.Direction.Backward:
            rotation = BABYLON.Matrix.RotationY(Math.PI);
            break;
        case _direction__WEBPACK_IMPORTED_MODULE_1__.Direction.Left:
            rotation = BABYLON.Matrix.RotationY(-Math.PI / 2);
            break;
        case _direction__WEBPACK_IMPORTED_MODULE_1__.Direction.Right:
            rotation = BABYLON.Matrix.RotationY(Math.PI / 2);
            break;
    }
    return BABYLON.Vector3.TransformCoordinates(position, rotation);
}
class PlanetChunk {
    constructor(_path, _chunkLength, _direction, _parentNode, scene, chunkForge, surfaceMaterial, planet) {
        // coordonnées sur le plan
        this.x = 0;
        this.y = 0;
        this.id = `[D${_direction}][P${_path.join("")}]`;
        this.path = _path;
        this.chunkLength = _chunkLength;
        this.baseSubdivisions = chunkForge.subdivisions;
        this.depth = this.path.length;
        this.direction = _direction;
        this.parentNode = _parentNode;
        this.position = getChunkPlaneSpacePositionFromPath(this.chunkLength, this.path);
        this.position.addInPlace(new BABYLON.Vector3(0, 0, -this.chunkLength / 2));
        this.mesh = new BABYLON.Mesh(`Chunk${this.id}`, scene);
        this.mesh.material = surfaceMaterial;
        //this.mesh.material.wireframe = true;
        this.mesh.parent = this.parentNode;
        chunkForge.addTask({
            taskType: _chunkForge__WEBPACK_IMPORTED_MODULE_0__.TaskType.Build,
            id: this.id,
            planet: planet,
            position: this.position,
            chunkLength: this.chunkLength,
            depth: this.depth,
            direction: this.direction,
            mesh: this.mesh,
        });
        this.position = this.position.normalizeToNew().scale(this.chunkLength / 2);
        let rotation = BABYLON.Matrix.Identity();
        switch (this.direction) {
            case _direction__WEBPACK_IMPORTED_MODULE_1__.Direction.Up:
                rotation = BABYLON.Matrix.RotationX(Math.PI / 2);
                break;
            case _direction__WEBPACK_IMPORTED_MODULE_1__.Direction.Down:
                rotation = BABYLON.Matrix.RotationX(-Math.PI / 2);
                break;
            case _direction__WEBPACK_IMPORTED_MODULE_1__.Direction.Forward:
                rotation = BABYLON.Matrix.Identity();
                break;
            case _direction__WEBPACK_IMPORTED_MODULE_1__.Direction.Backward:
                rotation = BABYLON.Matrix.RotationY(Math.PI);
                break;
            case _direction__WEBPACK_IMPORTED_MODULE_1__.Direction.Left:
                rotation = BABYLON.Matrix.RotationY(-Math.PI / 2);
                break;
            case _direction__WEBPACK_IMPORTED_MODULE_1__.Direction.Right:
                rotation = BABYLON.Matrix.RotationY(Math.PI / 2);
                break;
        }
        this.position = BABYLON.Vector3.TransformCoordinates(this.position, rotation);
        //console.log(surfaceMaterial);
        //this.mesh.material = surfaceMaterial;
    }
}


/***/ }),

/***/ "./src/ts/components/forge/planetSide.ts":
/*!***********************************************!*\
  !*** ./src/ts/components/forge/planetSide.ts ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "PlanetSide": () => (/* binding */ PlanetSide)
/* harmony export */ });
/* harmony import */ var _planetChunk__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./planetChunk */ "./src/ts/components/forge/planetChunk.ts");
/* harmony import */ var _chunkForge__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./chunkForge */ "./src/ts/components/forge/chunkForge.ts");


/**
 * Un PlanetSide est un plan généré procéduralement qui peut être morph à volonté
 */
class PlanetSide {
    /**
     *
     * @param _id
     * @param _minDepth
     * @param _maxDepth
     * @param _chunkLength
     * @param _direction
     * @param _parentNode
     * @param _scene
     * @param _chunkForge
     * @param _surfaceMaterial
     * @param _planet
     */
    constructor(_id, _minDepth, _maxDepth, _chunkLength, _direction, _parentNode, _scene, _chunkForge, _surfaceMaterial, _planet) {
        this.renderDistanceFactor = 3;
        this.id = _id;
        this.maxDepth = _maxDepth;
        this.minDepth = _minDepth;
        this.chunkLength = _chunkLength;
        this.baseSubdivisions = _chunkForge.subdivisions;
        this.direction = _direction;
        this.parent = _parentNode;
        this.scene = _scene;
        this.chunkForge = _chunkForge;
        this.surfaceMaterial = _surfaceMaterial;
        this.planet = _planet;
        // on initialise le plan avec un unique chunk
        this.tree = this.createChunk([]);
    }
    /**
     * Function used to execute code on every chunk of the quadtree
     * @param tree the tree to explore
     * @param f the function to apply on every chunk
     */
    executeOnEveryChunk(f, tree = this.tree) {
        if (tree instanceof _planetChunk__WEBPACK_IMPORTED_MODULE_0__.PlanetChunk) {
            f(tree);
        }
        else {
            for (let stem of tree)
                this.executeOnEveryChunk(f, stem);
        }
    }
    /**
     * Send deletion request to chunkforge regarding the chunks of a branch
     * @param tree The tree to delete
     */
    requestDeletion(tree) {
        this.executeOnEveryChunk((chunk) => {
            this.chunkForge.addTask({
                taskType: _chunkForge__WEBPACK_IMPORTED_MODULE_1__.TaskType.Deletion,
                id: chunk.id,
                mesh: chunk.mesh,
            });
        }, tree);
    }
    /**
     * Update LOD of terrain relative to the observerPosition
     * @param observerPosition The observer position
     */
    updateLOD(observerPosition, facingDirection) {
        this.tree = this.updateLODRecursively(observerPosition, facingDirection);
    }
    /**
     * Recursive function used internaly to update LOD
     * @param observerPosition The observer position
     * @param tree The tree to update recursively
     * @param walked The position of the current root relative to the absolute root
     * @returns The updated tree
     */
    updateLODRecursively(observerPosition, facingDirection, tree = this.tree, walked = []) {
        // position du noeud du quadtree par rapport à la sphère 
        let relativePosition = (0,_planetChunk__WEBPACK_IMPORTED_MODULE_0__.getChunkSphereSpacePositionFromPath)(this.chunkLength, walked, this.direction);
        relativePosition = BABYLON.Vector3.TransformCoordinates(relativePosition, BABYLON.Matrix.RotationX(this.parent.rotation.x));
        relativePosition = BABYLON.Vector3.TransformCoordinates(relativePosition, BABYLON.Matrix.RotationY(this.parent.rotation.y));
        relativePosition = BABYLON.Vector3.TransformCoordinates(relativePosition, BABYLON.Matrix.RotationZ(this.parent.rotation.z));
        // position par rapport à la caméra
        let absolutePosition = relativePosition.add(this.parent.absolutePosition);
        let direction = absolutePosition.subtract(observerPosition);
        let dot = BABYLON.Vector3.Dot(direction, facingDirection);
        // distance carré entre caméra et noeud du quadtree
        let d = direction.lengthSquared();
        let limit = this.renderDistanceFactor * (this.chunkLength / (2 ** walked.length));
        if ((d < limit ** 2 && walked.length < this.maxDepth) || walked.length < this.minDepth) {
            // si on est proche de la caméra ou si on doit le générer car LOD minimal
            if (tree instanceof _planetChunk__WEBPACK_IMPORTED_MODULE_0__.PlanetChunk) {
                // si c'est un chunk, on le subdivise
                let newTree = [
                    this.createChunk(walked.concat([0])),
                    this.createChunk(walked.concat([1])),
                    this.createChunk(walked.concat([2])),
                    this.createChunk(walked.concat([3])),
                ];
                this.requestDeletion(tree);
                return newTree;
            }
            else {
                // si c'en est pas un, on continue
                return [
                    this.updateLODRecursively(observerPosition, facingDirection, tree[0], walked.concat([0])),
                    this.updateLODRecursively(observerPosition, facingDirection, tree[1], walked.concat([1])),
                    this.updateLODRecursively(observerPosition, facingDirection, tree[2], walked.concat([2])),
                    this.updateLODRecursively(observerPosition, facingDirection, tree[3], walked.concat([3])),
                ];
            }
        }
        else {
            // si on est loin
            if (tree instanceof _planetChunk__WEBPACK_IMPORTED_MODULE_0__.PlanetChunk) {
                //let camera = this.scene.activeCamera?.position;
                let distanceToCenter = BABYLON.Vector3.DistanceSquared(observerPosition, this.parent.absolutePosition);
                // c'est pythagore
                let behindHorizon = (d > distanceToCenter + (this.chunkLength / 2) ** 2);
                //tree.mesh.setEnabled(!behindHorizon);
                return tree;
            }
            else {
                // si c'est un noeud, on supprime tous les enfants, on remplace par un nouveau chunk
                if (walked.length > this.minDepth) {
                    let newChunk = this.createChunk(walked);
                    this.requestDeletion(tree);
                    return newChunk;
                }
                else {
                    return tree;
                }
            }
        }
    }
    /**
     * Create new chunk of terrain at the specified location
     * @param path The path leading to the location where to add the new chunk
     * @returns The new Chunk
     */
    createChunk(path) {
        return new _planetChunk__WEBPACK_IMPORTED_MODULE_0__.PlanetChunk(path, this.chunkLength, this.direction, this.parent, this.scene, this.chunkForge, this.surfaceMaterial, this.planet);
    }
    setChunkMaterial(material) {
        this.surfaceMaterial = material;
    }
    /**
     * Regenerate planet chunks
     */
    reset() {
        let newTree = this.createChunk([]);
        this.requestDeletion(this.tree);
        this.tree = newTree;
    }
}


/***/ }),

/***/ "./src/ts/components/planet.ts":
/*!*************************************!*\
  !*** ./src/ts/components/planet.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Planet": () => (/* binding */ Planet)
/* harmony export */ });
/* harmony import */ var _forge_planetSide__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./forge/planetSide */ "./src/ts/components/forge/planetSide.ts");
/* harmony import */ var _forge_direction__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./forge/direction */ "./src/ts/components/forge/direction.ts");
/* harmony import */ var _asset_textures_crackednormal_jpg__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../asset/textures/crackednormal.jpg */ "./src/asset/textures/crackednormal.jpg");
/* harmony import */ var _asset_textures_rockn_png__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../asset/textures/rockn.png */ "./src/asset/textures/rockn.png");
/* harmony import */ var _asset_textures_grassn_png__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../asset/textures/grassn.png */ "./src/asset/textures/grassn.png");
/* harmony import */ var _asset_textures_snowNormalMap_jpg__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../asset/textures/snowNormalMap.jpg */ "./src/asset/textures/snowNormalMap.jpg");
/* harmony import */ var _asset_textures_sandNormalMap_jpg__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../asset/textures/sandNormalMap.jpg */ "./src/asset/textures/sandNormalMap.jpg");


//texture import





class Planet {
    constructor(_id, _radius, _position, _nbSubdivisions, _minDepth, _maxDepth, _forge, _scene) {
        this.sides = new Array(6); // stores the 6 sides of the sphere
        this.id = _id;
        this.radius = _radius;
        this.chunkLength = this.radius * 2;
        this.attachNode = BABYLON.Mesh.CreateBox(`${this.id}AttachNode`, 1, _scene);
        this.attachNode.position = _position;
        this.surfaceMaterial = new BABYLON.ShaderMaterial(`${this.id}BaseMaterial`, _scene, "");
        this.chunkForge = _forge;
        this.sides = [
            new _forge_planetSide__WEBPACK_IMPORTED_MODULE_0__.PlanetSide(`${this.id}UpSide`, _minDepth, _maxDepth, this.chunkLength, _forge_direction__WEBPACK_IMPORTED_MODULE_1__.Direction.Up, this.attachNode, _scene, this.chunkForge, this.surfaceMaterial, this),
            new _forge_planetSide__WEBPACK_IMPORTED_MODULE_0__.PlanetSide(`${this.id}DownSide`, _minDepth, _maxDepth, this.chunkLength, _forge_direction__WEBPACK_IMPORTED_MODULE_1__.Direction.Down, this.attachNode, _scene, this.chunkForge, this.surfaceMaterial, this),
            new _forge_planetSide__WEBPACK_IMPORTED_MODULE_0__.PlanetSide(`${this.id}ForwardSide`, _minDepth, _maxDepth, this.chunkLength, _forge_direction__WEBPACK_IMPORTED_MODULE_1__.Direction.Forward, this.attachNode, _scene, this.chunkForge, this.surfaceMaterial, this),
            new _forge_planetSide__WEBPACK_IMPORTED_MODULE_0__.PlanetSide(`${this.id}BackwardSide`, _minDepth, _maxDepth, this.chunkLength, _forge_direction__WEBPACK_IMPORTED_MODULE_1__.Direction.Backward, this.attachNode, _scene, this.chunkForge, this.surfaceMaterial, this),
            new _forge_planetSide__WEBPACK_IMPORTED_MODULE_0__.PlanetSide(`${this.id}RightSide`, _minDepth, _maxDepth, this.chunkLength, _forge_direction__WEBPACK_IMPORTED_MODULE_1__.Direction.Right, this.attachNode, _scene, this.chunkForge, this.surfaceMaterial, this),
            new _forge_planetSide__WEBPACK_IMPORTED_MODULE_0__.PlanetSide(`${this.id}LeftSide`, _minDepth, _maxDepth, this.chunkLength, _forge_direction__WEBPACK_IMPORTED_MODULE_1__.Direction.Left, this.attachNode, _scene, this.chunkForge, this.surfaceMaterial, this),
        ];
        let nbCraters = 800;
        let craterRadiusFactor = 1;
        let craterSteepnessFactor = 1;
        let craterMaxDepthFactor = 1;
        this.noiseModifiers = {
            amplitudeModifier: 1,
            frequencyModifier: 1,
            offsetModifier: [0, 0, 0],
            minValueModifier: 1,
            archipelagoFactor: 0.5,
        };
        this.craterModifiers = {
            radiusModifier: 1,
            steepnessModifier: 1,
            maxDepthModifier: 1,
            scaleFactor: 1,
        };
        this.colorSettings = {
            snowColor: new BABYLON.Vector3(1, 1, 1),
            steepColor: new BABYLON.Vector3(0.2, 0.2, 0.2),
            plainColor: new BABYLON.Vector3(0.5, 0.3, 0.08),
            sandColor: new BABYLON.Vector3(0.7, 0.7, 0),
            waterLevel: 0.32,
            sandSize: 1,
            steepSharpness: 1
        };
        this.craters = this.generateCraters(nbCraters, craterRadiusFactor, craterSteepnessFactor, craterMaxDepthFactor);
        let surfaceMaterial = new BABYLON.ShaderMaterial("surfaceColor", _scene, "./shaders/surfaceColor", {
            attributes: ["position", "normal", "uv"],
            uniforms: [
                "world", "worldViewProjection", "projection", "view",
                "textureSampler", "depthSampler",
                "bottomNormalMap", "plainNormalMap", "sandNormalMap", "snowNormalMap", "steepNormalMap",
                "cameraNear", "cameraFar", "planetPosition", "planetRadius",
                "waterLevel", "sandSize", "steepSharpness",
                "snowColor", "steepColor", "plainColor", "sandColor"
            ]
        });
        surfaceMaterial.setTexture("bottomNormalMap", new BABYLON.Texture(_asset_textures_crackednormal_jpg__WEBPACK_IMPORTED_MODULE_2__, _scene));
        surfaceMaterial.setTexture("steepNormalMap", new BABYLON.Texture(_asset_textures_rockn_png__WEBPACK_IMPORTED_MODULE_3__, _scene));
        surfaceMaterial.setTexture("plainNormalMap", new BABYLON.Texture(_asset_textures_grassn_png__WEBPACK_IMPORTED_MODULE_4__, _scene));
        surfaceMaterial.setTexture("snowNormalMap", new BABYLON.Texture(_asset_textures_snowNormalMap_jpg__WEBPACK_IMPORTED_MODULE_5__, _scene));
        surfaceMaterial.setTexture("sandNormalMap", new BABYLON.Texture(_asset_textures_sandNormalMap_jpg__WEBPACK_IMPORTED_MODULE_6__, _scene));
        surfaceMaterial.setVector3("v3CameraPos", BABYLON.Vector3.Zero());
        surfaceMaterial.setVector3("v3LightPos", BABYLON.Vector3.Zero());
        surfaceMaterial.setVector3("planetPosition", this.attachNode.absolutePosition);
        surfaceMaterial.setFloat("planetRadius", this.radius);
        this.setChunkMaterial(surfaceMaterial);
        this.updateColors();
    }
    /**
     * Sets the material used on the chunks
     * @param material
     */
    setChunkMaterial(material) {
        this.surfaceMaterial = material;
        for (let side of this.sides) {
            side.setChunkMaterial(material);
        }
    }
    /**
     * Update terrain of the sphere relative to the observer position
     * @param position the observer position
     */
    updateLOD(position, facingDirection) {
        for (let side of this.sides) {
            side.updateLOD(position, facingDirection);
        }
    }
    setRenderDistanceFactor(renderDistanceFactor) {
        for (let side of this.sides) {
            side.renderDistanceFactor = renderDistanceFactor;
        }
    }
    /**
     * Changes the maximum depth of the quadtrees
     * @param maxDepth the new maximum depth of the quadtrees
     */
    setMaxDepth(maxDepth) {
        for (let side of this.sides) {
            side.maxDepth = maxDepth;
        }
    }
    /**
     * Changes the minimum depth of the quadtrees
     * @param minDepth the new minimum depth of the quadtrees
     */
    setMinDepth(minDepth) {
        for (let side of this.sides) {
            side.minDepth = minDepth;
        }
    }
    /**
     * Regenerates the chunks
     */
    reset() {
        for (let side of this.sides) {
            side.reset();
        }
    }
    updateColors() {
        this.surfaceMaterial.setFloat("planetRadius", this.radius);
        this.surfaceMaterial.setFloat("waterLevel", this.colorSettings.waterLevel);
        this.surfaceMaterial.setFloat("sandSize", this.colorSettings.sandSize);
        this.surfaceMaterial.setFloat("steepSharpness", this.colorSettings.steepSharpness);
        this.surfaceMaterial.setVector3("snowColor", this.colorSettings.snowColor);
        this.surfaceMaterial.setVector3("steepColor", this.colorSettings.steepColor);
        this.surfaceMaterial.setVector3("plainColor", this.colorSettings.plainColor);
        this.surfaceMaterial.setVector3("sandColor", this.colorSettings.sandColor);
    }
    update(position, facingDirection, lightPosition, camera) {
        this.surfaceMaterial.setVector3("v3CameraPos", position);
        this.surfaceMaterial.setVector3("v3LightPos", lightPosition);
        this.updateLOD(position, facingDirection);
    }
    generateCraters(n, radiusModifier, _steepness, _maxDepth) {
        let craters = [];
        for (let i = 0; i < n; i++) {
            let r = radiusModifier * 0.1 * (Math.random() ** 16);
            // random spherical coordinates
            let phi = Math.random() * Math.PI * 2;
            let theta = Math.random() * Math.PI;
            let position = [Math.cos(theta) * Math.sin(phi), Math.sin(theta) * Math.sin(phi), Math.cos(phi)];
            let maxDepth = _maxDepth * (0.2 + (Math.random()) / 10);
            let steepness = _steepness * (1 + (Math.random()) / 10) / (r / 2);
            craters.push({ radius: r, position: position, maxDepth: maxDepth, steepness: steepness });
        }
        return craters;
    }
}


/***/ }),

/***/ "./src/ts/postProcesses/atmosphericScatteringPostProcess.ts":
/*!******************************************************************!*\
  !*** ./src/ts/postProcesses/atmosphericScatteringPostProcess.ts ***!
  \******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AtmosphericScatteringPostProcess": () => (/* binding */ AtmosphericScatteringPostProcess)
/* harmony export */ });
class AtmosphericScatteringPostProcess extends BABYLON.PostProcess {
    constructor(name, planet, planetRadius, atmosphereRadius, sun, camera, scene) {
        super(name, "./shaders/simplifiedScattering", [
            "sunPosition",
            "cameraPosition",
            "projection",
            "view",
            "transform",
            "cameraNear",
            "cameraFar",
            "cameraDirection",
            "planetPosition",
            "planetRadius",
            "atmosphereRadius",
            "falloffFactor",
            "sunIntensity",
            "scatteringStrength",
            "densityModifier",
            "redWaveLength",
            "greenWaveLength",
            "blueWaveLength"
        ], [
            "textureSampler",
            "depthSampler",
        ], 1, scene.activeCamera, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);
        this.settings = {
            planetRadius: planetRadius,
            atmosphereRadius: atmosphereRadius,
            falloffFactor: 15,
            intensity: 15,
            scatteringStrength: 1,
            densityModifier: 1,
            redWaveLength: 700,
            greenWaveLength: 530,
            blueWaveLength: 440,
        };
        this.camera = camera;
        this.sun = sun;
        this.planet = planet;
        this.setCamera(this.camera);
        //let depthMap = depthRenderer.getDepthMap();
        this.onApply = (effect) => {
            effect.setTexture("depthSampler", scene.customRenderTargets[0]);
            effect.setVector3("sunPosition", this.sun.getAbsolutePosition());
            effect.setVector3("cameraPosition", this.camera.position);
            effect.setVector3("planetPosition", this.planet.getAbsolutePosition());
            effect.setMatrix("projection", this.camera.getProjectionMatrix());
            effect.setMatrix("view", this.camera.getViewMatrix());
            effect.setMatrix("transform", this.camera.getTransformationMatrix());
            effect.setFloat("cameraNear", camera.minZ);
            effect.setFloat("cameraFar", camera.maxZ);
            effect.setVector3("cameraDirection", camera.getDirection(BABYLON.Axis.Z));
            effect.setFloat("planetRadius", this.settings.planetRadius);
            effect.setFloat("atmosphereRadius", this.settings.atmosphereRadius);
            effect.setFloat("falloffFactor", this.settings.falloffFactor);
            effect.setFloat("sunIntensity", this.settings.intensity);
            effect.setFloat("scatteringStrength", this.settings.scatteringStrength);
            effect.setFloat("densityModifier", this.settings.densityModifier);
            effect.setFloat("redWaveLength", this.settings.redWaveLength);
            effect.setFloat("greenWaveLength", this.settings.greenWaveLength);
            effect.setFloat("blueWaveLength", this.settings.blueWaveLength);
        };
    }
    setCamera(camera) {
        this.camera.detachPostProcess(this);
        this.camera = camera;
        camera.attachPostProcess(this);
    }
}


/***/ }),

/***/ "./src/ts/postProcesses/oceanPostProcess.ts":
/*!**************************************************!*\
  !*** ./src/ts/postProcesses/oceanPostProcess.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "OceanPostProcess": () => (/* binding */ OceanPostProcess)
/* harmony export */ });
/* harmony import */ var _asset_textures_waterbump_png__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../asset/textures/waterbump.png */ "./src/asset/textures/waterbump.png");

class OceanPostProcess extends BABYLON.PostProcess {
    constructor(name, planet, oceanRadius, sun, camera, scene) {
        super(name, "./shaders/ocean", [
            "sunPosition",
            "cameraPosition",
            "projection",
            "view",
            "transform",
            "cameraNear",
            "cameraFar",
            "cameraDirection",
            "planetPosition",
            "planetRadius",
            "oceanRadius",
            "smoothness",
            "specularPower",
            "alphaModifier",
            "depthModifier"
        ], [
            "textureSampler",
            "depthSampler",
            "normalMap"
        ], 1, camera, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);
        this.settings = {
            oceanRadius: oceanRadius,
            depthModifier: 1.0,
            alphaModifier: 0.1,
            specularPower: 2,
            smoothness: 0.9,
        };
        this.camera = camera;
        this.sun = sun;
        this.planet = planet;
        this.setCamera(this.camera);
        let depthRenderer = new BABYLON.DepthRenderer(scene);
        scene.customRenderTargets.push(depthRenderer.getDepthMap());
        let depthMap = scene.customRenderTargets[0];
        //this.getEffect().setTexture("normalMap", new BABYLON.Texture("./textures/waternormal.jpg", scene));
        this.onApply = (effect) => {
            effect.setTexture("depthSampler", depthMap);
            effect.setTexture("normalMap", new BABYLON.Texture(_asset_textures_waterbump_png__WEBPACK_IMPORTED_MODULE_0__, scene));
            effect.setVector3("sunPosition", this.sun.getAbsolutePosition());
            effect.setVector3("cameraPosition", this.camera.position);
            effect.setVector3("planetPosition", this.planet.absolutePosition);
            effect.setMatrix("projection", this.camera.getProjectionMatrix());
            effect.setMatrix("view", this.camera.getViewMatrix());
            effect.setMatrix("transform", this.camera.getTransformationMatrix());
            effect.setFloat("cameraNear", camera.minZ);
            effect.setFloat("cameraFar", camera.maxZ);
            effect.setVector3("cameraDirection", camera.getDirection(BABYLON.Axis.Z));
            effect.setFloat("oceanRadius", this.settings.oceanRadius);
            effect.setFloat("smoothness", this.settings.smoothness);
            effect.setFloat("specularPower", this.settings.specularPower);
            effect.setFloat("alphaModifier", this.settings.alphaModifier);
            effect.setFloat("depthModifier", this.settings.depthModifier);
        };
    }
    setCamera(camera) {
        this.camera.detachPostProcess(this);
        this.camera = camera;
        camera.attachPostProcess(this);
    }
}


/***/ }),

/***/ "./src/asset/textures/crackednormal.jpg":
/*!**********************************************!*\
  !*** ./src/asset/textures/crackednormal.jpg ***!
  \**********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "a55399e65cc7f7ecbdd2.jpg";

/***/ }),

/***/ "./src/asset/textures/grassn.png":
/*!***************************************!*\
  !*** ./src/asset/textures/grassn.png ***!
  \***************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "a79e1412d099e475f6c1.png";

/***/ }),

/***/ "./src/asset/textures/rockn.png":
/*!**************************************!*\
  !*** ./src/asset/textures/rockn.png ***!
  \**************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "55098a45d921c50f7f16.png";

/***/ }),

/***/ "./src/asset/textures/sandNormalMap.jpg":
/*!**********************************************!*\
  !*** ./src/asset/textures/sandNormalMap.jpg ***!
  \**********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "81b4e6bbb1017d894061.jpg";

/***/ }),

/***/ "./src/asset/textures/snowNormalMap.jpg":
/*!**********************************************!*\
  !*** ./src/asset/textures/snowNormalMap.jpg ***!
  \**********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "f341bd48d18f4c4d8a22.jpg";

/***/ }),

/***/ "./src/asset/textures/sun.jpg":
/*!************************************!*\
  !*** ./src/asset/textures/sun.jpg ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "5f1a78ace28d2a7da656.jpg";

/***/ }),

/***/ "./src/asset/textures/waterbump.png":
/*!******************************************!*\
  !*** ./src/asset/textures/waterbump.png ***!
  \******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "def1408c18e9cc83d81f.png";

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript)
/******/ 				scriptUrl = document.currentScript.src
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) scriptUrl = scripts[scripts.length - 1].src
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		__webpack_require__.b = document.baseURI || self.location.href;
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"main": 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		// no on chunks loaded
/******/ 		
/******/ 		// no jsonp function
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!****************************!*\
  !*** ./src/ts/showcase.ts ***!
  \****************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _postProcesses_atmosphericScatteringPostProcess__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./postProcesses/atmosphericScatteringPostProcess */ "./src/ts/postProcesses/atmosphericScatteringPostProcess.ts");
/* harmony import */ var _components_planet__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./components/planet */ "./src/ts/components/planet.ts");
/* harmony import */ var _postProcesses_oceanPostProcess__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./postProcesses/oceanPostProcess */ "./src/ts/postProcesses/oceanPostProcess.ts");
/* harmony import */ var _components_forge_chunkForge__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./components/forge/chunkForge */ "./src/ts/components/forge/chunkForge.ts");
/* harmony import */ var _asset_textures_sun_jpg__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../asset/textures/sun.jpg */ "./src/asset/textures/sun.jpg");





let canvas = document.getElementById("renderer");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let engine = new BABYLON.Engine(canvas);
engine.loadingScreen.displayLoadingUI();
let scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
let depthRenderer = new BABYLON.DepthRenderer(scene);
scene.renderTargetsEnabled = true;
scene.customRenderTargets.push(depthRenderer.getDepthMap());
depthRenderer.getDepthMap().renderList = [];
let freeCamera = new BABYLON.FreeCamera("freeCamera", new BABYLON.Vector3(0, 0, 0), scene);
freeCamera.minZ = 1;
freeCamera.attachControl(canvas);
let box = BABYLON.Mesh.CreateBox("boate", 1, scene);
freeCamera.parent = box;
box.rotate(freeCamera.getDirection(BABYLON.Axis.Y), -1, BABYLON.Space.WORLD);
scene.activeCamera = freeCamera;
let light = new BABYLON.PointLight("light", BABYLON.Vector3.Zero(), scene);
const radius = 200 * 1e3; // diamètre en m
freeCamera.maxZ = Math.max(radius * 50, 10000);
let sun = BABYLON.Mesh.CreateSphere("tester", 32, 0.2 * radius, scene);
let mat = new BABYLON.StandardMaterial("mat", scene);
mat.emissiveTexture = new BABYLON.Texture(_asset_textures_sun_jpg__WEBPACK_IMPORTED_MODULE_4__, scene);
sun.material = mat;
light.parent = sun;
sun.position.x = -1718573.25;
sun.position.z = -65566.6171875;
depthRenderer.getDepthMap().renderList?.push(sun);
let forge = new _components_forge_chunkForge__WEBPACK_IMPORTED_MODULE_3__.ChunkForge(64, depthRenderer, scene);
let planet = new _components_planet__WEBPACK_IMPORTED_MODULE_1__.Planet("Arès", radius, new BABYLON.Vector3(0, 0, 4 * radius), 64, 1, 6, forge, scene);
planet.noiseModifiers.archipelagoFactor = 0.5;
planet.colorSettings.plainColor = new BABYLON.Vector3(0.1, 0.4, 0);
//planet.colorSettings.sandColor = planet.colorSettings.plainColor;
planet.colorSettings.sandSize = 200;
planet.colorSettings.steepSharpness = 6;
planet.colorSettings.waterLevel = 10e2;
planet.updateColors();
planet.attachNode.position.x = radius * 5;
planet.attachNode.parent = sun;
let moon = new _components_planet__WEBPACK_IMPORTED_MODULE_1__.Planet("Manaleth", radius / 8, new BABYLON.Vector3(Math.cos(-0.7), 0, Math.sin(-0.7)).scale(3 * radius), 64, 1, 6, forge, scene);
moon.noiseModifiers.archipelagoFactor = 1;
moon.colorSettings.plainColor = new BABYLON.Vector3(0.1, 0.1, 0.1);
moon.colorSettings.sandColor = planet.colorSettings.steepColor;
moon.craterModifiers.maxDepthModifier = 1 / 8;
moon.updateColors();
moon.attachNode.parent = planet.attachNode;
planet.attachNode.parent = sun;
let vls = new BABYLON.VolumetricLightScatteringPostProcess("trueLight", 1, scene.activeCamera, sun, 100);
let atmosphere = new _postProcesses_atmosphericScatteringPostProcess__WEBPACK_IMPORTED_MODULE_0__.AtmosphericScatteringPostProcess("atmosphere", planet.attachNode, radius - 15e3, radius + 30e3, sun, freeCamera, scene);
atmosphere.settings.intensity = 10;
atmosphere.settings.falloffFactor = 20;
atmosphere.settings.scatteringStrength = 0.4;
//let depth = new DepthPostProcess("depth", freeCamera, scene);
let ocean = new _postProcesses_oceanPostProcess__WEBPACK_IMPORTED_MODULE_2__.OceanPostProcess("ocean", planet.attachNode, radius + 10e2, sun, freeCamera, scene);
ocean.settings.alphaModifier = 0.00002;
ocean.settings.depthModifier = 0.004;
//ocean.settings.oceanRadius = 0;
//let clouds = new CloudPostProcess("clouds", planet.attachNode, radius + 5e3, radius + 10e3, sun, freeCamera, scene);
let keyboard = {};
document.addEventListener("keydown", e => {
    keyboard[e.key] = true;
    if (e.key == "p") { // take screenshots
        BABYLON.Tools.CreateScreenshotUsingRenderTarget(engine, scene.activeCamera, { precision: 4 });
    }
    if (e.key == "m")
        console.log(sun.absolutePosition, freeCamera.rotation);
});
document.addEventListener("keyup", e => keyboard[e.key] = false);
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    engine.resize();
});
scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();
    let t = 0;
    let speed = 0.0002 * radius;
    scene.beforeRender = () => {
        let forward = freeCamera.getDirection(BABYLON.Axis.Z);
        let upward = freeCamera.getDirection(BABYLON.Axis.Y);
        let right = freeCamera.getDirection(BABYLON.Axis.X);
        forge.update();
        planet.update(freeCamera.position, forward, sun.position, freeCamera);
        moon.update(freeCamera.position, forward, sun.position, freeCamera);
        if (keyboard["a"]) { // rotation autour de l'axe de déplacement
            box.rotate(forward, 0.02, BABYLON.Space.WORLD);
        }
        else if (keyboard["e"]) {
            box.rotate(forward, -0.02, BABYLON.Space.WORLD);
        }
        if (keyboard["i"]) {
            box.rotate(right, -0.02, BABYLON.Space.WORLD);
        }
        else if (keyboard["k"]) {
            box.rotate(right, 0.02, BABYLON.Space.WORLD);
        }
        if (keyboard["j"]) {
            box.rotate(upward, -0.02, BABYLON.Space.WORLD);
        }
        else if (keyboard["l"]) {
            box.rotate(upward, 0.02, BABYLON.Space.WORLD);
        }
        let deplacement = BABYLON.Vector3.Zero();
        if (keyboard["z"])
            deplacement.subtractInPlace(forward.scale(speed * engine.getDeltaTime()));
        if (keyboard["s"])
            deplacement.addInPlace(forward.scale(speed * engine.getDeltaTime()));
        if (keyboard["q"])
            deplacement.addInPlace(right.scale(speed * engine.getDeltaTime()));
        if (keyboard["d"])
            deplacement.subtractInPlace(right.scale(speed * engine.getDeltaTime()));
        if (keyboard[" "])
            deplacement.subtractInPlace(upward.scale(speed * engine.getDeltaTime()));
        if (keyboard["Shift"])
            deplacement.addInPlace(upward.scale(speed * engine.getDeltaTime()));
        if (keyboard["+"])
            speed *= 1.1;
        if (keyboard["-"])
            speed /= 1.1;
        if (keyboard["8"])
            speed = 0.03;
        sun.position.addInPlace(deplacement);
        t += 0.00002;
        /*
        sun.rotation.y = -t;
        planet.attachNode.rotation.y = -2 * t;
        */
        planet.surfaceMaterial.setVector3("v3LightPos", sun.absolutePosition);
        planet.surfaceMaterial.setVector3("planetPosition", planet.attachNode.absolutePosition);
        moon.surfaceMaterial.setVector3("v3LightPos", sun.absolutePosition);
        moon.surfaceMaterial.setVector3("planetPosition", moon.attachNode.absolutePosition);
    };
    engine.runRenderLoop(() => {
        scene.render();
    });
});

})();

/******/ })()
;
//# sourceMappingURL=main.js.map