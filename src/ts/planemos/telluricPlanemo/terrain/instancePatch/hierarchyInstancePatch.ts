import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { IPatch } from "./iPatch";
import { createSquareMatrixBuffer, decomposeModelMatrix } from "./matrixBuffer";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Mesh } from "@babylonjs/core/Meshes/mesh";

export class HierarchyInstancePatch implements IPatch {
    private baseRoot: TransformNode | null = null;

    readonly instances: TransformNode[] = [];
    private positions: Vector3[] = [];
    private rotations: Quaternion[] = [];
    private scalings: Vector3[] = [];
    readonly parent: TransformNode;

    constructor(parent: TransformNode, matrixBuffer: Float32Array) {
        this.parent = parent;

        // decompose matrix buffer into position, rotation and scaling
        for (let i = 0; i < matrixBuffer.length; i += 16) {
            const matrixSubBuffer = matrixBuffer.subarray(i, i + 16);
            const position = Vector3.Zero();
            const rotation = Quaternion.Zero();
            const scaling = Vector3.Zero();
            decomposeModelMatrix(matrixSubBuffer, position, rotation, scaling);

            this.positions.push(position);
            this.rotations.push(rotation);
            this.scalings.push(scaling);
        }
    }

    public clearInstances(): void {
        if (this.baseRoot === null) return;
        for (const instance of this.instances) {
            instance.dispose();
        }
        this.instances.length = 0;
        this.baseRoot.dispose();
        this.baseRoot = null;
    }

    public static CreateSquare(parent: TransformNode, position: Vector3, size: number, resolution: number) {
        const buffer = createSquareMatrixBuffer(position, size, resolution);
        return new HierarchyInstancePatch(parent, buffer);
    }

    public createInstances(baseRoot: TransformNode): void {
        this.clearInstances();
        this.baseRoot = baseRoot.clone(baseRoot.name + "Clone", null);
        if (this.baseRoot === null) throw new Error("baseRoot is null");
        this.baseRoot.getChildMeshes().forEach((mesh) => {
            if (mesh instanceof Mesh) {
                mesh.makeGeometryUnique();
                mesh.isVisible = false;
            }
        });

        for (let i = 0; i < this.positions.length; i++) {
            const instanceRoot = this.baseRoot.instantiateHierarchy(null);
            if (instanceRoot === null) throw new Error("instanceRoot is null");
            instanceRoot.position.copyFrom(this.positions[i].add(this.baseRoot.position));
            instanceRoot.rotationQuaternion = this.rotations[i];
            instanceRoot.scaling.copyFrom(this.scalings[i]);

            this.instances.push(instanceRoot);
        }
    }

    public setEnabled(enabled: boolean) {
        if (this.baseRoot === null) return;
        this.baseRoot.setEnabled(enabled);
    }

    public getNbInstances(): number {
        if (this.baseRoot === null) return 0;
        return this.instances.length;
    }

    public dispose() {
        this.clearInstances();
        if (this.baseRoot !== null) this.baseRoot.dispose();
    }
}
