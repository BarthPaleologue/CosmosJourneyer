import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";

export interface IPatch {
    /**
     * Clears all instances from the patch. They will be disposed and will not render anymore.
     * The copy of the given base mesh will also be disposed.
     * The matrix buffer will be kept though, which means that calling createInstances() will reuse the same buffer.
     */
    clearInstances(): void;

    /**
     * Creates instances of a copy of the given base mesh (or transform node in the case of HierarchyInstancePatch).
     * The instances will be positioned according to the matrix buffer given in the constructor.
     * @param baseMesh The mesh to create instances from.
     * @throws Error if baseMesh is not a Mesh in the case of InstancePatch and ThinInstancePatch.
     */
    createInstances(baseMesh: TransformNode): void;

    /**
     * Returns the number of instances currently rendered.
     */
    getNbInstances(): number;

    /**
     * Returns the position of the patch.
     */
    getPosition(): Vector3;

    /**
     * Disposes the patch and all its instances and buffers.
     */
    dispose(): void;
}
