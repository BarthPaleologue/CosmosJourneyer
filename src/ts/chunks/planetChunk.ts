import { Mesh } from "@babylonjs/core";

import { ChunkForge } from "./chunkForge";
import { BuildTask, TaskType } from "./taskInterfaces";
import { Direction, getQuaternionFromDirection } from "../utils/direction";
import { getChunkPlaneSpacePositionFromPath } from "../utils/chunkUtils";
import { ChunkTree } from "./chunkTree";

export class PlanetChunk {
    public readonly mesh: Mesh;
    public readonly depth: number;
    public readonly tree: ChunkTree;
    private ready = false;

    constructor(path: number[], direction: Direction, chunkForge: ChunkForge, tree: ChunkTree, isFiner: boolean) {
        const id = `D${direction}P${path.join("")}`;

        this.depth = path.length;

        this.tree = tree;

        this.mesh = new Mesh(`Chunk${id}`, tree.planet.transform.getScene());
        this.mesh.setEnabled(false);
        this.mesh.isBlocker = true;
        this.mesh.material = tree.planet.material;
        this.mesh.parent = tree.planet.transform;

        // computing the position of the chunk on the side of the planet
        this.mesh.position = getChunkPlaneSpacePositionFromPath(tree.planet.getDiameter(), path);

        // offseting from planet center to position on the side (default side then rotation for all sides)
        this.mesh.position.z -= tree.planet.getRadius();

        const buildTask: BuildTask = {
            type: TaskType.Build,
            planet: tree.planet,
            position: this.mesh.position.clone(),
            depth: path.length,
            direction: direction,
            chunk: this,
            isFiner: isFiner
        };

        chunkForge.addTask(buildTask);

        // TODO: put this somewhere else
        // sphérisation du cube
        // note : on sphérise après car le worker script calcule les positions à partir du cube
        this.mesh.position.normalize();
        this.mesh.position.scaleInPlace(tree.planet.getRadius());
        this.mesh.position.applyRotationQuaternionInPlace(getQuaternionFromDirection(direction));
    }

    public isReady() {
        return this.ready;
    }

    public setReady(ready: boolean) {
        this.ready = ready;
        this.mesh.setEnabled(ready);
    }

    public dispose() {
        this.mesh.dispose();
    }
}
