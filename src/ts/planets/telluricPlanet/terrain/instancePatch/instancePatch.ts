import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { IPatch } from "./iPatch";
import { createSquareMatrixBuffer, decomposeModelMatrix } from "./matrixBuffer";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";

export class InstancePatch implements IPatch {
    private baseMesh: Mesh | null = null;
    readonly position: Vector3;

    readonly instances: InstancedMesh[] = [];
    private positions: Vector3[] = [];
    private rotations: Quaternion[] = [];
    private scalings: Vector3[] = [];

    constructor(position: Vector3, matrixBuffer: Float32Array) {
        this.position = position;

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
        if (this.baseMesh === null) return;
        for (const instance of this.instances) {
            instance.dispose();
        }
        this.instances.length = 0;
        this.baseMesh.dispose();
        this.baseMesh = null;
    }

    public static CreateSquare(position: Vector3, size: number, resolution: number) {
        const buffer = createSquareMatrixBuffer(position, size, resolution);
        return new InstancePatch(position, buffer);
    }

    public createInstances(baseMesh: TransformNode): void {
        this.clearInstances();
        if (!(baseMesh instanceof Mesh)) {
            throw new Error("Tried to create instances from a non-mesh object. Try using HierarchyInstancePatch instead if you want to use a TransformNode.");
        }
        this.baseMesh = baseMesh.clone();
        this.baseMesh.makeGeometryUnique();
        this.baseMesh.isVisible = false;

        for (let i = 0; i < this.positions.length; i++) {
            const instance = this.baseMesh.createInstance(`instance${i}`);
            instance.position.copyFrom(this.positions[i].add(this.baseMesh.position));
            instance.rotationQuaternion = this.rotations[i];
            instance.scaling.copyFrom(this.scalings[i]);
            this.instances.push(instance);

            instance.checkCollisions = baseMesh.checkCollisions;
        }
    }

    public setEnabled(enabled: boolean) {
        if (this.baseMesh === null) return;
        this.baseMesh.setEnabled(enabled);
    }

    public getNbInstances(): number {
        if (this.baseMesh === null) return 0;
        return this.baseMesh.instances.length;
    }

    public getPosition(): Vector3 {
        return this.position;
    }

    public dispose() {
        this.clearInstances();
        if (this.baseMesh !== null) this.baseMesh.dispose();
    }
}
