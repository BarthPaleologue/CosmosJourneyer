import { Direction, getQuaternionFromDirection } from "../../utils/direction";
import { getChunkPlaneSpacePositionFromPath } from "../../utils/chunkUtils";
import { BasicTransform } from "../uberCore/transforms/basicTransform";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Material } from "@babylonjs/core/Materials/material";
import { ITransformable } from "../../model/orbits/iOrbitalObject";
import { Scene } from "@babylonjs/core/scene";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import "@babylonjs/core/Engines/Extensions/engine.query";
import { VertexData } from "@babylonjs/core/Meshes";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";

export class PlanetChunk implements ITransformable {
    public readonly mesh: Mesh;
    private readonly depth: number;
    public readonly cubePosition: Vector3;
    private ready = false;
    readonly isMinDepth;

    public readonly transform: BasicTransform;

    readonly chunkSideLength: number;

    private aggregate: PhysicsAggregate | null = null;

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

        this.mesh.occlusionQueryAlgorithmType = AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE;
        this.mesh.occlusionType = AbstractMesh.OCCLUSION_TYPE_STRICT;

        // computing the position of the chunk on the side of the planet
        const position = getChunkPlaneSpacePositionFromPath(rootLength, path);

        // offseting from planet center to position on the side (default side then rotation for all sides)
        position.z -= rootLength / 2;
        position.applyRotationQuaternionInPlace(getQuaternionFromDirection(direction));

        this.cubePosition = position.clone();

        position.normalize().scaleInPlace(rootLength / 2);

        this.transform.node.position = position;
    }

    public init(vertexData: VertexData) {
        vertexData.applyToMesh(this.mesh, false);
        this.mesh.freezeNormals();
        if (this.isMinDepth) this.setReady(true);

        if(this.depth > 7) this.aggregate = new PhysicsAggregate(this.mesh, PhysicsShapeType.MESH, { mass: 0 }, this.mesh.getScene());
    }

    public getBoundingRadius(): number {
        return this.chunkSideLength / 2;
    }

    public getAggregate(): PhysicsAggregate | null {
        return this.aggregate;
    }

    /**
     * Returns true if the chunk is ready to be enabled (i.e if the chunk has recieved its vertex data)
     * @returns true if the chunk is ready to be enabled (i.e if the chunk has recieved its vertex data)
     */
    public isReady() {
        return this.ready;
    }

    /**
     * Sets the chunk readiness. Call it with true when it recieves its vertex data and call it with false when it has to be deleted
     * @param ready true if the chunk is ready to be enabled (i.e if the chunk has recieved its vertex data)
     */
    public setReady(ready: boolean) {
        this.ready = ready;
        this.mesh.setEnabled(ready);
    }

    public dispose() {
        this.transform.dispose();
        this.mesh.dispose();
    }
}
