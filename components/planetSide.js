import { Chunk } from "./chunk.js";
export class PlanetSide {
    constructor(_id, _maxDepth, _baseLength, _baseSubdivisions, _direction, _parentNode, _scene, _terrainFunction) {
        this.id = _id;
        this.maxDepth = _maxDepth;
        this.baseLength = _baseLength;
        this.baseSubdivisions = _baseSubdivisions;
        this.direction = _direction;
        this.scene = _scene;
        this.terrainFunction = _terrainFunction;
        this.node = _parentNode;
        this.tree = this.createChunk([]);
    }
    addBranch(path) {
        this.tree = addRecursivelyBranch(this, this.tree, path, [], this.scene);
    }
    deleteBranch(path) {
        this.tree = deleteRecursivelyBranch(this, this.tree, path, [], this.scene);
    }
    checkExistenceFromPath(path) {
        return checkExistenceRecursively(this.tree, path);
    }
    updateLOD(position) {
        executeRecursivelyGlobaly(this.tree, (tree) => {
            let chunkPosition = tree.position.add(this.node.position);
            let d = Math.pow((chunkPosition.x - position.x), 2) + Math.pow((chunkPosition.y - position.y), 2) + Math.pow((chunkPosition.z - position.z), 2);
            if (d < 20 * (Math.pow(this.baseLength, 2)) / (Math.pow(2, tree.depth)) && tree.depth < this.maxDepth) {
                this.addBranch(tree.path);
            }
            else if (d > 20 * (Math.pow(this.baseLength, 2)) / (Math.pow(2, (tree.depth - 3)))) {
                let path = tree.path;
                if (path.length > 0) {
                    path.pop();
                    this.deleteBranch(path);
                }
            }
        });
    }
    createChunk(path) {
        return new Chunk(path, this.baseLength, this.baseSubdivisions, this.direction, this.node, this.scene, this.terrainFunction);
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
    morph(morphFunction) {
        executeRecursivelyGlobaly(this.tree, (chunk) => {
            chunk.morph(morphFunction);
        });
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
            if (path.length == 0)
                return tree;
            else {
                let next = path.shift();
                tree[next] = addRecursivelyBranch(plane, tree[next], path, walked.concat([next]), scene);
                return tree;
            }
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
    executeRecursivelyGlobaly(tree, (tree) => {
        var _a;
        (_a = tree.mesh.material) === null || _a === void 0 ? void 0 : _a.dispose();
        tree.mesh.dispose();
    });
}
function checkExistenceRecursively(tree, path) {
    return (path.length == 0 && tree instanceof Chunk) || (!(tree instanceof Chunk) && checkExistenceRecursively(tree[path.shift()], path));
}
function executeRecursivelyGlobaly(tree, f) {
    if (tree instanceof Chunk) {
        f(tree);
    }
    else {
        for (let stem of tree)
            executeRecursivelyGlobaly(stem, f);
    }
}
