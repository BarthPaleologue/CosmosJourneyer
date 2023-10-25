import { Direction, getQuaternionFromDirection } from "../../utils/direction";
import { getChunkPlaneSpacePositionFromPath } from "../../utils/chunkUtils";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Material } from "@babylonjs/core/Materials/material";
import { Transformable } from "../../view/common";
import { Scene } from "@babylonjs/core/scene";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import "@babylonjs/core/Engines/Extensions/engine.query";
import { TransformNode, VertexData } from "@babylonjs/core/Meshes";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeMesh } from "@babylonjs/core/Physics/v2/physicsShape";

export class PlanetChunk implements Transformable {
    public readonly mesh: Mesh;
    private readonly depth: number;
    public readonly cubePosition: Vector3;
    private ready = false;
    readonly isMinDepth;

    private readonly transform: TransformNode;

    readonly chunkSideLength: number;

    private readonly parent: TransformNode;

    private physicsShape: PhysicsShapeMesh | null = null;
    private readonly parentAggregate: PhysicsAggregate;

    constructor(path: number[], direction: Direction, parentAggregate: PhysicsAggregate, material: Material, rootLength: number, isMinDepth: boolean, scene: Scene) {
        const id = `D${direction}P${path.join("")}`;

        this.depth = path.length;

        this.chunkSideLength = rootLength / 2 ** this.depth;

        this.isMinDepth = isMinDepth;

        this.transform = new TransformNode(`${id}Transform`, scene);

        this.mesh = new Mesh(`Chunk${id}`, scene);
        this.mesh.setEnabled(false);
        this.mesh.isBlocker = true;
        this.mesh.material = material;
        /*this.mesh.material = Assets.DebugMaterial(id); //material;
        (this.mesh.material as StandardMaterial).disableLighting = true;
        this.mesh.material.wireframe = true;*/
        this.transform.parent = parentAggregate.transformNode;
        this.mesh.parent = this.transform;

        this.mesh.occlusionQueryAlgorithmType = AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE;
        this.mesh.occlusionType = AbstractMesh.OCCLUSION_TYPE_STRICT;

        this.parent = parentAggregate.transformNode;
        this.parentAggregate = parentAggregate;

        // computing the position of the chunk on the side of the planet
        const position = getChunkPlaneSpacePositionFromPath(rootLength, path);

        // offseting from planet center to position on the side (default side then rotation for all sides)
        position.z -= rootLength / 2;
        position.applyRotationQuaternionInPlace(getQuaternionFromDirection(direction));

        this.cubePosition = position.clone();

        position.normalize().scaleInPlace(rootLength / 2);

        this.transform.position = position;
    }

    public getTransform(): TransformNode {
        return this.transform;
    }

    public init(vertexData: VertexData) {
        vertexData.applyToMesh(this.mesh, false);
        this.mesh.freezeNormals();
        if (this.isMinDepth) this.setReady(true);

        if (this.depth > 7) {
            //this.aggregate = new PhysicsAggregate(this.mesh, PhysicsShapeType.MESH, { mass: 0 }, this.mesh.getScene());
            //this.aggregate.body.disablePreStep = false;

            this.physicsShape = new PhysicsShapeMesh(this.mesh, this.mesh.getScene());

            this.parentAggregate.shape.addChildFromParent(this.parent, this.physicsShape, this.mesh);
            //this.aggregate.shape.addChildFromParent(this.parent.node, this.aggregate.shape, this.mesh);
        }
    }

    public getBoundingRadius(): number {
        return this.chunkSideLength / 2;
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
