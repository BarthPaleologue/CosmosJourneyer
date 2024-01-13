import { Direction, getQuaternionFromDirection } from "../../../../utils/direction";
import { getChunkPlaneSpacePositionFromPath } from "../../../../utils/chunkUtils";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Material } from "@babylonjs/core/Materials/material";
import { Scene } from "@babylonjs/core/scene";
import "@babylonjs/core/Engines/Extensions/engine.query";
import { TransformNode, VertexData } from "@babylonjs/core/Meshes";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShape, PhysicsShapeMesh } from "@babylonjs/core/Physics/v2/physicsShape";
import { Observable } from "@babylonjs/core/Misc/observable";
import { Transformable } from "../../../../uberCore/transforms/basicTransform";
import { ThinInstancePatch } from "../instancePatch/thinInstancePatch";
import { randomDownSample } from "../instancePatch/matrixBuffer";
import { Assets } from "../../../../assets";
import { CollisionMask } from "../../../../settings";
import { isSizeOnScreenEnough } from "../../../../utils/isObjectVisibleOnScreen";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { IPatch } from "../instancePatch/iPatch";
import { createGrassBlade } from "../../../../proceduralAssets/grass/grassBlade";
import { TelluricPlanemoModel } from "../../telluricPlanemoModel";

export class PlanetChunk implements Transformable {
    public readonly mesh: Mesh;
    private readonly depth: number;
    public readonly cubePosition: Vector3;

    private readonly transform: TransformNode;

    readonly planetModel: TelluricPlanemoModel;

    readonly chunkSideLength: number;

    private loaded = false;

    private readonly parent: TransformNode;

    private readonly instancePatches: IPatch[] = [];

    readonly onDestroyPhysicsShapeObservable = new Observable<number>();

    readonly onRecieveVertexDataObservable = new Observable<void>();

    private physicsShape: PhysicsShape | null = null;
    physicsShapeIndex: number | null = null;
    readonly parentAggregate: PhysicsAggregate;

    private averageHeight = 0;

    readonly helpers: Mesh[] = [];

    private disposed = false;

    constructor(path: number[], direction: Direction, parentAggregate: PhysicsAggregate, material: Material, planetModel: TelluricPlanemoModel, rootLength: number, scene: Scene) {
        const id = `D${direction}P${path.join("")}`;

        this.depth = path.length;

        this.chunkSideLength = rootLength / 2 ** this.depth;

        this.transform = new TransformNode(`${id}Transform`, scene);

        this.planetModel = planetModel;

        this.mesh = new Mesh(`Chunk${id}`, scene);
        this.mesh.setEnabled(false);

        this.mesh.material = material;
        //this.mesh.material = Assets.DebugMaterial(id, false, false);

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

    /**
     * Initializes the chunk with the given vertex data. Scatters instances on the chunk based on the given instancesMatrixBuffer and alignedInstancesMatrixBuffer
     * @param vertexData the vertex data to apply to the chunk
     * @param instancesMatrixBuffer the matrix buffer containing the instances matrix
     * @param alignedInstancesMatrixBuffer the matrix buffer containing the vertically aligned instances matrix
     * @param averageHeight
     */
    public init(vertexData: VertexData, instancesMatrixBuffer: Float32Array, alignedInstancesMatrixBuffer: Float32Array, averageHeight: number) {
        if (this.hasBeenDisposed()) {
            throw new Error(`Tried to init ${this.mesh.name} but it has been disposed`);
        }

        vertexData.applyToMesh(this.mesh, false);
        // The following is a code snippet to use the approximate normals of the mesh instead of
        // the analytic normals. This is useful for debugging purposes
        /*if(!analyticNormal) {
        this.mesh.createNormals(true);
        const normals = this.mesh.getVerticesData(VertexBuffer.NormalKind);
        if (normals === null) throw new Error("Mesh has no normals");
        for(let i = 0; i < normals.length; i++) {
            normals[i] = -normals[i];
        }
        this.mesh.setVerticesData(VertexBuffer.NormalKind, normals);
    }*/
        this.mesh.freezeNormals();

        if (this.depth > 3) {
            this.physicsShape = new PhysicsShapeMesh(this.mesh, this.mesh.getScene());
            this.physicsShape.filterMembershipMask = CollisionMask.GROUND;
            this.parentAggregate.shape.addChildFromParent(this.parent, this.physicsShape, this.mesh);
            this.physicsShapeIndex = this.parentAggregate.shape.getNumChildren();
        }
        this.mesh.setEnabled(true);
        this.loaded = true;

        this.averageHeight = averageHeight;

        this.onRecieveVertexDataObservable.notifyObservers();

        const rockPatch = new ThinInstancePatch(this.parent, randomDownSample(alignedInstancesMatrixBuffer, 2));
        rockPatch.createInstances(Assets.Rock);
        this.instancePatches.push(rockPatch);

        if(this.planetModel.physicalProperties.pressure > 0 && this.planetModel.physicalProperties.oceanLevel > 0) {
            const treePatch = new ThinInstancePatch(this.parent, randomDownSample(instancesMatrixBuffer, 3));
            treePatch.createInstances(Assets.Tree);
            this.instancePatches.push(treePatch);

            /*const grassPatch = new ThinInstancePatch(this.parent, instancesMatrixBuffer);
            grassPatch.createInstances(createGrassBlade(this.mesh.getScene(), 3));
            this.instancePatches.push(grassPatch);*/
        }
    }

    public getAverageHeight(): number {
        return this.averageHeight;
    }

    private destroyPhysicsShape() {
        if (this.physicsShapeIndex === null) return;
        if (this.physicsShapeIndex > this.parentAggregate.shape.getNumChildren() - 1) {
            console.error(
                `Tried to delete ${this.mesh.name} PhysicsShape. However its shape index was out of bound: ${this.physicsShapeIndex} / range 0 : ${
                    this.parentAggregate.shape.getNumChildren() - 1
                }`
            );
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
        this.helpers.forEach((helper) => helper.dispose());
        this.instancePatches.forEach((patch) => patch.dispose());
        this.mesh.dispose();
        this.transform.dispose();
        this.onRecieveVertexDataObservable.clear();

        this.disposed = true;
    }

    computeCulling(camera: Camera) {
        if (!this.isReady()) return;

        this.mesh.setEnabled(true); // this is needed to update the world matrix
        this.getTransform().computeWorldMatrix(true);

        const distanceVector = camera.globalPosition.subtract(this.getTransform().getAbsolutePosition());
        const dirToCenterOfPlanet = this.getTransform().getAbsolutePosition().subtract(this.parent.getAbsolutePosition()).normalizeToNew();

        const normalComponent = dirToCenterOfPlanet.scale(distanceVector.dot(dirToCenterOfPlanet));

        const tangentialDistance = distanceVector.subtract(normalComponent).length();

        this.instancePatches.forEach((patch) => {
            patch.setEnabled(tangentialDistance < 200);
        });

        this.mesh.setEnabled(isSizeOnScreenEnough(this, camera));
    }
}
