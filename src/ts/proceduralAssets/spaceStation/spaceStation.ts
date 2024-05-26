import { HelixHabitat } from "./helixHabitat";
import { RingHabitat } from "./ringHabitat";
import { Transformable } from "../../architecture/transformable";
import { Scene } from "@babylonjs/core/scene";
import { SpaceStationNodeType } from "./spaceStationNode";
import { sigmoid } from "../../utils/math";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { UtilitySection } from "./utilitySection";

export class SpaceStation implements Transformable {
    helixHabitats: HelixHabitat[] = [];
    ringHabitats: RingHabitat[] = [];

    private readonly root: TransformNode;

    constructor(scene: Scene) {
        this.root = new TransformNode("SpaceStationRoot", scene);

        let lastNode: TransformNode | null = null;

        let urgeToCreateHabitat = 0;
        for (let i = 0; i < 20; i++) {
            let nodeType = SpaceStationNodeType.UTILITY_SECTION;
            if (Math.random() < sigmoid(urgeToCreateHabitat - 6) && urgeToCreateHabitat > 0) {
                nodeType = Math.random() < 0.5 ? SpaceStationNodeType.RING_HABITAT : SpaceStationNodeType.HELIX_HABITAT;
            }

            let newNode: TransformNode | null = null;

            if (nodeType === SpaceStationNodeType.UTILITY_SECTION) {
                const utilitySection = new UtilitySection(scene);
                newNode = utilitySection.getTransform();
            } else if (nodeType === SpaceStationNodeType.HELIX_HABITAT) {
                const helixHabitat = new HelixHabitat(scene);
                this.helixHabitats.push(helixHabitat);
                newNode = helixHabitat.getTransform();
                urgeToCreateHabitat = 0;
            } else if (nodeType === SpaceStationNodeType.RING_HABITAT) {
                const ringHabitat = new RingHabitat(scene);
                this.ringHabitats.push(ringHabitat);
                newNode = ringHabitat.getTransform();
                urgeToCreateHabitat = 0;
            }

            if (newNode === null) {
                throw new Error("Node creation failed");
            }

            if (lastNode !== null) {
                const previousBoundingVectors = lastNode.getHierarchyBoundingVectors();
                const previousBoundingExtendSize = previousBoundingVectors.max.subtract(previousBoundingVectors.min).scale(0.5);

                const newBoundingVectors = newNode.getHierarchyBoundingVectors();
                const newBoundingExtendSize = newBoundingVectors.max.subtract(newBoundingVectors.min).scale(0.5);

                const previousSectionSizeY = previousBoundingExtendSize.y;
                const newSectionY = newBoundingExtendSize.y;

                newNode.position = lastNode.position.add(lastNode.up.scale(previousSectionSizeY + newSectionY));
            }

            lastNode = newNode;
            urgeToCreateHabitat++;
        }
    }

    update(stellarObjects: Transformable[], deltaSeconds: number) {
        this.helixHabitats.forEach((helixHabitat) => helixHabitat.update(deltaSeconds));
        this.ringHabitats.forEach((ringHabitat) => ringHabitat.update(deltaSeconds));
    }

    getTransform(): TransformNode {
        return this.root;
    }

    dispose() {
        this.helixHabitats.forEach((helixHabitat) => helixHabitat.dispose());
        this.ringHabitats.forEach((ringHabitat) => ringHabitat.dispose());
    }
}
