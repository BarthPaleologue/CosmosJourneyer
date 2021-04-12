import { PlanetChunk } from "./planetChunk.js";
import { TaskType } from "./chunkForge.js";
export class PlanetSide {
    constructor(_id, _maxDepth, _baseLength, _baseSubdivisions, _direction, _parentNode, _scene, _chunkForge) {
        this.id = _id;
        this.maxDepth = _maxDepth;
        this.baseLength = _baseLength;
        this.baseSubdivisions = _baseSubdivisions;
        this.direction = _direction;
        this.scene = _scene;
        this.chunkForge = _chunkForge;
        this.terrainFunction = this.chunkForge.terrainFunction;
        this.node = _parentNode;
        this.tree = this.createChunk([]);
    }
    addBranch(path) {
        this.tree = addRecursivelyBranch(this, this.tree, path, [], this.chunkForge, this.scene);
    }
    deleteBranch(path) {
        this.tree = deleteRecursivelyBranch(this, this.tree, path, [], this.chunkForge, this.scene);
    }
    checkExistenceFromPath(path) {
        return checkExistenceRecursively(this.tree, path);
    }
    updateLOD(position) {
        executeRecursivelyGlobaly(this.tree, (chunk) => {
            var _a;
            let chunkPosition = chunk.position.add(this.node.position);
            let visible = (_a = this.scene.activeCamera) === null || _a === void 0 ? void 0 : _a.isInFrustum(chunk.mesh);
            let d = Math.pow((chunkPosition.x - position.x), 2) + Math.pow((chunkPosition.y - position.y), 2) + Math.pow((chunkPosition.z - position.z), 2);
            if (d < 10 * (Math.pow(this.baseLength, 2)) / (Math.pow(2, chunk.depth)) && chunk.depth < this.maxDepth && visible) {
                this.addBranch(chunk.path);
            }
            else if (d > 10 * (Math.pow(this.baseLength, 2)) / (Math.pow(2, (chunk.depth - 2)))) {
                let path = chunk.path;
                if (path.length > 0) {
                    path.pop();
                    this.deleteBranch(path);
                }
            }
        });
    }
    createChunk(path) {
        return new PlanetChunk(path, this.baseLength, this.baseSubdivisions, this.direction, this.node, this.scene, this.chunkForge);
    }
    setParent(parent) {
        this.node.parent = parent;
    }
    setRotation(rotation) {
        this.node.rotation = rotation;
    }
    setPosition(position) {
        this.node.position = position;
    }
}
function addRecursivelyBranch(plane, tree, path, walked, chunkForge, scene) {
    if (path.length == 0 && tree instanceof PlanetChunk) {
        let newBranch = [
            plane.createChunk(walked.concat([0])),
            plane.createChunk(walked.concat([1])),
            plane.createChunk(walked.concat([2])),
            plane.createChunk(walked.concat([3]))
        ];
        deleteBranch(tree, chunkForge);
        return newBranch;
    }
    else {
        if (tree instanceof PlanetChunk) {
            let newTree = [
                plane.createChunk(walked.concat([0])),
                plane.createChunk(walked.concat([1])),
                plane.createChunk(walked.concat([2])),
                plane.createChunk(walked.concat([3]))
            ];
            let next = path.shift();
            newTree[next] = addRecursivelyBranch(plane, newTree[next], path, walked.concat([next]), chunkForge, scene);
            deleteBranch(tree, chunkForge);
            return newTree;
        }
        else {
            if (path.length == 0)
                return tree;
            else {
                let next = path.shift();
                tree[next] = addRecursivelyBranch(plane, tree[next], path, walked.concat([next]), chunkForge, scene);
                return tree;
            }
        }
    }
}
function deleteRecursivelyBranch(plane, tree, path, walked, chunkForge, scene) {
    if (path.length == 0 && !(tree instanceof PlanetChunk)) {
        let replacement = plane.createChunk(walked);
        deleteBranch(tree, chunkForge);
        return replacement;
    }
    else {
        if (tree instanceof PlanetChunk) {
            return tree;
        }
        else {
            let next = path.shift();
            tree[next] = deleteRecursivelyBranch(plane, tree[next], path, walked.concat([next]), chunkForge, scene);
            return tree;
        }
    }
}
function deleteBranch(tree, chunkForge) {
    executeRecursivelyGlobaly(tree, (tree) => {
        chunkForge.addTask({
            taskType: TaskType.Deletion,
            id: tree.id,
            parentNode: tree.parentNode,
            position: tree.position,
            depth: tree.depth,
            direction: tree.direction
        });
    });
}
function checkExistenceRecursively(tree, path) {
    return (path.length == 0 && tree instanceof PlanetChunk) || (!(tree instanceof PlanetChunk) && checkExistenceRecursively(tree[path.shift()], path));
}
function executeRecursivelyGlobaly(tree, f) {
    if (tree instanceof PlanetChunk) {
        f(tree);
    }
    else {
        for (let stem of tree)
            executeRecursivelyGlobaly(stem, f);
    }
}
