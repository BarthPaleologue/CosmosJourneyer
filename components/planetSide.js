import { Chunk } from "./chunk.js";
export class PlaneLOD {
    constructor(_id, _maxDepth, _baseLength, _baseSubdivisions, _direction, _parentNode, _scene) {
        this.id = _id;
        this.maxDepth = _maxDepth;
        this.baseLength = _baseLength;
        this.baseSubdivisions = _baseSubdivisions;
        this.direction = _direction;
        this.scene = _scene;
        this.node = _parentNode;
        //this.node.position = this.position;
        //this.node.rotation = this.rotation;
        this.node;
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
            let d = Math.pow((tree.position.x - position.x), 2) + Math.pow((tree.position.y - position.y), 2) + Math.pow((tree.position.z - position.z), 2);
            if (d < 10 * this.baseLength / (Math.pow(2, tree.depth)) && tree.depth < this.maxDepth) {
                this.addBranch(tree.path);
            }
            else if (d > 10 * this.baseLength / (Math.pow(2, (tree.depth - 3)))) {
                let path = tree.path;
                if (path.length > 0) {
                    path.pop();
                    this.deleteBranch(path);
                }
            }
        });
    }
    createChunk(path) {
        return new Chunk(path, this.baseLength, this.baseSubdivisions, this.direction, this.node, this.scene);
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
/*function getChunkRecursively(tree: quadTree, path: number[]): Chunk {
    let res = executeOnChunk(tree, path, [], (tree: quadTree) => { return tree; });
    if (res instanceof Chunk) return res;
    else throw console.error(`Chunk demandé n'existe pas : ${path}`);
}*/
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
/*function executeOnChunk(tree: quadTree, path: number[], walked: number[], f: (tree: quadTree) => quadTree): quadTree {
    if (path.length == 0) {
        return f(tree);
    } else {
        if (tree instanceof Chunk) {
            throw console.error(`Le chunk demandé n'existe pas : exploré : [${walked}] ; restant : [${path}]`);
        } else {
            let next = path.shift()!;
            return executeOnChunk(tree[next], path, walked.concat([next]), f);
        }
    }
}*/ 
