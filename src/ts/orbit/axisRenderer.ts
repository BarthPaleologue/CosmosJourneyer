import { LinesMesh, MeshBuilder } from "@babylonjs/core/Meshes";
import { Color3, Vector3 } from "@babylonjs/core/Maths/math";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { BoundingSphere } from "../architecture/boundingSphere";
import { Transformable } from "../architecture/transformable";

/**
 * Visual helper designed to display the rotation axis of given objects
 */
export class AxisRenderer {
    private axisMeshes: LinesMesh[] = [];

    private axisMaterial: StandardMaterial | null = null;

    private _isVisible = false;

    /**
     * Disposes all previously created axis meshes by calling reset() and then creates new axis meshes for the given objects
     * @param objects
     */
    setObjects(objects: (Transformable & BoundingSphere)[]) {
        if(this.axisMaterial === null) {
            this.axisMaterial = new StandardMaterial("axisMaterial");
            this.axisMaterial.emissiveColor = Color3.White();
            this.axisMaterial.disableLighting = true;
        }

        this.reset();

        for (const object of objects) {
            this.createAxisMesh(object);
        }

        this.setVisibility(this._isVisible);
    }


    private createAxisMesh(orbitalObject: Transformable & BoundingSphere) {
        const rotationAxisHelper = MeshBuilder.CreateLines(
            `RotationAxisHelper`,
            {
                points: [new Vector3(0, -orbitalObject.getBoundingRadius() * 2, 0), new Vector3(0, orbitalObject.getBoundingRadius() * 2, 0)]
            },
            orbitalObject.getTransform().getScene()
        );
        rotationAxisHelper.parent = orbitalObject.getTransform();
        if (this.axisMaterial === null) throw new Error("Orbit material is null");
        rotationAxisHelper.material = this.axisMaterial;
        this.axisMeshes.push(rotationAxisHelper);
    }

    /**
     * Set the visibility of the axis of rotations
     * @param visible
     */
    setVisibility(visible: boolean) {
        this._isVisible = visible;
        for (const axisMesh of this.axisMeshes) {
            axisMesh.visibility = visible ? 1 : 0;
        }
    }

    /**
     * @returns true if the axis of rotations are currently displayed
     */
    isVisible(): boolean {
        return this._isVisible;
    }

    /**
     * Dispose all axis meshes
     * @private
     */
    public reset() {
        this.axisMeshes.forEach((orbitMesh) => orbitMesh.dispose());
        this.axisMeshes = [];
    }
}
