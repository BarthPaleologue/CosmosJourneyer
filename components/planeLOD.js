import { Chunk } from "./chunk.js";
const baseLength = 10;
const baseSubdivisions = 20;
export class PlaneLOD {
    constructor(_maxDepth, _baseLength, _position, _rotation, _scene) {
        this.maxDepth = _maxDepth;
        this.baseLength = _baseLength;
        this.position = _position;
        this.rotation = _rotation;
        this.scene = _scene;
        this.tree = this.createChunk([]);
    }
    addBranch(path) {
        this.tree = addRecursivelyBranch(this, this.tree, path, [], this.scene);
    }
    deleteBranch(path) {
        this.tree = deleteRecursivelyBranch(this, this.tree, path, [], this.scene);
    }
    getChunkFromPath(path) {
        return getChunkRecursively(this.tree, path);
    }
    checkExistenceFromPath(path) {
        return checkExistenceRecursively(this.tree, path);
    }
    move(displacement) {
        moveRecursively(this.tree, displacement);
    }
    setPosition(position) {
        let displacement = position.subtract(this.position);
        this.position = position;
        moveRecursively(this.tree, displacement);
    }
    updateLOD(position) {
        updateLODRecursively(this, this.tree, position);
    }
    createChunk(path) {
        return new Chunk(path, this.baseLength, baseSubdivisions, this.position, this.rotation, this.scene);
    }
    rotate(rotation) {
        rotateRecursively(this.tree, rotation);
    }
}
function addRecursivelyBranch(plane, tree, path, walked, scene) {
    if (path.length == 0 && tree instanceof Chunk) {
        deleteBranch(tree);
        return [
            plane.createChunk(walked.concat([0])),
            plane.createChunk(walked.concat([1])),
            plane.createChunk(walked.concat([2])),
            plane.createChunk(walked.concat([3]))
        ];
    }
    else {
        if (tree instanceof Chunk) {
            deleteBranch(tree);
            let newTree = [
                plane.createChunk(walked.concat([0])),
                plane.createChunk(walked.concat([1])),
                plane.createChunk(walked.concat([2])),
                plane.createChunk(walked.concat([3]))
            ];
            let next = path.shift();
            newTree[next] = addRecursivelyBranch(plane, newTree[next], path, walked.concat([next]), scene);
            return newTree;
        }
        else {
            let next = path.shift();
            tree[next] = addRecursivelyBranch(plane, tree[next], path, walked.concat([next]), scene);
            return tree;
        }
    }
}
function deleteRecursivelyBranch(plane, tree, path, walked, scene) {
    if (path.length == 0 && !(tree instanceof Chunk)) {
        deleteBranch(tree);
        return plane.createChunk(walked);
    }
    else {
        if (tree instanceof Chunk) {
            return tree;
        }
        else {
            let next = path.shift();
            tree[next] = deleteRecursivelyBranch(plane, tree[next], path, walked.concat([next]), scene);
            return tree;
        }
    }
}
function deleteBranch(tree) {
    var _a;
    if (tree instanceof Chunk) {
        (_a = tree.mesh.material) === null || _a === void 0 ? void 0 : _a.dispose();
        tree.mesh.dispose();
    }
    else {
        for (let stem of tree) {
            deleteBranch(stem);
        }
    }
}
function getChunkRecursively(tree, path) {
    if (tree instanceof Chunk) {
        return tree;
    }
    else {
        let next = path.shift();
        return getChunkRecursively(tree[next], path);
    }
}
function checkExistenceRecursively(tree, path) {
    return (path.length == 0 && tree instanceof Chunk) || (!(tree instanceof Chunk) && checkExistenceRecursively(tree[path.shift()], path));
}
function moveRecursively(tree, displacement) {
    if (tree instanceof Chunk) {
        tree.mesh.position.addInPlace(displacement);
    }
    else {
        for (let stem of tree)
            moveRecursively(stem, displacement);
    }
}
function rotateRecursively(tree, rotation) {
    if (tree instanceof Chunk) {
        tree.mesh.rotation = rotation;
    }
    else {
        for (let stem of tree)
            rotateRecursively(stem, rotation);
    }
}
function updateLODRecursively(ogTree, tree, position) {
    if (tree instanceof Chunk) {
        let d = Math.pow((tree.position.x - position.x), 2) + Math.pow((tree.position.y - position.y), 2) + Math.pow((tree.position.z - position.z), 2);
        if (d < 3 * baseLength / (Math.pow(2, tree.depth)) && tree.depth < ogTree.maxDepth) {
            ogTree.addBranch(tree.path);
        }
        else if (d > 6 * baseLength / (Math.pow(2, (tree.depth - 1)))) {
            let path = tree.path;
            if (path.length > 0) {
                path.pop();
                ogTree.deleteBranch(path);
            }
        }
    }
    else {
        for (let stem of tree) {
            updateLODRecursively(ogTree, stem, position);
        }
    }
}
