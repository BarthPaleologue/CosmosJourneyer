import { Chunk } from "./chunk.js";
export class QuadTree {
    constructor(_maxDepth, _size, _position, _scene) {
        this.maxDepth = _maxDepth;
        this.size = _size;
        this.position = _position;
        this.scene = _scene;
        this.tree = new Chunk([0], this.scene);
    }
    addBranch(path) {
        this.tree = addRecursivelyBranch(this.tree, path, [], this.scene);
    }
    deleteBranch(path) {
        this.tree = deleteRecursivelyBranch(this.tree, path, [], this.scene);
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
}
function addRecursivelyBranch(tree, path, walked, scene) {
    if (path.length == 0) {
        deleteBranch(tree);
        return [
            new Chunk(walked.concat([0]), scene),
            new Chunk(walked.concat([1]), scene),
            new Chunk(walked.concat([2]), scene),
            new Chunk(walked.concat([3]), scene)
        ];
    }
    else {
        if (tree instanceof Chunk) {
            deleteBranch(tree);
            let newTree = [
                new Chunk(walked.concat([0]), scene),
                new Chunk(walked.concat([1]), scene),
                new Chunk(walked.concat([2]), scene),
                new Chunk(walked.concat([3]), scene)
            ];
            let next = path.shift();
            newTree[next] = addRecursivelyBranch(newTree[next], path, walked.concat([next]), scene);
            return newTree;
        }
        else {
            let next = path.shift();
            tree[next] = addRecursivelyBranch(tree[next], path, walked.concat([next]), scene);
            return tree;
        }
    }
}
function deleteRecursivelyBranch(tree, path, walked, scene) {
    if (path.length == 0) {
        deleteBranch(tree);
        return new Chunk(walked, scene);
    }
    else {
        if (tree instanceof Chunk) {
            return tree;
        }
        else {
            let next = path.shift();
            tree[next] = deleteRecursivelyBranch(tree[next], path, walked.concat([next]), scene);
            return tree;
        }
    }
}
function deleteBranch(tree) {
    if (tree instanceof Chunk) {
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
