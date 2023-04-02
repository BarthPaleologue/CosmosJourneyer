import { Direction, getQuaternionFromDirection } from "../utils/direction";
import { getChunkPlaneSpacePositionFromPath } from "../utils/chunkUtils";
import { BasicTransform } from "../uberCore/transforms/basicTransform";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Material } from "@babylonjs/core/Materials/material";
import { ITransformable } from "../orbits/iOrbitalBody";
import { Scene } from "@babylonjs/core/scene";

export class PlanetChunk implements ITransformable {
    public readonly mesh: Mesh;
    public readonly depth: number;
    public readonly cubePosition: Vector3;
    private ready = false;
    readonly isMinDepth;

    public readonly transform: BasicTransform;

    readonly chunkSideLength: number;

    constructor(path: number[], direction: Direction, parent: BasicTransform, material: Material, rootLength: number, isMinDepth: boolean, scene: Scene) {
        const id = `D${direction}P${path.join("")}`;

        this.depth = path.length;

        this.chunkSideLength = rootLength / 2 ** this.depth;

        this.isMinDepth = isMinDepth;

        this.transform = new BasicTransform(id + "Transform", scene);

        this.mesh = new Mesh(`Chunk${id}`, scene);
        this.mesh.setEnabled(false);
        this.mesh.isBlocker = true;
        this.mesh.material = material;
        /*this.mesh.material = Assets.DebugMaterial(id); //material;
        (this.mesh.material as StandardMaterial).disableLighting = true;
        this.mesh.material.wireframe = true;*/
        this.transform.node.parent = parent.node;
        this.mesh.parent = this.transform.node;

        // computing the position of the chunk on the side of the planet
        const position = getChunkPlaneSpacePositionFromPath(rootLength, path);

        // offseting from planet center to position on the side (default side then rotation for all sides)
        position.z -= rootLength / 2;
        position.applyRotationQuaternionInPlace(getQuaternionFromDirection(direction));

        this.cubePosition = position.clone();

        position.normalize().scaleInPlace(rootLength / 2);

        this.transform.node.position = position;
    }

    public getBoundingRadius(): number {
        return this.chunkSideLength / 2;
    }

    public isReady() {
        return this.ready;
    }

    public setReady(ready: boolean) {
        this.ready = ready;
        this.mesh.setEnabled(ready);
    }

    public dispose() {
        this.transform.dispose();
        this.mesh.dispose();
    }
}
