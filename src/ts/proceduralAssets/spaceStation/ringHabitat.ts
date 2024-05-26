import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Axis } from "@babylonjs/core";
import { Space } from "@babylonjs/core/Maths/math.axis";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { RingHabitatMaterial } from "./ringHabitatMaterial";

export function createRingHabitat(scene: Scene): TransformNode {
    const root = new TransformNode("HelixHabitatRoot");

    const radius = 2e3 + Math.random() * 2e3;

    const tubeDiameter = 100 + Math.random() * 100;

    const attachmentNbSides = 4 + 2 * Math.floor(Math.random() * 4);

    const tesselation = attachmentNbSides * 8;

    const attachment = MeshBuilder.CreateCylinder(
        "HelixHabitatAttachment",
        {
            diameterTop: 100,
            diameterBottom: 100,
            height: tubeDiameter * 3,
            tessellation: attachmentNbSides
        },
        scene
    );
    attachment.rotate(Axis.Y, Math.PI / attachmentNbSides, Space.WORLD);
    attachment.parent = root;

    const ring = MeshBuilder.CreateTorus(
        "RingHabitat",
        {
            diameter: 2 * radius,
            thickness: tubeDiameter,
            tessellation: tesselation
        },
        scene
    );

    ring.material = new RingHabitatMaterial(scene);

    ring.parent = root;

    const nbArms = attachmentNbSides / 2;
    for (let i = 0; i <= nbArms; i++) {
        const arm = MeshBuilder.CreateBox(
            "HelixHabitatArm",
            {
                width: 2 * radius,
                depth: tubeDiameter / 3,
                height: tubeDiameter / 3
            },
            scene
        );

        const theta = (i / nbArms) * Math.PI * 2;

        arm.rotate(Axis.Y, theta, Space.WORLD);

        arm.parent = root;
    }

    return root;
}
