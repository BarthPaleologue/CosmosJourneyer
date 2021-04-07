import { Chunk } from "./chunk.js";

type quadTree = quadTree[] | Chunk;

export class QuadTree {
    maxDepth: number;
    tree: quadTree;
    size: number;
    position: BABYLON.Vector3;
    scene: BABYLON.Scene;
    constructor(_maxDepth: number, _size: number, _position: BABYLON.Vector3, _scene: BABYLON.Scene) {
        this.maxDepth = _maxDepth;
        this.size = _size;
        this.position = _position;
        this.scene = _scene;
        this.tree = new Chunk([0], this.scene);
    }
    addBranch(path: number[]) {
        this.tree = addRecursivelyBranch(this.tree, path, [], this.scene);
    }
    deleteBranch(path: number[]) {
        this.tree = deleteRecursivelyBranch(this.tree, path, [], this.scene);
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
}

function addRecursivelyBranch(tree: quadTree, path: number[], walked: number[], scene: BABYLON.Scene): quadTree {
    if (path.length == 0) {
        deleteBranch(tree);
        return [
            new Chunk(walked.concat([0]), scene),
            new Chunk(walked.concat([1]), scene),
            new Chunk(walked.concat([2]), scene),
            new Chunk(walked.concat([3]), scene)
        ];
    } else {
        if (tree instanceof Chunk) {
            deleteBranch(tree);
            let newTree: quadTree = [
                new Chunk(walked.concat([0]), scene),
                new Chunk(walked.concat([1]), scene),
                new Chunk(walked.concat([2]), scene),
                new Chunk(walked.concat([3]), scene)
            ];
            let next = path.shift()!;
            newTree[next] = addRecursivelyBranch(newTree[next], path, walked.concat([next]), scene);
            return newTree;
        } else {
            let next = path.shift()!;
            tree[next] = addRecursivelyBranch(tree[next], path, walked.concat([next]), scene);
            return tree;
        }

    }
}

function deleteRecursivelyBranch(tree: quadTree, path: number[], walked: number[], scene: BABYLON.Scene): quadTree {
    if (path.length == 0) {
        deleteBranch(tree);
        return new Chunk(walked, scene);
    } else {
        if (tree instanceof Chunk) {
            return tree;
        } else {
            let next = path.shift()!;
            tree[next] = deleteRecursivelyBranch(tree[next], path, walked.concat([next]), scene);
            return tree;
        }
    }
}

function deleteBranch(tree: quadTree): void {
    if (tree instanceof Chunk) {
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