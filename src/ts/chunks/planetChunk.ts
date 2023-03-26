import { Direction, getQuaternionFromDirection } from "../utils/direction";
import { getChunkPlaneSpacePositionFromPath } from "../utils/chunkUtils";
import { BasicTransform } from "../uberCore/transforms/basicTransform";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Material } from "@babylonjs/core/Materials/material";

export class PlanetChunk {
    public readonly mesh: Mesh;
    public readonly depth: number;
    public readonly cubePosition: Vector3;
    private ready = false;
    readonly isMinDepth;

    constructor(path: number[], direction: Direction, parent: BasicTransform, material: Material, rootLength: number, isMinDepth: boolean) {
        const id = `D${direction}P${path.join("")}`;

        this.depth = path.length;

        this.isMinDepth = isMinDepth;

        this.mesh = new Mesh(`Chunk${id}`);
        this.mesh.setEnabled(false);
        this.mesh.isBlocker = true;
        this.mesh.material = material;
        this.mesh.parent = parent.node;

        // computing the position of the chunk on the side of the planet
        this.mesh.position = getChunkPlaneSpacePositionFromPath(rootLength, path);

        // offseting from planet center to position on the side (default side then rotation for all sides)
        this.mesh.position.z -= rootLength / 2;
        this.mesh.position.applyRotationQuaternionInPlace(getQuaternionFromDirection(direction));

        this.cubePosition = this.mesh.position.clone();

        this.mesh.position.normalize().scaleInPlace(rootLength / 2);
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
