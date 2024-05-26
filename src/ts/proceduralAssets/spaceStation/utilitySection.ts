import { Scene } from "@babylonjs/core/scene";
import { SpaceStationAssets } from "./spaceStationAssets";
import { Transformable } from "../../architecture/transformable";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";

export class UtilitySection implements Transformable {
    private readonly node: TransformNode;

    constructor(scene: Scene) {
        this.node = MeshBuilder.CreateBox("UtilitySectionRoot", {
            height: 700,
            width: 100,
            depth: 100
        }, scene);

        const boundingVectors = this.node.getHierarchyBoundingVectors();
        const boundingExtendSize = boundingVectors.max.subtract(boundingVectors.min).scale(0.5);

        if(Math.random() < 0.4) {
            const solarPanel1 = SpaceStationAssets.SOLAR_PANEL.createInstance("SolarPanel");
            solarPanel1.scalingDeterminant = 4;
            solarPanel1.parent = this.getTransform();

            const newBoundingVectors = solarPanel1.getHierarchyBoundingVectors();
            const newBoundingExtendSize = newBoundingVectors.max.subtract(newBoundingVectors.min).scale(0.5);

            const previousSectionSizeX = boundingExtendSize.x;
            const newSectionX = newBoundingExtendSize.x;
            solarPanel1.position.x = previousSectionSizeX + newSectionX;


            const solarPanel2 = SpaceStationAssets.SOLAR_PANEL.createInstance("SolarPanel");
            solarPanel2.scalingDeterminant = 4;
            solarPanel2.parent = this.getTransform();
            solarPanel2.position.x = solarPanel1.position.x;
            solarPanel2.rotateAround(Vector3.Zero(), Axis.Y, Math.PI);

        } else if(Math.random() < 0.3) {
            for (let ring = -1; ring <= 1; ring++) {
                for (let sideIndex = 0; sideIndex < 4; sideIndex++) {
                    const tank = SpaceStationAssets.SPHERICAL_TANK.createInstance("SphericalTank");
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

    getTransform(): TransformNode {
        return this.node;
    }

    dispose() {
        this.node.dispose();
    }
}
