import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Axis } from "@babylonjs/core";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Transformable } from "../../../architecture/transformable";
import { computeRingRotationPeriod } from "../../../utils/ringRotation";
import { Settings } from "../../../settings";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { CylinderHabitatMaterial } from "./cylinderHabitatMaterial";

export class CylinderHabitat implements Transformable {
    private readonly root: TransformNode;

    private readonly radius: number;

    private readonly cylinderMaterial: CylinderHabitatMaterial;

    private readonly cylinder: Mesh;

    constructor(scene: Scene) {
        this.root = new TransformNode("CylinderHabitatRoot", scene);

        this.radius = 1e3 + Math.random() * 2e3;

        const height = 30e3 + Math.random() * 10e3;

        this.cylinder = MeshBuilder.CreateCylinder(
            "CylinderHabitat",
            {
                diameter: this.radius * 2,
                height: height,
                tessellation: 32
            },
            scene
        );
        this.cylinder.convertToFlatShadedMesh();

        this.cylinderMaterial = new CylinderHabitatMaterial(this.radius, height, scene);

        this.cylinder.material = this.cylinderMaterial;

        this.cylinder.parent = this.getTransform();
    }

    update(stellarObjects: Transformable[], deltaSeconds: number) {
        this.getTransform().rotate(Axis.Y, deltaSeconds / computeRingRotationPeriod(this.radius, Settings.G_EARTH));
        this.cylinderMaterial.update(stellarObjects);
    }

    getTransform(): TransformNode {
        return this.root;
    }

    dispose() {
        this.root.dispose();
        this.cylinder.dispose();
        this.cylinderMaterial.dispose();
    }
}
