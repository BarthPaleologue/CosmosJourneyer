import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Axis } from "@babylonjs/core";
import { Space } from "@babylonjs/core/Maths/math.axis";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { RingHabitatMaterial } from "./ringHabitatMaterial";
import { Updatable } from "../../utils/updatable";
import { Transformable } from "../../architecture/transformable";
import { computeRingRotationPeriod } from "../../utils/ringRotation";
import { Settings } from "../../settings";
import { Mesh } from "@babylonjs/core/Meshes/mesh";

export class RingHabitat implements Transformable, Updatable {
    
    private readonly root: TransformNode;

    private readonly radius: number;

    private readonly ringMaterial: RingHabitatMaterial;

    private readonly ring: Mesh;

    private readonly attachment: Mesh;

    private readonly arms: Mesh[] = [];

    constructor(scene: Scene) {
        this.root = new TransformNode("HelixHabitatRoot");

        this.radius = 2e3 + Math.random() * 2e3;

        const tubeDiameter = 100 + Math.random() * 100;

        const attachmentNbSides = 4 + 2 * Math.floor(Math.random() * 4);

        const tesselation = attachmentNbSides * 8;

        this.attachment = MeshBuilder.CreateCylinder(
            "HelixHabitatAttachment",
            {
                diameterTop: 100,
                diameterBottom: 100,
                height: tubeDiameter * 3,
                tessellation: attachmentNbSides
            },
            scene
        );
        this.attachment.rotate(Axis.Y, Math.PI / attachmentNbSides, Space.WORLD);
        this.attachment.parent = this.getTransform();

        this.ring = MeshBuilder.CreateTorus(
            "RingHabitat",
            {
                diameter: 2 * this.radius,
                thickness: tubeDiameter,
                tessellation: tesselation
            },
            scene
        );

        this.ringMaterial = new RingHabitatMaterial(scene);

        this.ring.material = this.ringMaterial;

        this.ring.parent = this.getTransform();

        const nbArms = attachmentNbSides / 2;
        for (let i = 0; i <= nbArms; i++) {
            const arm = MeshBuilder.CreateBox(
                "HelixHabitatArm",
                {
                    width: 2 * this.radius,
                    depth: tubeDiameter / 3,
                    height: tubeDiameter / 3
                },
                scene
            );

            const theta = (i / nbArms) * Math.PI * 2;

            arm.rotate(Axis.Y, theta, Space.WORLD);

            arm.parent = this.getTransform();

            this.arms.push(arm);
        }
    }

    update(deltaSeconds: number) {
        this.getTransform().rotate(Axis.Y, deltaSeconds / computeRingRotationPeriod(this.radius, Settings.G_EARTH));
    }

    getTransform(): TransformNode {
        return this.root;
    }

    dispose() {
        this.root.dispose();
        this.attachment.dispose();
        this.ring.dispose();
        this.arms.forEach((arm) => arm.dispose());
    }
}