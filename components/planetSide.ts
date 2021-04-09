import { Chunk } from "./chunk.js";
import { Direction } from "./direction.js";

type quadTree = quadTree[] | Chunk;

export class PlanetSide {
    id: string;
    maxDepth: number;
    tree: quadTree;
    baseLength: number;
    baseSubdivisions: number;
    direction: Direction;
    node: BABYLON.Mesh;
    scene: BABYLON.Scene;
    terrainFunction: (p: BABYLON.Vector3) => BABYLON.Vector3;
    constructor(_id: string, _maxDepth: number, _baseLength: number, _baseSubdivisions: number, _direction: Direction, _parentNode: BABYLON.Mesh, _scene: BABYLON.Scene, _terrainFunction: (p: BABYLON.Vector3) => BABYLON.Vector3) {
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
    addBranch(path: number[]) {
        this.tree = addRecursivelyBranch(this, this.tree, path, [], this.scene);
    }
    deleteBranch(path: number[]) {
        this.tree = deleteRecursivelyBranch(this, this.tree, path, [], this.scene);
    }

    checkExistenceFromPath(path: number[]) {
        return checkExistenceRecursively(this.tree, path);
    }

    updateLOD(position: BABYLON.Vector3) {
        executeRecursivelyGlobaly(this.tree, (tree: Chunk) => {
            let d = (tree.position.x - position.x) ** 2 + (tree.position.y - position.y) ** 2 + (tree.position.z - position.z) ** 2;

            if (d < 10 * this.baseLength / (2 ** tree.depth) && tree.depth < this.maxDepth) {
                this.addBranch(tree.path);
            } else if (d > 10 * this.baseLength / (2 ** (tree.depth - 3))) {
                let path = tree.path;
                if (path.length > 0) {
                    path.pop();
                    this.deleteBranch(path);
                }
            }
        });
    }
    createChunk(path: number[]): Chunk {
        return new Chunk(path, this.baseLength, this.baseSubdivisions, this.direction, this.node, this.scene, this.terrainFunction);
    }
    setParent(parent: BABYLON.Mesh) {
        this.node.parent = parent;
    }
    setRotation(rotation: BABYLON.Vector3) {
        this.node.rotation = rotation;
    }
    setPosition(position: BABYLON.Vector3) {
        this.node.position = position;
    }
    morph(morphFunction: (position: BABYLON.Vector3) => BABYLON.Vector3) {
        executeRecursivelyGlobaly(this.tree, (chunk: Chunk) => {
            chunk.morph(morphFunction);
        });
    }
}

function addRecursivelyBranch(plane: PlanetSide, tree: quadTree, path: number[], walked: number[], scene: BABYLON.Scene): quadTree {
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
            if (path.length == 0) return tree;
            else {
                let next = path.shift()!;
                tree[next] = addRecursivelyBranch(plane, tree[next], path, walked.concat([next]), scene);

                return tree;
            }
        }

    }
}

function deleteRecursivelyBranch(plane: PlanetSide, tree: quadTree, path: number[], walked: number[], scene: BABYLON.Scene): quadTree {
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
    executeRecursivelyGlobaly(tree, (tree: Chunk) => {
        tree.mesh.material?.dispose();
        tree.mesh.dispose();
    });
}

/*function getChunkRecursively(tree: quadTree, path: number[]): Chunk {
    let res = executeOnChunk(tree, path, [], (tree: quadTree) => { return tree; });
    if (res instanceof Chunk) return res;
    else throw console.error(`Chunk demandé n'existe pas : ${path}`);
}*/

function checkExistenceRecursively(tree: quadTree, path: number[]): boolean {
    return (path.length == 0 && tree instanceof Chunk) || (!(tree instanceof Chunk) && checkExistenceRecursively(tree[path.shift()!], path));
}

function executeRecursivelyGlobaly(tree: quadTree, f: (tree: Chunk) => void) {
    if (tree instanceof Chunk) {
        f(tree);
    } else {
        for (let stem of tree) executeRecursivelyGlobaly(stem, f);
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