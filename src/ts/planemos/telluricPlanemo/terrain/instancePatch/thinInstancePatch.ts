import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import "@babylonjs/core/Meshes/thinInstanceMesh";
import { createSquareMatrixBuffer } from "../utils/matrixBuffer";
import { IPatch } from "./iPatch";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";

export class ThinInstancePatch implements IPatch {
    private baseMesh: Mesh | null = null;
    private readonly position: Vector3;
    readonly matrixBuffer: Float32Array;

    constructor(patchPosition: Vector3, matrixBuffer: Float32Array) {
        this.position = patchPosition;
        this.matrixBuffer = matrixBuffer;
    }

    public static CreateSquare(position: Vector3, size: number, resolution: number) {
        const buffer = createSquareMatrixBuffer(position, size, resolution);
        return new ThinInstancePatch(position, buffer);
    }

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
        this.baseMesh.isVisible = true;
        this.baseMesh.thinInstanceSetBuffer("matrix", this.matrixBuffer, 16);
    }

    public getNbInstances(): number {
        if (this.baseMesh === null) return 0;
        return this.baseMesh.thinInstanceCount;
    }

    public getPosition(): Vector3 {
        return this.position;
    }

    public dispose() {
        this.clearInstances();
        if (this.baseMesh !== null) this.baseMesh.dispose();
    }
}
