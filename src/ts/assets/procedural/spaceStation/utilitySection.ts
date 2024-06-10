import { Scene } from "@babylonjs/core/scene";
import { Transformable } from "../../../architecture/transformable";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Objects } from "../../objects";
import { MetalSectionMaterial } from "./metalSectionMaterial";
import { Mesh } from "@babylonjs/core/Meshes/mesh";

export class UtilitySection implements Transformable {
    private readonly node: Mesh;

    private readonly metalSectionMaterial: MetalSectionMaterial;

    constructor(scene: Scene) {
        this.metalSectionMaterial = new MetalSectionMaterial(scene);

        this.node = MeshBuilder.CreateBox("UtilitySectionRoot", {
            height: 700,
            width: 100,
            depth: 100
        }, scene);
        this.node.convertToFlatShadedMesh();
        this.node.material = this.metalSectionMaterial;


        const boundingVectors = this.node.getHierarchyBoundingVectors();
        const boundingExtendSize = boundingVectors.max.subtract(boundingVectors.min).scale(0.5);

        if(Math.random() < 0.3) {
            for (let ring = -1; ring <= 1; ring++) {
                for (let sideIndex = 0; sideIndex < 4; sideIndex++) {
                    const tank = Objects.SPHERICAL_TANK.createInstance("SphericalTank");
                    tank.scalingDeterminant = 5;

                    const newBoundingVectors = tank.getHierarchyBoundingVectors();
                    const newBoundingExtendSize = newBoundingVectors.max.subtract(newBoundingVectors.min).scale(0.5);

                    tank.position.x = boundingExtendSize.x + newBoundingExtendSize.x;
                    tank.parent = this.getTransform();

                    tank.rotateAround(Vector3.Zero(), Axis.Y, (Math.PI / 2) * sideIndex);
                    tank.translate(Axis.Y, ring * 40);
                }
            }
        }
    }

    update(stellarObjects: Transformable[]) {
        this.metalSectionMaterial.update(stellarObjects);
    }

    getTransform(): TransformNode {
        return this.node;
    }

    dispose() {
        this.node.dispose();
        this.metalSectionMaterial.dispose();
    }
}
