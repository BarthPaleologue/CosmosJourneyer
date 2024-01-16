import { Mesh } from "@babylonjs/core/Meshes/mesh";
import "@babylonjs/core/Meshes/thinInstanceMesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { IPatch } from "./iPatch";
import { applyTransformationToBuffer, createSquareMatrixBuffer } from "./matrixBuffer";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Observer } from "@babylonjs/core";

export class ThinInstancePatch implements IPatch {
    private baseMesh: Mesh | null = null;
    readonly matrixBuffer: Float32Array;
    readonly rawMatrixBuffer: Float32Array;

    readonly parent: TransformNode;
    private parentObserver: Observer<TransformNode> | null = null;

    constructor(parent: TransformNode, matrixBuffer: Float32Array) {
        this.parent = parent;
        this.rawMatrixBuffer = matrixBuffer;
        this.matrixBuffer = applyTransformationToBuffer(parent.computeWorldMatrix(), this.rawMatrixBuffer);
    }

    public static CreateSquare(parent: TransformNode, position: Vector3, size: number, resolution: number) {
        const buffer = createSquareMatrixBuffer(position, size, resolution);
        return new ThinInstancePatch(parent, buffer);
    }

    public clearInstances(): void {
        if (this.baseMesh === null) return;
        this.parent.onAfterWorldMatrixUpdateObservable.remove(this.parentObserver);
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

        let oldPosition = this.parent.getAbsolutePosition().clone();
        this.parentObserver = this.parent.onAfterWorldMatrixUpdateObservable.add(() => {
            const newPosition = this.parent.getAbsolutePosition();
            if (newPosition.equals(oldPosition)) return;
            oldPosition = newPosition.clone();
            this.syncWithParent();
        });

        this.baseMesh.isVisible = true;
        this.baseMesh.thinInstanceSetBuffer("matrix", this.matrixBuffer, 16);
    }

    public syncWithParent(): void {
        if (this.baseMesh === null) throw new Error("Tried to sync with parent but no base mesh was set.");
        this.matrixBuffer.set(applyTransformationToBuffer(this.parent.computeWorldMatrix(), this.rawMatrixBuffer));
        this.baseMesh.thinInstanceBufferUpdated("matrix");
    }

    public getNbInstances(): number {
        if (this.baseMesh === null) return 0;
        return this.baseMesh.thinInstanceCount;
    }

    public setEnabled(enabled: boolean) {
        if (this.baseMesh === null) return;
        if (enabled) {
            this.baseMesh.thinInstanceCount = this.matrixBuffer.length / 16;
        } else {
            this.baseMesh.thinInstanceCount = 0;
        }
    }

    public getBaseMesh(): Mesh {
        if (this.baseMesh === null) throw new Error("Tried to get base mesh but no base mesh was set.");
        return this.baseMesh;
    }

    public dispose() {
        this.clearInstances();
        if (this.baseMesh !== null) this.baseMesh.dispose();
    }
}
