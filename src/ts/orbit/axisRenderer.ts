import { LinesMesh, MeshBuilder } from "@babylonjs/core/Meshes";
import { Color3, Vector3 } from "@babylonjs/core/Maths/math";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Transformable } from "../uberCore/transforms/basicTransform";
import { BoundingSphere } from "../bodies/cullable";

export class AxisRenderer {
    private axisMeshes: LinesMesh[] = [];

    private axisMaterial: StandardMaterial | null = null;

    private isVisibile = false;

    setObjects(objects: (Transformable & BoundingSphere)[]) {
        this.reset();

        for (const object of objects) {
            this.createAxisMesh(object);
        }

        this.setVisibility(this.isVisibile);
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

    setVisibility(visible: boolean) {
        this.isVisibile = visible;
        for (const axisMesh of this.axisMeshes) {
            axisMesh.visibility = visible ? 1 : 0;
        }
    }

    isVisible(): boolean {
        return this.isVisibile;
    }

    private reset() {
        this.axisMeshes.forEach((orbitMesh) => orbitMesh.dispose());
        this.axisMeshes = [];

        this.axisMaterial = new StandardMaterial("axisMaterial");
        this.axisMaterial.emissiveColor = Color3.White();
        this.axisMaterial.disableLighting = true;
    }
}
