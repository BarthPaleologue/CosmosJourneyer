import { Mesh } from "@babylonjs/core/Meshes/mesh";
import "@babylonjs/core/Meshes/thinInstanceMesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";

export class ThinInstancePatch {
    private baseMesh: Mesh | null = null;
    readonly matrixBuffer: Float32Array;
    readonly parent: TransformNode;

    constructor(parent: TransformNode, matrixBuffer: Float32Array) {
        this.parent = parent;
        this.matrixBuffer = matrixBuffer;
    }

    /*public static CreateSquare(position: Vector3, size: number, resolution: number) {
        const buffer = createSquareMatrixBuffer(position, size, resolution);
        return new ThinInstancePatch(position, buffer);
    }*/

    public clearInstances(): void {
        if (this.baseMesh === null) return;
        this.baseMesh.thinInstanceCount = 0;
        this.baseMesh.dispose();
        this.baseMesh = null;
    }

    public createInstances(baseMesh: TransformNode): void {
        this.clearInstances();
        if (!(baseMesh instanceof Mesh)) {
            throw new Error("Tried to create instances from a non-mesh object. Try using HierarchyInstancePatch instead if you want to use a TransformNode.");
        }
        this.baseMesh = baseMesh.clone();
        this.baseMesh.makeGeometryUnique();

        this.baseMesh.parent = this.parent;
        //this.baseMesh.computeWorldMatrix(true);
        //this.baseMesh.parent = null;

        this.baseMesh.isVisible = true;
        this.baseMesh.thinInstanceSetBuffer("matrix", this.matrixBuffer, 16);
    }

    public getNbInstances(): number {
        if (this.baseMesh === null) return 0;
        return this.baseMesh.thinInstanceCount;
    }

    public dispose() {
        this.clearInstances();
        if (this.baseMesh !== null) this.baseMesh.dispose();
    }
}
