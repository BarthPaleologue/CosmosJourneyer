import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { createHelix } from "../../utils/helixBuilder";
import { Axis } from "@babylonjs/core";
import { Space } from "@babylonjs/core/Maths/math.axis";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";

export function createHelixHabitat(scene: Scene): TransformNode {
    const root = new TransformNode("HelixHabitatRoot");

    const nbSpires = 2 + Math.floor(Math.random() * 2)

    const pitch = 4e3 * (1 + 0.3 * (Math.random() * 2 - 1))

    const radius = 2e3 + Math.random() * 2e3;

    const tubeDiameter = 100 + Math.random() * 100;

    const totalLength = pitch * nbSpires;

    const attachmentNbSides = 6 + 2 * Math.floor(Math.random() * 2);

    const tesselation = attachmentNbSides * 8;

    const attachment = MeshBuilder.CreateCylinder(
        "HelixHabitatAttachment",
        {
            diameterTop: 100,
            diameterBottom: 100,
            height: totalLength,
            tessellation: attachmentNbSides
        },
        scene
    );
    attachment.rotate(Axis.Y, Math.PI / attachmentNbSides, Space.WORLD);
    attachment.parent = root;

    const helix1 = createHelix(
        "HelixHabitat",
        {
            radius: radius,
            tubeDiameter: tubeDiameter,
            tessellation: tesselation,
            pitch: pitch,
            spires: nbSpires
        },
        scene
    );
    const helix2 = createHelix(
        "HelixHabitat",
        {
            radius: radius,
            tubeDiameter: tubeDiameter,
            tessellation: tesselation,
            pitch: pitch,
            spires: nbSpires
        },
        scene
    );
    helix2.rotate(Axis.Y, Math.PI, Space.WORLD);

    helix1.parent = root;
    helix2.parent = root;

    const nbArms = (attachmentNbSides * nbSpires) / 2;
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

        const y = (i / nbArms) * totalLength - totalLength / 2;

        const theta = (y / pitch) * Math.PI * 2;

        arm.position.y = y;
        arm.rotate(Axis.Y, theta, Space.WORLD);

        arm.parent = root;
    }

    return root;
}
