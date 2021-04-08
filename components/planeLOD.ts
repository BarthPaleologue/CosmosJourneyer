import { Chunk } from "./chunk.js";

type quadTree = quadTree[] | Chunk;

const baseLength = 10;
const baseSubdivisions = 20;

export class PlaneLOD {
    maxDepth: number;
    tree: quadTree;
    baseLength: number;
    position: BABYLON.Vector3;
    rotation: BABYLON.Vector3;
    scene: BABYLON.Scene;
    constructor(_maxDepth: number, _baseLength: number, _position: BABYLON.Vector3, _rotation: BABYLON.Vector3, _scene: BABYLON.Scene) {
        this.maxDepth = _maxDepth;
        this.baseLength = _baseLength;
        this.position = _position;
        this.rotation = _rotation;
        this.scene = _scene;
        this.tree = this.createChunk([]);
    }
    addBranch(path: number[]) {
        this.tree = addRecursivelyBranch(this, this.tree, path, [], this.scene);
    }
    deleteBranch(path: number[]) {
        this.tree = deleteRecursivelyBranch(this, this.tree, path, [], this.scene);
    }
    getChunkFromPath(path: number[]) {
        return getChunkRecursively(this.tree, path);
    }
    checkExistenceFromPath(path: number[]) {
        return checkExistenceRecursively(this.tree, path);
    }
    move(displacement: BABYLON.Vector3) {
        moveRecursively(this.tree, displacement);
    }
    setPosition(position: BABYLON.Vector3) {
        let displacement = position.subtract(this.position);
        this.position = position;
        moveRecursively(this.tree, displacement);
    }
    updateLOD(position: BABYLON.Vector3) {
        updateLODRecursively(this, this.tree, position);
    }
    createChunk(path: number[]): Chunk {
        return new Chunk(path, this.baseLength, baseSubdivisions, this.position, this.rotation, this.scene);
    }
    rotate(rotation: BABYLON.Vector3) {
        rotateRecursively(this.tree, rotation);
    }
}

function addRecursivelyBranch(plane: PlaneLOD, tree: quadTree, path: number[], walked: number[], scene: BABYLON.Scene): quadTree {
    if (path.length == 0 && tree instanceof Chunk) {
        deleteBranch(tree);
        return [
            plane.createChunk(walked.concat([0])),
            plane.createChunk(walked.concat([1])),
            plane.createChunk(walked.concat([2])),
            plane.createChunk(walked.concat([3]))
        ];
    } else {
        if (tree instanceof Chunk) {
            deleteBranch(tree);
            let newTree: quadTree = [
                plane.createChunk(walked.concat([0])),
                plane.createChunk(walked.concat([1])),
                plane.createChunk(walked.concat([2])),
                plane.createChunk(walked.concat([3]))
            ];
            let next = path.shift()!;
            newTree[next] = addRecursivelyBranch(plane, newTree[next], path, walked.concat([next]), scene);
            return newTree;
        } else {
            let next = path.shift()!;
            tree[next] = addRecursivelyBranch(plane, tree[next], path, walked.concat([next]), scene);
            return tree;
        }

    }
}

function deleteRecursivelyBranch(plane: PlaneLOD, tree: quadTree, path: number[], walked: number[], scene: BABYLON.Scene): quadTree {
    if (path.length == 0 && !(tree instanceof Chunk)) {
        deleteBranch(tree);
        return plane.createChunk(walked);
    } else {
        if (tree instanceof Chunk) {
            return tree;
        } else {
            let next = path.shift()!;
            tree[next] = deleteRecursivelyBranch(plane, tree[next], path, walked.concat([next]), scene);
            return tree;
        }
    }
}

function deleteBranch(tree: quadTree): void {
    if (tree instanceof Chunk) {
        tree.mesh.material?.dispose();
        tree.mesh.dispose();
    } else {
        for (let stem of tree) {
            deleteBranch(stem);
        }
    }
}

function getChunkRecursively(tree: quadTree, path: number[]): Chunk {
    if (tree instanceof Chunk) {
        return tree;
    } else {
        let next = path.shift()!;
        return getChunkRecursively(tree[next], path);
    }
}

function checkExistenceRecursively(tree: quadTree, path: number[]): boolean {
    return (path.length == 0 && tree instanceof Chunk) || (!(tree instanceof Chunk) && checkExistenceRecursively(tree[path.shift()!], path));
}

function moveRecursively(tree: quadTree, displacement: BABYLON.Vector3): void {
    if (tree instanceof Chunk) {
        tree.mesh.position.addInPlace(displacement);
    } else {
        for (let stem of tree) moveRecursively(stem, displacement);
    }
}

function rotateRecursively(tree: quadTree, rotation: BABYLON.Vector3): void {
    if (tree instanceof Chunk) {
        tree.mesh.rotation = rotation;
    } else {
        for (let stem of tree) rotateRecursively(stem, rotation);
    }
}

function updateLODRecursively(ogTree: PlaneLOD, tree: quadTree, position: BABYLON.Vector3) {
    if (tree instanceof Chunk) {

        let d = (tree.position.x - position.x) ** 2 + (tree.position.y - position.y) ** 2 + (tree.position.z - position.z) ** 2;

        if (d < 3 * baseLength / (2 ** tree.depth) && tree.depth < ogTree.maxDepth) {
            ogTree.addBranch(tree.path);
        } else if (d > 6 * baseLength / (2 ** (tree.depth - 1))) {
            let path = tree.path;
            if (path.length > 0) {
                path.pop();
                ogTree.deleteBranch(path);
            }
        }
    } else {
        for (let stem of tree) {
            updateLODRecursively(ogTree, stem, position);
        }
    }
}