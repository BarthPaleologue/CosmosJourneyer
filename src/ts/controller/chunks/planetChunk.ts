import { Direction, getQuaternionFromDirection } from "../../utils/direction";
import { getChunkPlaneSpacePositionFromPath } from "../../utils/chunkUtils";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Material } from "@babylonjs/core/Materials/material";
import { Transformable } from "../../view/common";
import { Scene } from "@babylonjs/core/scene";
import "@babylonjs/core/Engines/Extensions/engine.query";
import { TransformNode, VertexData } from "@babylonjs/core/Meshes";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShape, PhysicsShapeMesh } from "@babylonjs/core/Physics/v2/physicsShape";
import { Observable } from "@babylonjs/core/Misc/observable";

export class PlanetChunk implements Transformable {
    public readonly mesh: Mesh;
    private readonly depth: number;
    public readonly cubePosition: Vector3;

    private readonly transform: TransformNode;

    readonly chunkSideLength: number;

    private loaded = false;

    private readonly parent: TransformNode;

    readonly onDestroyPhysicsShapeObservable = new Observable<number>();

    readonly onRecieveVertexDataObservable = new Observable<void>();

    private physicsShape: PhysicsShape | null = null;
    physicsShapeIndex: number | null = null;
    readonly parentAggregate: PhysicsAggregate;

    private disposed = false;

    constructor(path: number[], direction: Direction, parentAggregate: PhysicsAggregate, material: Material, rootLength: number, scene: Scene) {
        const id = `D${direction}P${path.join("")}`;

        this.depth = path.length;

        this.chunkSideLength = rootLength / 2 ** this.depth;

        this.transform = new TransformNode(`${id}Transform`, scene);

        this.mesh = new Mesh(`Chunk${id}`, scene);
        this.mesh.setEnabled(false);

        this.mesh.material = material;
        //this.mesh.material = Assets.DebugMaterial(id); //material;
        //(this.mesh.material as StandardMaterial).disableLighting = true;
        //this.mesh.material.wireframe = true;

        this.transform.parent = parentAggregate.transformNode;
        this.mesh.parent = this.transform;

        //this.mesh.occlusionQueryAlgorithmType = AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE;
        //this.mesh.occlusionType = AbstractMesh.OCCLUSION_TYPE_STRICT;

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
        if (this.disposed) return;
        vertexData.applyToMesh(this.mesh, false);
        this.mesh.freezeNormals();

        this.physicsShape = new PhysicsShapeMesh(this.mesh, this.mesh.getScene());
        this.parentAggregate.shape.addChildFromParent(this.parent, this.physicsShape, this.mesh);
        this.physicsShapeIndex = this.parentAggregate.shape.getNumChildren();

        this.mesh.setEnabled(true);
        this.loaded = true;

        this.onRecieveVertexDataObservable.notifyObservers();
    }

    private destroyPhysicsShape() {
        if (this.physicsShapeIndex === null) return;
        if (this.physicsShapeIndex > this.parentAggregate.shape.getNumChildren() - 1) {
            console.error(
                `Tried to delete ${this.mesh.name} PhysicsShape. However its shape index was out of bound: ${
                    this.physicsShapeIndex
                } / range 0 : ${this.parentAggregate.shape.getNumChildren() - 1}`
            );
            this.physicsShape?.dispose();
            return;
        }

        this.parentAggregate.shape.removeChild(this.physicsShapeIndex);
        this.physicsShape?.dispose();

        this.onDestroyPhysicsShapeObservable.notifyObservers(this.physicsShapeIndex);
    }

    public registerPhysicsShapeDeletion(shapeIndex: number) {
        if (this.physicsShapeIndex === null) return;
        if (this.physicsShapeIndex > shapeIndex) {
            this.physicsShapeIndex--;
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
        return this.loaded;
    }

    public hasBeenDisposed() {
        return this.disposed;
    }

    public dispose() {
        this.destroyPhysicsShape();
        this.mesh.dispose();
        this.transform.dispose();

        this.disposed = true;
    }
}
