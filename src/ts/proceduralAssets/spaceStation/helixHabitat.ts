import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { createHelix } from "../../utils/helixBuilder";
import { Axis } from "@babylonjs/core";
import { Space } from "@babylonjs/core/Maths/math.axis";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";

export function createHelixHabitat(scene: Scene): TransformNode {
    const root = new TransformNode("HelixHabitatRoot");

    const nbSpires = 2;

    const pitch = 4e3;

    const helix1 = createHelix("HelixHabitat", { radius: 2e3, tubeDiameter: 100, tessellation: 32, pitch: pitch, spires: nbSpires }, scene);
    const helix2 = createHelix("HelixHabitat", { radius: 2e3, tubeDiameter: 100, tessellation: 32, pitch: pitch, spires: nbSpires }, scene);
    helix2.rotate(Axis.Y, Math.PI, Space.WORLD);

    helix1.parent = root;
    helix2.parent = root;

    const totalLength = pitch * nbSpires;

    const attachment = MeshBuilder.CreateCylinder("HelixHabitatAttachment", { diameterTop: 100, diameterBottom: 100, height: totalLength, tessellation: 6 }, scene);
    attachment.parent = root;

    return root;
}