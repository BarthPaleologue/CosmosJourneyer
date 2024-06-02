import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { createHelix } from "../../../utils/helixBuilder";
import { Axis } from "@babylonjs/core";
import { Space } from "@babylonjs/core/Maths/math.axis";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { RingHabitatMaterial } from "./ringHabitatMaterial";
import { Transformable } from "../../../architecture/transformable";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { computeRingRotationPeriod } from "../../../utils/ringRotation";
import { Settings } from "../../../settings";

export class HelixHabitat implements Transformable {
    private readonly root: TransformNode;

    private readonly radius: number;

    private readonly attachment: Mesh;

    private readonly helix1: Mesh;
    private readonly helix2: Mesh;

    private readonly helixMaterial: RingHabitatMaterial;

    private readonly arms: Mesh[] = [];

    constructor(scene: Scene) {
        this.root = new TransformNode("HelixHabitatRoot", scene);

        const nbSpires = 2 + Math.floor(Math.random() * 2);

        const pitch = 4e3 * (1 + 0.3 * (Math.random() * 2 - 1));

        this.radius = 2e3 + Math.random() * 2e3;

        const tubeDiameter = 100 + Math.random() * 100;

        const totalLength = pitch * nbSpires;

        const attachmentNbSides = 6 + 2 * Math.floor(Math.random() * 2);

        const tesselation = attachmentNbSides * 8;

        this.attachment = MeshBuilder.CreateCylinder(
            "HelixHabitatAttachment",
            {
                diameterTop: 100,
                diameterBottom: 100,
                height: totalLength,
                tessellation: attachmentNbSides
            },
            scene
        );
        this.attachment.rotate(Axis.Y, Math.PI / attachmentNbSides, Space.WORLD);
        this.attachment.parent = this.getTransform();

        this.helix1 = createHelix(
            "HelixHabitat",
            {
                radius: this.radius,
                tubeDiameter: tubeDiameter,
                tessellation: tesselation,
                pitch: pitch,
                spires: nbSpires
            },
            scene
        );
        this.helix2 = createHelix(
            "HelixHabitat",
            {
                radius: this.radius,
                tubeDiameter: tubeDiameter,
                tessellation: tesselation,
                pitch: pitch,
                spires: nbSpires
            },
            scene
        );
        this.helix2.rotate(Axis.Y, Math.PI, Space.WORLD);

        this.helix1.parent = this.getTransform();
        this.helix2.parent = this.getTransform();

        this.helixMaterial = new RingHabitatMaterial(scene);

        this.helix1.material = this.helixMaterial;
        this.helix2.material = this.helixMaterial;

        const nbArms = (attachmentNbSides * nbSpires) / 2;
        for (let i = 0; i <= nbArms; i++) {
            const arm = MeshBuilder.CreateBox(
                `HelixHabitatArm${i}`,
                {
                    width: 2 * this.radius,
                    depth: tubeDiameter / 3,
                    height: tubeDiameter / 3
                },
                scene
            );

            const y = (i / nbArms) * totalLength - totalLength / 2;

            const theta = (y / pitch) * Math.PI * 2;

            arm.position.y = y;
            arm.rotate(Axis.Y, theta, Space.WORLD);

            arm.parent = this.getTransform();

            this.arms.push(arm);
        }
    }

    update(stellarObjects: Transformable[], deltaSeconds: number) {
        this.getTransform().rotate(Axis.Y, deltaSeconds / computeRingRotationPeriod(this.radius, Settings.G_EARTH));
        this.helixMaterial.update(stellarObjects);
    }

    getTransform(): TransformNode {
        return this.root;
    }

    dispose() {
        this.root.dispose();
        this.attachment.dispose();
        this.helixMaterial.dispose();
        this.helix1.dispose();
        this.helix2.dispose();
        this.arms.forEach((arm) => arm.dispose());
    }
}
